import React from 'react';
import { CheckCircle, Circle } from 'lucide-react';
import { Module } from '@/types/course';

interface ModuleCompletionCardProps {
  module: Module;
  isCompleted: boolean;
  loading: boolean;
  onMarkComplete: (module: Module) => void;
}

export const ModuleCompletionCard: React.FC<ModuleCompletionCardProps> = ({
  module,
  isCompleted,
  loading,
  onMarkComplete
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Complete this module
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Mark as complete to track your progress and unlock the next module.
          </p>
        </div>
        
        <button
          onClick={() => onMarkComplete(module)}
          disabled={loading || isCompleted}
          className={`px-6 py-3 rounded-lg transition-colors flex items-center ${
            isCompleted
              ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 cursor-default'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current mr-2" />
              Saving...
            </>
          ) : isCompleted ? (
            <>
              <CheckCircle size={16} className="mr-2" />
              Completed
            </>
          ) : (
            <>
              <Circle size={16} className="mr-2" />
              Mark Complete
            </>
          )}
        </button>
      </div>
    </div>
  );
};