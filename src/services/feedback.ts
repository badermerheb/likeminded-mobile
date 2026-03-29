import { api } from './api';
import { FeedbackStatusOut, FeedbackIn, FeedbackOut } from '../types/api';

export const feedbackService = {
  getStatus: (cid: string) =>
    api.get<FeedbackStatusOut>(`/conversations/${cid}/match-feedback/status`),
  submit: (cid: string, data: FeedbackIn) =>
    api.post<FeedbackOut>(`/conversations/${cid}/match-feedback`, data),
};
