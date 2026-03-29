// Generates a single session ID per app launch, shared across all event calls.
const SESSION_ID = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
  /[xy]/g,
  c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  },
);

export function getSessionId(): string {
  return SESSION_ID;
}
