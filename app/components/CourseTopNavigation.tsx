import React from 'react';
import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { Module } from '@/types/course';

interface CourseTopNavigationProps {
  currentModule: Module;
  currentModuleIndex: number;
  totalModules: number;
  previousModule: Module | null;
  nextModule: Module | null;
  onToggleSidebar: () => void;
  onNavigateToPrevious: () => void;
  onNavigateToNext: () => void;
}

export const CourseTopNavigation: React.FC<CourseTopNavigationProps> = ({
  currentModule,
  currentModuleIndex,
  totalModules,
  previousModule,
  nextModule,
  onToggleSidebar,
  onNavigateToPrevious,
  onNavigateToNext
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <BookOpen size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
          
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              {currentModule.title}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Module {currentModuleIndex + 1} of {totalModules}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onNavigateToPrevious}
            disabled={!previousModule}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
              previousModule
                ? 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            <ChevronLeft size={16} className="mr-1" />
            Previous
          </button>
          
          <button
            onClick={onNavigateToNext}
            disabled={!nextModule}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
              nextModule
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            Next
            <ChevronRight size={16} className="ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};