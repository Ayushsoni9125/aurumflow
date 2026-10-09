import axios from 'axios';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface Scheme {
  id: string;
  name: string;
  annualInterestRatePercent: number;
  tenureMonths: number;
  maxLtvPercent: number;
  repaymentDescription: string;
}

export interface QuoteRequest {
  grossWeightGrams: number;
  netWeightGrams: number;
  karat: number;
}

export interface SchemeQuote extends Scheme {
  pureGoldGrams: number;
  goldValueRupees: number;
  eligibleLoanRupees: number;
  schemeId: string;
  schemeName: string;
}

export interface QuoteResponse {
  grossWeightGrams: number;
  netWeightGrams: number;
  karat: number;
  pureGoldGrams: number;
  goldValueRupees: number;
  mockRateDisclosure: string;
  schemes: SchemeQuote[];
}

export interface CreateLeadRequest {
  customerName: string;
  mobileNumber: string;
  grossWeightGrams: number;
  netWeightGrams: number;
  karat: number;
  selectedPlanId: string;
  userId?: string;
}

export interface LeadResponse {
  applicationId: string;
  status: string;
  pureGoldGrams: number;
  goldValueRupees: number;
  eligibleLoanRupees: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface ChatRequest {
  userId?: string;
  history: ChatMessage[];
  message: string;
  confirmationToken?: string;
}

export interface ChatResponse {
  text: string;
}

// API Functions
export const fetchSchemes = async (): Promise<Scheme[]> => {
  const { data } = await apiClient.get('/loan-schemes');
  return data.data;
};

export const fetchQuote = async (payload: QuoteRequest): Promise<QuoteResponse> => {
  const { data } = await apiClient.post('/quotes', payload);
  return data.data;
};

export const submitLead = async (payload: CreateLeadRequest): Promise<LeadResponse> => {
  const { data } = await apiClient.post('/leads', payload);
  return data.data;
};

export const sendChatMessage = async (payload: ChatRequest): Promise<ChatResponse> => {
  const { data } = await apiClient.post('/chat', payload);
  return data.data;
};

export interface StreamHandlers {
  onChunk?: (chunk: string) => void;
  onStatus?: (status: string) => void;
  signal?: AbortSignal;
}

export const sendChatMessageStream = async (
  payload: ChatRequest,
  handlers?: StreamHandlers
): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: handlers?.signal,
  });

  if (!response.ok) {
    let errorMsg = 'Failed to connect to AI Assistant';
    try {
      const errData = await response.json();
      errorMsg = errData?.error?.message || errorMsg;
    } catch {
      // fallback
    }
    throw new Error(errorMsg);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Streaming response body is not readable.');
  }

  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let accumulatedText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // Keep remainder in buffer

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;
      const jsonStr = trimmed.slice(6);
      try {
        const data = JSON.parse(jsonStr);
        if (data.type === 'status' && data.status) {
          handlers?.onStatus?.(data.status);
        } else if (data.type === 'chunk' && data.text) {
          accumulatedText += data.text;
          handlers?.onChunk?.(data.text);
        } else if (data.type === 'done' && data.text) {
          if (!accumulatedText) {
            accumulatedText = data.text;
            handlers?.onChunk?.(data.text);
          }
        } else if (data.type === 'error') {
          throw new Error(data.message || 'AI Assistant encountered an error.');
        }
      } catch (err: any) {
        if (err.message && err.message !== 'Unexpected end of JSON input') {
          throw err;
        }
      }
    }
  }

  return accumulatedText;
};

export const fetchLeads = async (planId?: string, userId?: string) => {
  const params: any = {};
  if (planId) params.planId = planId;
  if (userId) params.userId = userId;
  const { data } = await apiClient.get('/leads', { params });
  return data.data;
};

export const fetchLeadById = async (id: string) => {
  const { data } = await apiClient.get(`/leads/${id}`);
  return data.data;
};

export const registerUser = async (payload: any) => {
  const { data } = await apiClient.post('/auth/register', payload);
  return data.data;
};

export const loginUser = async (payload: any) => {
  const { data } = await apiClient.post('/auth/login', payload);
  return data.data;
};
