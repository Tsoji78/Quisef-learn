import React from 'react';
import parse from 'html-react-parser';
import { Download } from 'lucide-react';
import { Module } from '@/types';

interface ModuleContentProps {
  module: Module;
}

export const ModuleContent: React.FC<ModuleContentProps> = ({ module }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 mb-6">
      <div className="prose prose-lg dark:prose-invert max-w-none">
        {module.content ? (
          parse(module.content)
        ) : (
          <p className="text-gray-600 dark:text-gray-400">
            No content available for this module.
          </p>
        )}
      </div>

      {/* Module Resources */}
      {module.resources && module.resources.length > 0 && (
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Resources
          </h3>
          <div className="space-y-2">
            {module.resources.map((resource, index) => (
              <a
                key={index}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <Download size={16} className="text-gray-500 dark:text-gray-400 mr-3" />
                <span className="text-gray-700 dark:text-gray-300">
                  {resource.title}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};