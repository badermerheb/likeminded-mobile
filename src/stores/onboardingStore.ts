import { create } from 'zustand';

interface OnboardingState {
  age: number;
  gender: string | null;
  locationId: number | null;
  locationLabel: string | null;
  country: string;
  preferredMinAge: number;
  preferredMaxAge: number;
  preferredGender: string | null;
  preferredMaxDistanceKm: number;
  setAge: (age: number) => void;
  setGender: (gender: string) => void;
  setLocation: (id: number, label: string) => void;
  setLocationId: (id: number | null) => void;
  setCountry: (country: string) => void;
  setPreferredMinAge: (age: number) => void;
  setPreferredMaxAge: (age: number) => void;
  setPreferredGender: (gender: string | null) => void;
  setPreferredMaxDistance: (km: number) => void;
  setPreferredMaxDistanceKm: (km: number) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  age: 18,
  gender: null,
  locationId: null,
  locationLabel: null,
  country: 'Lebanon',
  preferredMinAge: 18,
  preferredMaxAge: 30,
  preferredGender: null,
  preferredMaxDistanceKm: 75,
  setAge: (age) => set({ age }),
  setGender: (gender) => set({ gender }),
  setLocation: (id, label) => set({ locationId: id, locationLabel: label }),
  setLocationId: (id) => set({ locationId: id }),
  setCountry: (country) => set({ country }),
  setPreferredMinAge: (age) => set({ preferredMinAge: age }),
  setPreferredMaxAge: (age) => set({ preferredMaxAge: age }),
  setPreferredGender: (gender) => set({ preferredGender: gender }),
  setPreferredMaxDistance: (km) => set({ preferredMaxDistanceKm: km }),
  setPreferredMaxDistanceKm: (km) => set({ preferredMaxDistanceKm: km }),
  reset: () =>
    set({
      age: 18,
      gender: null,
      locationId: null,
      locationLabel: null,
      country: 'Lebanon',
      preferredMinAge: 18,
      preferredMaxAge: 30,
      preferredGender: null,
      preferredMaxDistanceKm: 75,
    }),
}));
