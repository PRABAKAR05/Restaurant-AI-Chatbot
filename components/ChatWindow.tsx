'use client';

import { useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
}

export default function ChatWindow({ messages, isLoading }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-6 space-y-2 scroll-smooth"
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#d97706 transparent',
      }}
    >
      {messages.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center h-full text-center px-4">
          <div className="text-6xl mb-4 animate-bounce-slow">🍽️</div>
          <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-2">
            Welcome to Spice Garden!
          </h2>
          <p className="text-gray-500 text-sm md:text-base max-w-md">
            I&apos;m your AI menu assistant. Ask me anything about our dishes,
            prices, dietary options, or get personalized recommendations!
          </p>
        </div>
      )}

      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          role={message.role}
          content={message.content}
          isStreaming={false}
        />
      ))}

      {isLoading && (
        <div className="flex justify-start mb-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mr-3 mt-1 shadow-lg">
            <span className="text-white text-sm">🍽️</span>
          </div>
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl rounded-bl-md px-4 py-3 shadow-md border border-amber-100">
            <div className="flex space-x-1.5">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
