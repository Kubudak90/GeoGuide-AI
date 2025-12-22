import React from 'react';
import { motion } from 'framer-motion';
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={clsx("flex w-full mb-6", isUser ? "justify-end" : "justify-start")}
    >
      <div className={clsx("flex max-w-[90%] md:max-w-[80%]", isUser ? "flex-row-reverse" : "flex-row")}>

        {/* Avatar */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.1 }}
          className={clsx(
            "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mt-1 shadow-md",
            isUser ? "ml-3 gradient-ocean text-white" : "mr-3 glass text-emerald-600 border-2 border-emerald-100"
          )}
        >
          {isUser ? (
            <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.5 }}>
              <User size={18} />
            </motion.div>
          ) : (
            <motion.div
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Bot size={20} />
            </motion.div>
          )}
        </motion.div>

        {/* Message Content */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className={clsx(
            "flex flex-col p-4 rounded-2xl shadow-md text-sm leading-relaxed relative overflow-hidden",
            isUser
              ? "gradient-ocean text-white rounded-tr-sm"
              : "glass text-gray-900 rounded-tl-sm"
          )}
        >
          {/* Subtle gradient overlay for bot messages */}
          {!isUser && (
            <div className="absolute inset-0 gradient-emerald opacity-5 -z-10"></div>
          )}

          {message.isLoading ? (
            <div className="flex space-x-2 h-6 items-center">
              {[0, 150, 300].map((delay, index) => (
                <motion.div
                  key={index}
                  animate={{ y: [0, -8, 0] }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: delay / 1000,
                    ease: "easeInOut"
                  }}
                  className="w-2.5 h-2.5 gradient-emerald rounded-full shadow-sm"
                />
              ))}
            </div>
          ) : (
            <>
              <div className="markdown-body">
                <ReactMarkdown
                   components={{
                    a: ({node, ...props}) => <a {...props} className={isUser ? "text-white underline font-semibold" : "text-emerald-600 hover:text-emerald-700 underline font-semibold"} target="_blank" rel="noopener noreferrer" />,
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
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ChatMessage;
