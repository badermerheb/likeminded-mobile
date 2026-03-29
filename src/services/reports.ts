import { api } from './api';
import { ReportIn, ReportOut } from '../types/api';

export const reportsService = {
  create: (data: ReportIn) => api.post<ReportOut>('/reports', data),
};
