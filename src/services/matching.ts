import { api } from './api';
import { MatchResult } from '../types/api';

export const matchingService = {
  getStatus: () => api.get<Record<string, unknown>>('/matching/status'),
  generate: () => api.post<MatchResult>('/matching/generate'),
  generateMatch: () => api.post<MatchResult>('/matching/generate'),
};
