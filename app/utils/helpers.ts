import { Member } from '../types';

export const getMemberRoleColor = (role: Member['role']) => {
  switch (role) {
    case 'Instructor':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'Teaching Assistant':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    default:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  }
};

export const getAssignmentStatusColor = (status: string) => {
  switch (status) {
    case 'Completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'In Progress':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    default:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  }
};

export const formatTimestamp = (timestamp: Date) => {
  return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const generateAvatarUrl = (name: string = 'Avatar') => {
  return `/api/placeholder/50/50?text=${encodeURIComponent(name)}`;
};