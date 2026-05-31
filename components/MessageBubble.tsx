'use client';

import React from 'react';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export default function MessageBubble({ role, content, isStreaming }: MessageBubbleProps) {
  const isUser = role === 'user';

  // Simple markdown-like rendering: handle line breaks, bold, bullets
  const formatContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      // Handle bullet points
      let processedLine = line;
      let isBullet = false;
      if (processedLine.match(/^\s*[-•*]\s/)) {
        isBullet = true;
        processedLine = processedLine.replace(/^\s*[-•*]\s/, '');
      }
      if (processedLine.match(/^\s*\d+\.\s/)) {
        isBullet = true;
      }

      // Handle bold text **text**
      const parts = processedLine.split(/(\*\*[^*]+\*\*)/);
      const formattedParts = parts.map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={j} className="font-semibold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      return (
        <React.Fragment key={i}>
          {isBullet && <span className="mr-1">•</span>}
          {formattedParts}
          {i < text.split('\n').length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-fade-in`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mr-3 mt-1 shadow-lg">
          <span className="text-white text-sm">🍽️</span>
        </div>
      )}
      <div
        className={`max-w-[80%] md:max-w-[70%] px-4 py-3 rounded-2xl shadow-md ${
          isUser
            ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-br-md'
            : 'bg-white/90 backdrop-blur-sm text-gray-800 rounded-bl-md border border-amber-100'
        }`}
      >
        <div className={`text-sm md:text-base leading-relaxed ${isUser ? 'text-white' : 'text-gray-700'}`}>
          {formatContent(content)}
          {isStreaming && (
            <span className="inline-block ml-1 animate-pulse">
              <span className="inline-block w-1.5 h-4 bg-amber-500 rounded-full" />
            </span>
          )}
        </div>
      </div>
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center ml-3 mt-1 shadow-lg">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  );
}
