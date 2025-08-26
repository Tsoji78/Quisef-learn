import React from 'react';
import { Users, MessageCircle, FileText } from 'lucide-react';

interface TabNavigationProps {
  activeTab: 'members' | 'chat' | 'assignments';
  onTabChange: (tab: 'members' | 'chat' | 'assignments') => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { key: 'members' as const, label: 'Members', icon: Users },
    { key: 'chat' as const, label: 'Chat', icon: MessageCircle },
    { key: 'assignments' as const, label: 'Assignments', icon: FileText },
  ];

  return (
    <div className="flex flex-col sm:flex-row mb-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`
            flex-1 flex items-center justify-center py-3 transition-colors
            ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }
          `}
        >
          <tab.icon className="mr-2" size={18} />
          {tab.label}
        </button>
      ))}
    </div>
  );
};