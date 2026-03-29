export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Onboarding: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  EmailVerification: { email: string };
};

export type OnboardingStackParamList = {
  OnboardingAgeGender: undefined;
  OnboardingLocation: undefined;
  OnboardingPreferences: undefined;
};

export type MainTabParamList = {
  MatchesTab: undefined;
  AssessmentTab: undefined;
  ProfileTab: undefined;
};

export type MatchesStackParamList = {
  MatchesHome: undefined;
  Conversation: { conversationId: string; partnerName: string; compatibility?: number };
  MatchPhotos: { conversationId: string; partnerName: string };
};

export type AssessmentStackParamList = {
  AssessmentHome: undefined;
  Chatbot: undefined;
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  Interests: undefined;
  Gallery: undefined;
  Preferences: undefined;
  Verification: undefined;
  DeleteAccount: undefined;
};
