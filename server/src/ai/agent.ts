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

/**
 * Handle a chat interaction.
 * We manually dispatch tool calls if the model requests them.
 */
export async function handleAiChat(
  history: ChatMessage[],
  newMessage: string,
  providedConfirmationToken?: string
): Promise<{ text: string; actionRequested?: string }> {
  
  // Format history for Gemini SDK
  const contents = history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.content }]
  }));
  contents.push({ role: 'user', parts: [{ text: newMessage }] });

  // Call Gemini
  let response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
    contents,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools,
      temperature: 0.1, // low temp for deterministic tool use
    }
  });

  // Handle tool calls iteratively
  let maxIterations = 3;
  let iterations = 0;

  while (response.functionCalls && response.functionCalls.length > 0 && iterations < maxIterations) {
    iterations++;
    
    // Append the model's tool call request to history
    contents.push({
      role: 'model',
      parts: response.functionCalls.map(fc => ({ functionCall: fc }))
    });

    const toolResponsesParts = [];

    for (const call of response.functionCalls) {
      const { name, args } = call;
      let resultStr = '';
      let isError = false;

      try {
        if (name === 'get_loan_schemes') {
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
          // Validate args using shared schema
          const parsed = quoteRequestSchema.safeParse(args);
          if (!parsed.success) {
            resultStr = JSON.stringify({ error: "Validation Error", details: parsed.error.errors.map(e => e.message) });
            isError = true;
          } else {
            const schemes = await getActiveSchemes();
            const quote = calculateGoldQuote(parsed.data.grossWeightGrams, parsed.data.netWeightGrams, parsed.data.karat, schemes);
            
            // Format for model (convert paise to rupees)
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
          // MANDATORY SAFETY GATE: Enforce confirmation token
          if (!providedConfirmationToken || args.confirmationToken !== providedConfirmationToken) {
            resultStr = JSON.stringify({
              error: "Submission Denied",
              message: "Application cannot be submitted because the user has not explicitly confirmed in the UI."
            });
            isError = true;
          } else {
            const parsed = createLeadSchema.safeParse(args);
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

    // Send tool responses back to the model
    contents.push({ role: 'user', parts: toolResponsesParts });
    response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools,
        temperature: 0.1,
      }
    });
  }

  return {
    text: response.text || '',
  };
}
