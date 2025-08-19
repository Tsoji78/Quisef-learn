import { Plus, Trash } from 'lucide-react';
import { Course } from '../types';

interface ModuleListProps {
  formData: Course;
  currentModuleIndex: number;
  setCurrentModuleIndex: (index: number) => void;
  addModule: () => void;
  removeModule: (index: number) => void;
}

export default function ModuleList({
  formData,
  currentModuleIndex,
  setCurrentModuleIndex,
  addModule,
  removeModule,
}: ModuleListProps) {
  return (
    <div className="md:w-1/4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-gray-700 dark:text-gray-300">Modules</h3>
        <button
          onClick={addModule}
          className="flex items-center text-blue-500 hover:text-blue-700"
        >
          <Plus size={16} className="mr-1" />
          <span className="text-sm">Add</span>
        </button>
      </div>
      <div className="space-y-2 overflow-auto max-h-96 pr-1">
        {formData.modules.map((module, index) => (
          <div
            key={module.id}
            className={`flex justify-between p-3 rounded-md cursor-pointer ${
              currentModuleIndex === index
                ? 'bg-blue-100 dark:bg-blue-900 border-l-4 border-blue-500'
                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            onClick={() => setCurrentModuleIndex(index)}
          >
            <div className="truncate flex-1">
              <span className="text-sm font-medium">{module.title || `Module ${index + 1}`}</span>
            </div>
            {formData.modules.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeModule(index);
                }}
                className="text-gray-500 hover:text-red-500"
              >
                <Trash size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}