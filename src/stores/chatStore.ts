import { create } from 'zustand';
import { MessageOut } from '../types/api';

interface ChatState {
  messages: MessageOut[];
  isConnected: boolean;
  setMessages: (messages: MessageOut[]) => void;
  addMessage: (message: MessageOut) => void;
  setConnected: (value: boolean) => void;
  clear: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isConnected: false,
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  setConnected: (value) => set({ isConnected: value }),
  clear: () => set({ messages: [], isConnected: false }),
}));
