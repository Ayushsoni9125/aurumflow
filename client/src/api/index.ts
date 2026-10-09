import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api/v1',
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

export const fetchLeads = async (planId?: string) => {
  const params = planId ? { planId } : {};
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
