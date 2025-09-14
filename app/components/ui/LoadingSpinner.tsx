// components/LoadingSpinner.tsx
import React from 'react';
import { Loader } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = 'Loading...' }) => (
  <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-screen">
    <Loader className="animate-spin mr-2 text-blue-500 dark:text-blue-400" />
    <span>{message}</span>
  </div>
);
