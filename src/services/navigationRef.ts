// src/services/navigationRef.ts
// Global navigation ref for use outside React components (e.g., notification handlers)

import {createNavigationContainerRef} from '@react-navigation/native';
import type {RootStackParamList} from '../types/navigation';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/**
 * Navigate safely — waits until the navigator is ready.
 * Used by notification tap handlers to deep-link into the app.
 */
export function navigateFromNotification(data: Record<string, string>) {
  const type = data?.type;
  const conversationId = data?.conversationId;

  if (!navigationRef.isReady()) {
    // If nav isn't ready yet, retry after a short delay
    setTimeout(() => navigateFromNotification(data), 500);
    return;
  }

  switch (type) {
    case 'new_message':
    case 'conversation_ended':
      if (conversationId) {
        // Navigate to conversation screen
        navigationRef.navigate('Main' as any, {
          screen: 'MatchesTab',
          params: {
            screen: 'Conversation',
            params: {
              conversationId,
              partnerName: data.partnerName || 'Match',
            },
          },
        } as any);
      }
      break;

    case 'new_match':
      if (conversationId) {
        navigationRef.navigate('Main' as any, {
          screen: 'MatchesTab',
          params: {
            screen: 'Conversation',
            params: {
              conversationId,
              partnerName: data.partnerName || 'New Match',
            },
          },
        } as any);
      } else {
        // No conversation ID — just go to matches list
        navigationRef.navigate('Main' as any, {
          screen: 'MatchesTab',
          params: {screen: 'MatchesHome'},
        } as any);
      }
      break;

    case 'photos_unlocked':
      if (conversationId) {
        navigationRef.navigate('Main' as any, {
          screen: 'MatchesTab',
          params: {
            screen: 'MatchPhotos',
            params: {
              conversationId,
              partnerName: data.partnerName || 'Match',
            },
          },
        } as any);
      }
      break;

    case 'partner_feedback':
      if (conversationId) {
        navigationRef.navigate('Main' as any, {
          screen: 'MatchesTab',
          params: {
            screen: 'Conversation',
            params: {
              conversationId,
              partnerName: data.partnerName || 'Match',
            },
          },
        } as any);
      }
      break;

    case 'kyc_approved':
    case 'kyc_rejected':
      navigationRef.navigate('Main' as any, {
        screen: 'ProfileTab',
        params: {screen: 'Verification'},
      } as any);
      break;

    default:
      // Unknown type — go to matches home
      navigationRef.navigate('Main' as any, {
        screen: 'MatchesTab',
        params: {screen: 'MatchesHome'},
      } as any);
      break;
  }
}
