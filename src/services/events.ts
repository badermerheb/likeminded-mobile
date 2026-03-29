import {api} from './api';
import {supabase} from './supabase';
import {EventIn} from '../types/api';
import {getSessionId} from '../utils/sessionId';

export const eventsService = {
  ingest: (data: EventIn) => api.post<void>('/events', data),

  /** Fire-and-forget event with auto session_id. Skips if not authenticated. */
  track: (
    eventName: string,
    extra?: Partial<Omit<EventIn, 'event_name' | 'session_id'>>,
  ) => {
    supabase.auth.getSession().then(({data}) => {
      if (!data?.session?.access_token) return; // Not logged in — skip
      api
        .post<void>('/events', {
          session_id: getSessionId(),
          event_name: eventName,
          ...extra,
        })
        .catch(() => {});
    });
  },
};
