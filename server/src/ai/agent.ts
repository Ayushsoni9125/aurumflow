/**
 * AI Tool Dispatcher and Agent Service.
 * Orchestrates calls to Gemini using the exact allowed tools.
 */

import { GoogleGenAI, Type, Schema } from '@google/genai';
import { getActiveSchemes } from '../repositories/schemeRepository';
import { calculateGoldQuote } from '../services/calculationService';
import { createLead, DuplicateLeadError } from '../repositories/leadRepository';
import { generateApplicationId } from '../utils/applicationId';
import { quoteRequestSchema, createLeadSchema } from '../schemas';

// Initialize SDK (expects GEMINI_API_KEY env var)
const ai = new GoogleGenAI({});

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

const SYSTEM_INSTRUCTION = `You are the AurumFlow AI Gold Loan Assistant. 
You are a helpful, professional, and precise assistant for a gold lending platform.
Your primary role is to answer questions about gold loans, calculate quotes, and help users submit loan applications.

CRITICAL RULES:
1. NEVER calculate, approximate, derive, or modify gold values, pure gold weight, or eligible loan amounts yourself. You MUST use the calculate_quote tool.
2. NEVER invent loan schemes. You MUST use the get_loan_schemes tool to fetch active plans.
3. Every displayed financial amount MUST originate from a successful tool response.
4. You cannot submit an application on behalf of the user unless they have explicitly provided all required details and you have called submit_application. (Note: Actual confirmation is enforced by the application layer).
5. If the user asks an off-topic question (e.g. coding tasks, general investment advice, or about other domains), politely decline and state that you can only help with AurumFlow gold loan applications.
6. Keep your language concise and professional. Do not make promises of loan approval.

If the user wants a quote but is missing information (gross weight, net weight, or karat), ask them for the missing details.
Net weight cannot exceed gross weight. Karat must be 18, 22, or 24.`;

// Define schemas for tools

const getLoanSchemesDeclaration = {
  name: 'get_loan_schemes',
  description: 'Fetches all active gold loan schemes (plans) available to the borrower. Call this to get current interest rates, tenures, and LTVs.',
};

const calculateQuoteDeclaration = {
  name: 'calculate_quote',
  description: 'Calculates pure gold weight, gold value, and eligible loan amounts for all active schemes based on provided weights and karat.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      grossWeightGrams: {
        type: Type.NUMBER,
        description: 'Total weight of the item in grams (must be > 0 and <= 1000)',
      },
      netWeightGrams: {
        type: Type.NUMBER,
        description: 'Weight of the gold after deducting stones/impurities (must be <= grossWeightGrams)',
      },
      karat: {
        type: Type.NUMBER,
        description: 'Purity of the gold. Only 18, 22, or 24 are allowed.',
      },
    },
    required: ['grossWeightGrams', 'netWeightGrams', 'karat'],
  } as Schema,
};

const submitApplicationDeclaration = {
  name: 'submit_application',
  description: 'Submits a gold loan application. ONLY call this when all details are collected. The server requires application-level confirmation state to execute this.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      customerName: { type: Type.STRING, description: 'Customer name (letters and spaces only)' },
      mobileNumber: { type: Type.STRING, description: '10-digit Indian mobile number' },
      grossWeightGrams: { type: Type.NUMBER },
      netWeightGrams: { type: Type.NUMBER },
      karat: { type: Type.NUMBER },
      selectedPlanId: { type: Type.STRING, description: 'ID of the chosen loan scheme' },
      confirmationToken: { type: Type.STRING, description: 'Token indicating explicit UI confirmation' },
    },
    required: ['customerName', 'mobileNumber', 'grossWeightGrams', 'netWeightGrams', 'karat', 'selectedPlanId', 'confirmationToken'],
  } as Schema,
};

const tools = [{
  functionDeclarations: [
    getLoanSchemesDeclaration,
    calculateQuoteDeclaration,
    submitApplicationDeclaration,
  ]
}];

export interface StreamCallbacks {
  onStatus?: (status: string) => void;
  onChunk?: (chunk: string) => void;
}

const FALLBACK_MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-3.1-flash-lite',
  'gemini-3.6-flash',
  'gemini-flash-lite-latest',
  'gemini-3.7-flash',
  'gemini-3.5-flash'
].filter(Boolean) as string[];

/**
 * Handle a chat interaction with real-time streaming chunks and tool dispatching.
 */
export async function handleAiChatStream(
  history: ChatMessage[],
  newMessage: string,
  providedConfirmationToken?: string,
  callbacks?: StreamCallbacks
): Promise<{ text: string; actionRequested?: string }> {
  // Format history for Gemini SDK
  const contents: any[] = history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.content }]
  }));
  contents.push({ role: 'user', parts: [{ text: newMessage }] });

  let maxIterations = 3;
  let iterations = 0;
  let lastError: any = null;

  for (const modelName of FALLBACK_MODELS) {
    try {
      iterations = 0;
      let workingContents = [...contents];

      while (iterations < maxIterations) {
        iterations++;

        // Stream content from Gemini
        const stream = await ai.models.generateContentStream({
          model: modelName,
          contents: workingContents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            tools,
            temperature: 0.1,
          }
        });

        let functionCalls: any[] = [];
        let candidateParts: any[] = [];
        let streamText = '';

        for await (const chunk of stream) {
          if (chunk.functionCalls && chunk.functionCalls.length > 0) {
            functionCalls.push(...chunk.functionCalls);
          }
          if (chunk.candidates?.[0]?.content?.parts) {
            candidateParts.push(...chunk.candidates[0].content.parts);
          }
          if (chunk.text) {
            streamText += chunk.text;
            callbacks?.onChunk?.(chunk.text);
          }
        }

        // If no tool calls were made, we have the complete response
        if (functionCalls.length === 0) {
          return { text: streamText };
        }

        // Tool calls were requested
        const modelParts = candidateParts.length > 0
          ? candidateParts
          : functionCalls.map(fc => ({ functionCall: fc }));

        workingContents.push({
          role: 'model',
          parts: modelParts
        });

        const toolResponsesParts = [];

        for (const call of functionCalls) {
          const { name, args } = call;
          const safeArgs: any = args || {};
          let resultStr = '';
          let isError = false;

          try {
            if (name === 'get_loan_schemes') {
              callbacks?.onStatus?.('Fetching active loan schemes...');
              const schemes = await getActiveSchemes();
              resultStr = JSON.stringify({ 
                schemes: schemes.map(s => ({
                  id: s.id,
                  name: s.name,
                  annualInterestRate: parseFloat(s.annualInterestRate.toString()),
                  tenureMonths: s.tenureMonths,
                  maxLtv: parseFloat(s.maxLtv.toString()),
                  repaymentDescription: s.repaymentDescription
                }))
              });
            } 
            else if (name === 'calculate_quote') {
              callbacks?.onStatus?.('Calculating gold valuation and loan quotes...');
              const parsed = quoteRequestSchema.safeParse(safeArgs);
              if (!parsed.success) {
                resultStr = JSON.stringify({ error: "Validation Error", details: parsed.error.errors.map(e => e.message) });
                isError = true;
              } else {
                const schemes = await getActiveSchemes();
                const quote = calculateGoldQuote(parsed.data.grossWeightGrams, parsed.data.netWeightGrams, parsed.data.karat, schemes);
                
                resultStr = JSON.stringify({
                  pureGoldGrams: quote.pureGoldGrams,
                  goldValueRupees: Number(quote.goldValuePaise) / 100,
                  schemes: quote.schemes.map(s => ({
                    schemeId: s.schemeId,
                    schemeName: s.schemeName,
                    eligibleLoanRupees: Number(s.eligibleLoanPaise) / 100,
                    annualInterestRatePercent: s.annualInterestRatePercent
                  }))
                });
              }
            }
            else if (name === 'submit_application') {
              callbacks?.onStatus?.('Submitting your loan application...');
              if (!providedConfirmationToken || safeArgs.confirmationToken !== providedConfirmationToken) {
                resultStr = JSON.stringify({
                  error: "Submission Denied",
                  message: "Application cannot be submitted because the user has not explicitly confirmed in the UI."
                });
                isError = true;
              } else {
                const parsed = createLeadSchema.safeParse(safeArgs);
                if (!parsed.success) {
                  resultStr = JSON.stringify({ error: "Validation Error", details: parsed.error.errors.map(e => e.message) });
                  isError = true;
                } else {
                  const scheme = await getActiveSchemes().then(s => s.find(p => p.id === parsed.data.selectedPlanId));
                  if (!scheme) {
                    resultStr = JSON.stringify({ error: "Invalid Scheme", message: "Selected plan does not exist." });
                    isError = true;
                  } else {
                    const quote = calculateGoldQuote(parsed.data.grossWeightGrams, parsed.data.netWeightGrams, parsed.data.karat, [scheme]);
                    const q = quote.schemes[0]!;
                    const appId = generateApplicationId();
                    try {
                      const lead = await createLead({
                        applicationId: appId,
                        customerName: parsed.data.customerName,
                        mobileNumber: parsed.data.mobileNumber,
                        grossWeightGrams: parsed.data.grossWeightGrams,
                        netWeightGrams: parsed.data.netWeightGrams,
                        karat: parsed.data.karat,
                        schemeId: scheme.id,
                        pureGoldGrams: q.pureGoldGrams,
                        goldValuePaise: q.goldValuePaise,
                        eligibleLoanPaise: q.eligibleLoanPaise,
                      });
                      resultStr = JSON.stringify({
                        success: true,
                        applicationId: lead.applicationId,
                        status: lead.status
                      });
                    } catch (err) {
                      if (err instanceof DuplicateLeadError) {
                        resultStr = JSON.stringify({ error: "Duplicate Application", message: err.message, existingApplicationId: err.existingApplicationId });
                        isError = true;
                      } else {
                        throw err;
                      }
                    }
                  }
                }
              }
            } else {
              resultStr = JSON.stringify({ error: "Unknown tool call" });
              isError = true;
            }
          } catch (e) {
            resultStr = JSON.stringify({ error: "Internal Error", message: e instanceof Error ? e.message : String(e) });
            isError = true;
          }

          toolResponsesParts.push({
            functionResponse: {
              name,
              response: { result: resultStr, isError }
            }
          });
        }

        // Send tool responses back to the model for next loop iteration
        workingContents.push({ role: 'user', parts: toolResponsesParts });
      }

      return { text: '' };
    } catch (err: any) {
      lastError = err;
      console.warn(`[AI] Model ${modelName} attempt failed:`, err?.message || err);
      // Fallback to next model
      continue;
    }
  }

  throw lastError || new Error('All Gemini models failed to respond.');
}

/**
 * Handle a chat interaction (non-streaming compatibility wrapper).
 */
export async function handleAiChat(
  history: ChatMessage[],
  newMessage: string,
  providedConfirmationToken?: string
): Promise<{ text: string; actionRequested?: string }> {
  return handleAiChatStream(history, newMessage, providedConfirmationToken);
}
