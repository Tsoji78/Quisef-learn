import React from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps {
  placeholder: string;
  onChange: (value: string) => void;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({ 
  placeholder, 
  onChange, 
  className = '' 
}) => (
  <div className={`relative ${className}`}>
    <input
      type="text"
      placeholder={placeholder}
      className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
      onChange={(e) => onChange(e.target.value)}
    />
    <Search className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" size={16} />
  </div>
);
