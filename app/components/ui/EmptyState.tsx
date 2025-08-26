import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon, 
  title, 
  description, 
  action 
}) => (
  <div className="text-center py-8">
    {icon && <div className="mb-4 flex justify-center text-gray-400 dark:text-gray-500">{icon}</div>}
    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
    {description && (
      <p className="text-gray-500 dark:text-gray-400 mb-4">{description}</p>
    )}
    {action && <div>{action}</div>}
  </div>
);
