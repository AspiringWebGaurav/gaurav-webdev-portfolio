'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

type ViewMode = 'main' | 'chat';

interface ChatBubbleControlContextType {
  isOpen: boolean;
  viewMode: ViewMode;
  openBubble: (mode?: ViewMode) => void;
  closeBubble: () => void;
  setViewMode: (mode: ViewMode) => void;
}

const ChatBubbleControlContext = createContext<ChatBubbleControlContextType | undefined>(undefined);

export function ChatBubbleControlProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('main');

  const openBubble = useCallback((mode: ViewMode = 'main') => {
    setViewMode(mode);
    setIsOpen(true);
  }, []);

  const closeBubble = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <ChatBubbleControlContext.Provider
      value={{
        isOpen,
        viewMode,
        openBubble,
        closeBubble,
        setViewMode,
      }}
    >
      {children}
    </ChatBubbleControlContext.Provider>
  );
}

export function useChatBubbleControl() {
  const context = useContext(ChatBubbleControlContext);
  if (!context) {
    throw new Error('useChatBubbleControl must be used within a ChatBubbleControlProvider');
  }
  return context;
}
