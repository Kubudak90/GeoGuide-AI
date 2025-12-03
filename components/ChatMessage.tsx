import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Message } from '../types';
import GroundingChips from './GroundingChips';
import { Bot, User } from 'lucide-react';
import clsx from 'clsx';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={clsx("flex w-full mb-6", isUser ? "justify-end" : "justify-start")}>
      <div className={clsx("flex max-w-[90%] md:max-w-[80%]", isUser ? "flex-row-reverse" : "flex-row")}>
        
        {/* Avatar */}
        <div className={clsx(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 shadow-sm",
          isUser ? "ml-3 bg-blue-600 text-white" : "mr-3 bg-white text-emerald-600 border border-gray-100"
        )}>
          {isUser ? <User size={16} /> : <Bot size={18} />}
        </div>

        {/* Message Content */}
        <div className={clsx(
          "flex flex-col p-4 rounded-2xl shadow-sm text-sm leading-relaxed",
          isUser 
            ? "bg-blue-600 text-white rounded-tr-sm" 
            : "bg-white border border-gray-100 text-gray-800 rounded-tl-sm"
        )}>
          {message.isLoading ? (
             <div className="flex space-x-2 h-6 items-center">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
             </div>
          ) : (
            <>
              <div className="markdown-body">
                <ReactMarkdown
                   components={{
                    a: ({node, ...props}) => <a {...props} className={isUser ? "text-white underline" : "text-blue-600 hover:underline"} target="_blank" rel="noopener noreferrer" />,
                    ul: ({node, ...props}) => <ul {...props} className="list-disc ml-4 my-2" />,
                    ol: ({node, ...props}) => <ol {...props} className="list-decimal ml-4 my-2" />,
                    p: ({node, ...props}) => <p {...props} className="mb-2 last:mb-0" />
                   }}
                >
                  {message.text}
                </ReactMarkdown>
              </div>
              <GroundingChips metadata={message.groundingMetadata} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
