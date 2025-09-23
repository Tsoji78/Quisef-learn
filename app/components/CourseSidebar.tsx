import React from 'react';
import Link from 'next/link';
import { ArrowLeft, User, Clock } from 'lucide-react';
import { Course, Module } from '@/types';
import { ModuleList } from '@/components/ModulesList';

interface CourseSidebarProps {
  course: Course;
  modules: Module[];
  currentModule: Module | null;
  completedModules: string[];
  currentProgress: number;
  isOpen: boolean;
  onModuleSelect: (module: Module) => void;
}

export const CourseSidebar: React.FC<CourseSidebarProps> = ({
  course,
  modules,
  currentModule,
  completedModules,
  currentProgress,
  isOpen,
  onModuleSelect
}) => {
  return (
    <div className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${
      isOpen ? 'w-80' : 'w-0 overflow-hidden'
    }`}>
      <div className="p-6">
        {/* Course Header */}
        <div className="mb-6">
          <Link
            href={`/courses/${course.id}`}
            className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors mb-4"
          >
            <ArrowLeft size={18} className="mr-2" />
            Back to Course
          </Link>
          
          <h1 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
            {course.title}
          </h1>
          
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 space-x-4">
            <div className="flex items-center">
              <User size={14} className="mr-1" />
              {course.instructor}
            </div>
            <div className="flex items-center">
              <Clock size={14} className="mr-1" />
              {course.duration}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Progress
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {completedModules.length}/{modules.length} completed
            </span>
          </div>
          <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-green-600 rounded-full h-2 transition-all duration-300"
              style={{ width: `${currentProgress}%` }}
            />
          </div>
          <div className="text-right mt-1">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {currentProgress}%
            </span>
          </div>
        </div>

        {/* Module List */}
        <ModuleList
          modules={modules}
          currentModule={currentModule}
          completedModules={completedModules}
          onModuleSelect={onModuleSelect}
        />
      </div>
    </div>
  );
};