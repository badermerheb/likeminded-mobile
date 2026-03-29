// ── Profile ──
export interface ProfileOut {
  id: string;
  full_name: string;
  gender: string | null;
  age: number | null;
  location_id: number | null;
  location_label: string | null;
  personality_weight: number;
  interests_weight: number;
  verified: boolean;
  admin: boolean;
  preferred_min_age: number | null;
  preferred_max_age: number | null;
  preferred_gender: string | null;
  preferred_max_distance_km: number | null;
  last_login_at: string | null;
}

export interface OnboardingIn {
  age: number;
  location_id?: number | null;
  gender?: string | null;
  preferred_min_age?: number | null;
  preferred_max_age?: number | null;
  preferred_gender?: string | null;
  preferred_max_distance_km?: number | null;
}

export interface MatchPreferencesIn {
  preferred_min_age?: number | null;
  preferred_max_age?: number | null;
  preferred_gender?: string | null;
  preferred_max_distance_km?: number | null;
}

export interface WeightsIn {
  personality_weight: number;
  interests_weight: number;
}

// ── Locations ──
export interface CountryOut {
  country: string;
}

export interface CityOut {
  id: number;
  city: string;
  admin_name?: string | null;
}

// ── Interests ──
export interface InterestOut {
  id: number;
  name: string;
  category: string | null;
}

export interface InterestIn {
  name: string;
}

// ── Conversations ──
export interface ConversationOut {
  id: string;
  partnerName: string;
  partnerAge: number | null;
  partnerCity: number | null;
  lastMessage: string | null;
  lastAt: string | null;
  compatibility: number | null;
  unread: number;
  partnerLastActive: string | null;
}

export interface MessageOut {
  id: string;
  role: 'me' | 'them' | 'system';
  text: string | null;
  ts: number;
  kind: string | null;
}

export interface SendMessageIn {
  text: string;
}

// ── Match Feedback ──
export interface FeedbackStatusOut {
  conversation_id: string;
  is_24h_passed: boolean;
  already_answered: boolean;
  should_prompt: boolean;
  my_response: boolean | null;
}

export interface FeedbackIn {
  response: boolean;
}

export interface FeedbackOut {
  conversation_id: string;
  saved: boolean;
  both_yes: boolean;
  photos_unlocked: boolean;
}

// ── Matching ──
export interface MatchResultSuccess {
  status: 'matched';
  user_a_id: string;
  user_b_id: string;
  score: number;
  conversation_id: string;
}

export interface MatchResultNoMatch {
  status: 'no_match';
  user_id: string;
}

export interface MatchResultIneligible {
  status: 'ineligible';
  user_id: string;
  reason: string;
}

export type MatchResult = MatchResultSuccess | MatchResultNoMatch | MatchResultIneligible;

// ── Photos ──
export interface UploadResult {
  ok: boolean;
  photo_id: string;
  path: string;
}

// ── Traits ──
export interface TraitOut {
  id: number;
  name: string;
  description: string | null;
  score: number | null;
}

// ── Reports ──
export type ReportReason = 'spam' | 'harassment' | 'scam' | 'hate' | 'sexual' | 'impersonation' | 'other';

export interface ReportIn {
  conversation_id: string;
  reason: ReportReason;
  details?: string | null;
}

export interface ReportOut {
  id: string;
}

// ── Events ──
export interface EventIn {
  event_id?: string;
  session_id: string;
  event_name: string;
  ts?: string | null;
  conversation_id?: string | null;
  message_id?: string | null;
  other_user_id?: string | null;
  properties?: Record<string, unknown>;
}

// ── KYC ──
export interface KycStatus {
  status: 'unverified' | 'pending' | 'verified';
  reasons?: string[];
}

// ── Chatbot / Assessment ──
export interface ChatbotMessage {
  role: 'assistant' | 'user';
  content: string;
  options?: ChatbotOption[];
  phase?: number;
}

export interface ChatbotOption {
  label: string;
  value: string;
}

// ── Matching Status ──
export interface MatchingStatus {
  can_match: boolean;
  reasons?: string[];
  cooldown_until?: string | null;
  active_conversations?: number;
}
