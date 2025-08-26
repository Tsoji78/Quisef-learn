// components/MessageItem.tsx
import React from 'react';
import { Message } from '@/types';

interface MessageItemProps {
  message: Message;
  senderName: string;
  senderImage: string;
  isCurrentUser: boolean;
}

export const MessageItem = React.memo<MessageItemProps>(({ 
  message, 
  senderName, 
  senderImage, 
  isCurrentUser 
}) => (
  <div className={`flex mb-4 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
    <div
      className={`max-w-[70%] p-3 rounded-lg ${
        isCurrentUser
          ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-white'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
      }`}
    >
      {!isCurrentUser && (
        <div className="flex items-center gap-2 mb-1">
          <img src={senderImage} alt="Avatar" className="w-6 h-6 rounded-full" />
          <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">{senderName}</span>
        </div>
      )}
      <p className="mt-1 text-gray-800 dark:text-gray-300">{message.content}</p>
      <span className="text-xs text-gray-500 dark:text-gray-400 block mt-1">
        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  </div>
));

MessageItem.displayName = 'MessageItem';