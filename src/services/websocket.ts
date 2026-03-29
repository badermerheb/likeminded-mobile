import {ENV} from '../config/env';
import {supabase} from './supabase';

export type WsEvent =
  | {type: 'message-new'; data: {id: string; conversation_id: string; sender_user_id: string; receiver_user_id: string; content_text: string; created_at: string}}
  | {type: 'typing'; userId: string; isTyping: boolean}
  | {type: 'read'; userId: string}
  | {type: 'presence'; userId: string; state: 'joined' | 'left'}
  | {type: 'photos-unlocked'; conversation_id: string}
  | {type: 'ended'; conversation_id: string}
  | {type: 'pong'};

type WsListener = (event: WsEvent) => void;

class ConversationWebSocket {
  private ws: WebSocket | null = null;
  private cid: string | null = null;
  private listener: WsListener | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private alive = false;

  async connect(cid: string, onEvent: WsListener): Promise<void> {
    this.disconnect();
    this.cid = cid;
    this.listener = onEvent;
    this.alive = true;

    const {data} = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (!token) {
      console.warn('[WS] No auth token, cannot connect');
      return;
    }

    const baseUrl = ENV.API_BASE_URL.replace(/\/$/, '');
    const wsBase = baseUrl.replace(/^http/, 'ws');
    const url = `${wsBase}/ws/conversations/${cid}?token=${token}`;

    if (__DEV__) {
      console.log('[WS] Connecting to', url.substring(0, 80) + '...');
    }

    const ws = new WebSocket(url);
    this.ws = ws;

    ws.onopen = () => {
      if (__DEV__) console.log('[WS] Connected');
      // Start ping interval to keep connection alive
      this.pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({type: 'ping'}));
        }
      }, 25000);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (__DEV__) console.log('[WS] Event:', data.type);
        this.listener?.(data as WsEvent);
      } catch (e) {
        if (__DEV__) console.warn('[WS] Bad message:', event.data);
      }
    };

    ws.onerror = (error) => {
      if (__DEV__) console.warn('[WS] Error:', error);
    };

    ws.onclose = (event) => {
      if (__DEV__) console.log('[WS] Closed:', event.code, event.reason);
      this.clearPing();
      // Auto-reconnect if still alive
      if (this.alive && this.cid === cid) {
        this.reconnectTimeout = setTimeout(() => {
          if (this.alive && this.cid === cid && this.listener) {
            this.connect(cid, this.listener);
          }
        }, 3000);
      }
    };
  }

  sendText(text: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({type: 'send', text}));
    } else {
      console.warn('[WS] Cannot send, not connected');
    }
  }

  sendTyping(isTyping: boolean): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({type: 'typing', isTyping}));
    }
  }

  sendRead(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({type: 'read'}));
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  disconnect(): void {
    this.alive = false;
    this.clearPing();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }
      this.ws = null;
    }
    this.cid = null;
    this.listener = null;
  }

  private clearPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}

export const conversationWS = new ConversationWebSocket();
