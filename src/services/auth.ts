import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {supabase} from './supabase';
import {api} from './api';
import {ENV} from '../config/env';

// Configure Google Sign-In
// TODO: Ensure google-services.json is placed in android/app/ directory
GoogleSignin.configure({
  webClientId: ENV.GOOGLE_WEB_CLIENT_ID,
});

interface SignUpParams {
  email: string;
  password: string;
  fullName: string;
}

interface SignInParams {
  email: string;
  password: string;
}

export const authService = {
  async signUp(params: SignUpParams) {
    const {data, error} = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: {full_name: params.fullName},
      },
    });
    if (error) throw error;
    return data;
  },

  async signIn(params: SignInParams) {
    const {data, error} = await supabase.auth.signInWithPassword({
      email: params.email,
      password: params.password,
    });
    if (error) throw error;
    return data;
  },

  async signInWithGoogle() {
    await GoogleSignin.hasPlayServices();
    // Sign out first to clear cached account and force account picker
    try { await GoogleSignin.signOut(); } catch {}
    const signInResult = await GoogleSignin.signIn();
    const idToken = signInResult.data?.idToken;
    if (!idToken) {
      // User dismissed the picker without selecting an account
      const err = new Error('Sign in cancelled');
      (err as any).code = 'SIGN_IN_CANCELLED';
      throw err;
    }
    const {data, error} = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    // Clear Google cached session so account picker shows next time
    try { await GoogleSignin.signOut(); } catch {}
    const {error} = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession() {
    const {data, error} = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  /**
   * Check if an email exists in auth.users and which provider it uses.
   * Uses a direct fetch (no auth token needed — user isn't logged in yet).
   */
  async checkEmail(email: string): Promise<{exists: boolean; provider: string | null}> {
    const base = ENV.API_BASE_URL.endsWith('/') ? ENV.API_BASE_URL.slice(0, -1) : ENV.API_BASE_URL;
    const url = `${base}/me/auth/check-email?email=${encodeURIComponent(email)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Check failed');
    return res.json();
  },

  async resetPassword(email: string) {
    const {error} = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },

  /** Resend signup confirmation OTP via Supabase (uses custom SMTP configured in dashboard) */
  async resendConfirmation(email: string) {
    const {error} = await supabase.auth.resend({type: 'signup', email});
    if (error) throw error;
  },

  onAuthStateChange(callback: (event: string, session: unknown) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};
