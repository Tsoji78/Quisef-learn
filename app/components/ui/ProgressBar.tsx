import React from 'react';

interface ProgressBarProps {
  progress: number;
  className?: string;
  showPercentage?: boolean;
  color?: 'blue' | 'green' | 'red' | 'yellow';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  className = '',
  showPercentage = false,
  color = 'green'
}) => {
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    yellow: 'bg-yellow-600'
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className={`${colorClasses[color]} rounded-full h-2 transition-all duration-300`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      {showPercentage && (
        <div className="text-right mt-1">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {Math.round(progress)}%
          </span>
        </div>
      )}
    </div>
  );
};