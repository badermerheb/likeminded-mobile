import { api } from './api';
import { InterestOut, InterestIn } from '../types/api';

export const interestsService = {
  getMyInterests: () => api.get<InterestOut[]>('/me/interests'),
  getAllInterests: () => api.get<InterestOut[]>('/me/interests/all'),
  updateMyInterests: (items: InterestIn[]) => api.put<InterestOut[]>('/me/interests', items),
};
