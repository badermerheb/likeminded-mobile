import { api } from './api';
import { TraitOut } from '../types/api';

export const traitsService = {
  list: () => api.get<TraitOut[]>('/traits'),
};
