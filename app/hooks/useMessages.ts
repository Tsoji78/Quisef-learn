// hooks/useMessages.ts
import { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CourseGroup, Message } from '../types';
import { toast } from 'react-hot-toast';

export const useMessages = (selectedGroup: CourseGroup | null, user: User | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedGroup || !user) return;

    const messagesQuery = query(
      collection(db, 'groups', selectedGroup.id, 'chatForums', 'default', 'messages'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messagesData = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            senderId: doc.data().senderId,
            senderName: doc.data().senderName,
            content: doc.data().content,
            timestamp: doc.data().timestamp?.toDate() || new Date(),
          }))
          .reverse();

        setMessages(messagesData);
      },
      (err) => {
        console.error('Error fetching messages:', err);
        toast.error('Failed to load messages.');
      }
    );

    return () => unsubscribe();
  }, [selectedGroup, user]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return { messages, messagesEndRef };
};
