'use client';

import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import ChatWindow from '@/components/ChatWindow';
import Link from 'next/link';

const suggestedQuestions = [
  "What's gluten-free?",
  'Suggest a starter under ₹300',
  "What are today's specials?",
  'Do you have vegan options?',
  "What's your most popular dish?",
  'Show me dessert options',
  'Any combo meal deals?',
  'What Jain options are available?',
];

export default function Home() {
  const [input, setInput] = useState('');

  const { messages, sendMessage, status } = useChat();

  const isLoading = status === 'submitted' || status === 'streaming';

  const handleSuggestedClick = (question: string) => {
    sendMessage({
      role: 'user',
      parts: [{ type: 'text', text: question }],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({
      role: 'user',
      parts: [{ type: 'text', text: input }],
    });
    setInput('');
  };

  const normalizedMessages = messages.map((m) => {
    const textFromParts =
      m.parts
        ?.filter((p: { type: string; text?: string }) => p.type === 'text')
        .map((p: { type: string; text?: string }) => p.text ?? '')
        .join('') ?? '';

    const textFromContent =
      typeof (m as unknown as { content?: unknown }).content === 'string'
        ? (m as unknown as { content: string }).content
        : '';

    return {
      id: m.id,
      role: m.role as 'user' | 'assistant',
      content: textFromParts || textFromContent,
    };
  });

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-amber-700 via-orange-700 to-red-800 text-white px-4 py-4 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30" />

        <div className="relative z-10 max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <span className="text-3xl md:text-4xl">🍽️</span>
              <span className="bg-gradient-to-r from-amber-200 to-yellow-200 bg-clip-text text-transparent">
                Spice Garden
              </span>
            </h1>
            <p className="text-amber-200/80 text-xs md:text-sm mt-0.5 ml-12 md:ml-14">
              Ask me anything about our menu ✨
            </p>
          </div>
          <Link
            href="/admin"
            className="text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 border border-white/20 backdrop-blur-sm"
          >
            Admin
          </Link>
        </div>
      </header>

      {/* Chat Window */}
      <ChatWindow messages={normalizedMessages} isLoading={isLoading} />

      {/* Suggested Questions */}
      {messages.length === 0 && !isLoading && (
        <div className="px-4 pb-2 max-w-4xl mx-auto w-full">
          <p className="text-xs text-gray-400 mb-2 text-center">Try asking:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSuggestedClick(q)}
                className="text-xs md:text-sm px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-sm text-amber-800 border border-amber-200 hover:bg-amber-100 hover:border-amber-300 transition-all duration-300 shadow-sm hover:shadow-md active:scale-95"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-amber-200/50 bg-white/60 backdrop-blur-md px-4 py-3">
        <form
          onSubmit={handleSubmit}
          className="max-w-4xl mx-auto flex gap-3 items-end"
        >
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about our menu, prices, dietary options..."
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-2xl border border-amber-200 bg-white/90 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent shadow-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
          >
            {isLoading ? (
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </form>
        <p className="text-center text-xs text-gray-400 mt-2 max-w-4xl mx-auto">
          Powered by AI • Menu data from Spice Garden Restaurant
        </p>
      </div>
    </div>
  );
}