import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';

export function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return '';
  }
}

// Alias used by screens
export const formatRelativeTime = timeAgo;

export function formatTimestamp(ts: number): string {
  try {
    return format(new Date(ts * 1000), 'h:mm a');
  } catch {
    return '';
  }
}

// Alias used by ConversationScreen
export const formatMessageTime = formatTimestamp;

export function formatChatDate(ts: number): string {
  try {
    const date = new Date(ts * 1000);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d, yyyy');
  } catch {
    return '';
  }
}

export function formatDateShort(dateStr: string): string {
  try {
    return format(new Date(dateStr), 'MMM d');
  } catch {
    return '';
  }
}

export function compatibilityPercent(score: number | null | undefined): string {
  if (score == null) return '\u2014';
  return `${Math.round(score * 100)}%`;
}

// Alias used by screens
export const formatCompatibility = compatibilityPercent;

export function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 1) + '\u2026';
}

// Alias used by screens
export const truncateText = truncate;
