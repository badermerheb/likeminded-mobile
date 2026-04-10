import { api } from './api';
import {
  ProfileOut,
  OnboardingIn,
  MatchPreferencesIn,
  WeightsIn,
  CountryOut,
  CityOut,
} from '../types/api';

export const profileService = {
  getMe: () => api.get<ProfileOut>('/me'),
  deleteMe: () => api.delete<void>('/me'),
  ping: () => api.post<void>('/me/ping'),
  completeOnboarding: (data: OnboardingIn) => api.put<ProfileOut>('/me/onboarding', data),
  updatePreferences: (data: MatchPreferencesIn) => api.put<ProfileOut>('/me/preferences', data),
  updateWeights: (data: WeightsIn) => api.put<ProfileOut>('/me/weights', data),
  updateLocation: (data: OnboardingIn) => api.put<ProfileOut>('/me/onboarding', data),
  getCountries: () => api.get<CountryOut[]>('/me/locations/countries'),
  getCities: (country: string) => api.get<CityOut[]>('/me/locations/cities', { country }),
};
