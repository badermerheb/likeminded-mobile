import { create } from 'zustand';
import { ProfileOut } from '../types/api';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  profile: ProfileOut | null;
  needsOnboarding: boolean;
  setAuthenticated: (value: boolean) => void;
  setLoading: (value: boolean) => void;
  setProfile: (profile: ProfileOut | null) => void;
  setNeedsOnboarding: (value: boolean) => void;
  setOnboarded: (value: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: true,
  profile: null,
  needsOnboarding: false,
  setAuthenticated: (value) => set({ isAuthenticated: value }),
  setLoading: (value) => set({ isLoading: value }),
  setProfile: (profile) => set({ profile }),
  setNeedsOnboarding: (value) => set({ needsOnboarding: value }),
  setOnboarded: (value) => set({ needsOnboarding: !value }),
  logout: () =>
    set({
      isAuthenticated: false,
      profile: null,
      needsOnboarding: false,
    }),
}));
