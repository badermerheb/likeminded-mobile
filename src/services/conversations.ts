import { api } from './api';
import { ConversationOut, MessageOut, SendMessageIn, FeedbackStatusOut, FeedbackIn, FeedbackOut } from '../types/api';

export const conversationsService = {
  list: () => api.get<ConversationOut[]>('/conversations'),
  getMessages: (cid: string) => api.get<MessageOut[]>(`/conversations/${cid}/messages`),
  sendMessage: (cid: string, data: SendMessageIn) =>
    api.post<MessageOut>(`/conversations/${cid}/messages`, data),
  markRead: (cid: string) => api.post<void>(`/conversations/${cid}/read`),
  endConversation: (cid: string) => api.post<void>(`/conversations/${cid}/end`),
  getFeedbackStatus: (cid: string) =>
    api.get<FeedbackStatusOut>(`/conversations/${cid}/match-feedback/status`),
  submitFeedback: (cid: string, data: FeedbackIn) =>
    api.post<FeedbackOut>(`/conversations/${cid}/match-feedback`, data),
  getPhotos: (cid: string) =>
    api.get<string[]>(`/conversations/${cid}/photos`),
};
