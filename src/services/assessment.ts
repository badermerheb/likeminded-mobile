import {api} from './api';
import {TraitOut} from '../types/api';

export interface ChatbotHistoryResponse {
  messages: Array<{
    role: 'assistant' | 'user';
    content: string;
    ts?: string;
  }>;
  phase: 'self' | 'pref' | 'done';
  progress: {
    threshold?: number;
    total?: number;
    answered?: number;
    self_total?: number;
    pref_total?: number;
    self_answered?: number;
    pref_answered?: number;
  };
}

export interface ChatbotMessageResponse {
  reply: string;
  phase: 'self' | 'pref' | 'done';
  progress?: {
    threshold?: number;
    total?: number;
    answered?: number;
    self_total?: number;
    pref_total?: number;
    self_answered?: number;
    pref_answered?: number;
  };
  bio?: string;
}

export const assessmentService = {
  start: () => api.post<{ok: boolean; attempt_id: string; started_at: string}>('/assessment/start'),

  sendMessage: (payload: {message: string}) =>
    api.post<ChatbotMessageResponse>('/chatbot/message', payload),

  getHistory: () => api.get<ChatbotHistoryResponse>('/chatbot/history'),

  getTraits: () => api.get<TraitOut[]>('/traits'),

  /** Fetch user_personality_pref scores (what user wants in a partner) */
  getPreferredTraits: () => api.get<TraitOut[]>('/matching/personality-pref'),
};
