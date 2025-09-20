import React from 'react';
import { CheckCircle, Circle, BookOpen, Video, FileText } from 'lucide-react';
import { Module } from '@/types/course';

interface ModuleListProps {
  modules: Module[];
  currentModule: Module | null;
  completedModules: string[];
  onModuleSelect: (module: Module) => void;
}

export const ModuleList: React.FC<ModuleListProps> = ({
  modules,
  currentModule,
  completedModules,
  onModuleSelect
}) => {
  const getModuleIcon = (module: Module) => {
    if (module.type === 'video') return <Video size={16} />;
    if (module.type === 'document') return <FileText size={16} />;
    return <BookOpen size={16} />;
  };

  const getModuleDuration = (module: Module) => {
    return module.duration || '5 min read';
  };

  return (
    <div className="space-y-1">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
        Course Modules
      </h3>
      {modules.map((module, index) => {
        const isCompleted = completedModules.includes(module.id);
        const isCurrent = currentModule?.id === module.id;
        
        return (
          <button
            key={module.id}
            onClick={() => onModuleSelect(module)}
            className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
              isCurrent
                ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                {isCompleted ? (
                  <CheckCircle size={16} className="text-green-600" />
                ) : (
                  <Circle size={16} className="text-gray-400" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-gray-400 dark:text-gray-500">
                    {getModuleIcon(module)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Module {index + 1}
                  </span>
                </div>
                
                <h4 className={`text-sm font-medium leading-tight ${
                  isCurrent
                    ? 'text-blue-700 dark:text-blue-300'
                    : 'text-gray-800 dark:text-white'
                }`}>
                  {module.title}
                </h4>
                
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {getModuleDuration(module)}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};