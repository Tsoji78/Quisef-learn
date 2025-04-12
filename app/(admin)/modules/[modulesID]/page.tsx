'use client';

import { useState } from 'react';
import JoditEditor from 'jodit-react';
import { Save, X, Upload, HelpCircle, Plus, Trash } from 'lucide-react';
import Link from 'next/link';

interface Module {
  id: string;
  title: string;
  content: string;
}

interface Course {
  title: string;
  instructor: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  progress: number;
  thumbnail: string;
  category: string;
  modules: Module[];
}

export default function CourseManagementPage() {
  const [formData, setFormData] = useState<Course>({
    title: '',
    instructor: '',
    level: 'Beginner',
    duration: '',
    progress: 0,
    thumbnail: '',
    category: '',
    modules: [{ id: crypto.randomUUID(), title: '', content: '' }]
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState(1);
  const [showHelp, setShowHelp] = useState(false);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);

  const editorConfig = {
    readonly: false,
    height: 400,
    toolbarAdaptive: false,
    buttons: [
      'bold', 'italic', 'underline', '|',
      'ul', 'ol', '|',
      'font', 'fontsize', 'brush', 'paragraph', '|',
      'image', 'video', 'table', 'link', '|',
      'undo', 'redo',
    ],
    // Ensure text appears in black in the editor
    theme: 'default',
    style: {
      color: '#000000'
    },
    colors: {
      greyscale: ['#000000', '#434343', '#666666', '#999999', '#B7B7B7', '#CCCCCC', '#D9D9D9', '#EFEFEF', '#F3F3F3', '#FFFFFF'],
      palette: ['#980000', '#FF0000', '#FF9900', '#FFFF00', '#00F0F0', '#00FFFF', '#4A86E8', '#0000FF', '#9900FF', '#FF00FF'],
      full: [
        '#E6B8AF', '#F4CCCC', '#FCE5CD', '#FFF2CC', '#D9EAD3', '#D0E0E3', '#C9DAF8', '#CFE2F3', '#D9D2E9', '#EAD1DC',
        '#DD7E6B', '#EA9999', '#F9CB9C', '#FFE599', '#B6D7A8', '#A2C4C9', '#A4C2F4', '#9FC5E8', '#B4A7D6', '#D5A6BD',
        '#CC4125', '#E06666', '#F6B26B', '#FFD966', '#93C47D', '#76A5AF', '#6D9EEB', '#6FA8DC', '#8E7CC3', '#C27BA0',
        '#A61C00', '#CC0000', '#E69138', '#F1C232', '#6AA84F', '#45818E', '#3C78D8', '#3D85C6', '#674EA7', '#A64D79',
        '#85200C', '#990000', '#B45F06', '#BF9000', '#38761D', '#134F5C', '#1155CC', '#0B5394', '#351C75', '#741B47',
        '#5B0F00', '#660000', '#783F04', '#7F6000', '#274E13', '#0C343D', '#1C4587', '#073763', '#20124D', '#4C1130'
      ]
    },
    // Set default editing text color to black
    defaultStyle: {
      color: '#000000'
    },
    iframe: false,
    // CSS for the editor content
    css: `
      .jodit-container {
        color: #000000 !important;
      }
      .jodit-wysiwyg {
        color: #000000 !important;
      }
      .jodit-wysiwyg p, .jodit-wysiwyg div, .jodit-wysiwyg span, .jodit-wysiwyg a {
        color: #000000 !important;
      }
    `
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'progress' ? parseInt(value) : value,
    });
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const handleModuleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    index: number
  ) => {
    const { name, value } = e.target;
    const updatedModules = [...formData.modules];
    updatedModules[index] = {
      ...updatedModules[index],
      [name]: value
    };
    
    setFormData({
      ...formData,
      modules: updatedModules
    });
    
    // Clear error when field is edited
    const errorKey = `module_${index}_${name}`;
    if (errors[errorKey]) {
      setErrors({
        ...errors,
        [errorKey]: ''
      });
    }
  };

  const handleModuleContentChange = (newContent: string, index: number) => {
    const updatedModules = [...formData.modules];
    updatedModules[index] = {
      ...updatedModules[index],
      content: newContent
    };
    
    setFormData({
      ...formData,
      modules: updatedModules
    });
  };

  const addModule = () => {
    setFormData({
      ...formData,
      modules: [
        ...formData.modules,
        { id: crypto.randomUUID(), title: '', content: '' }
      ]
    });
    setCurrentModuleIndex(formData.modules.length);
  };

  const removeModule = (index: number) => {
    if (formData.modules.length > 1) {
      const updatedModules = [...formData.modules];
      updatedModules.splice(index, 1);
      
      setFormData({
        ...formData,
        modules: updatedModules
      });
      
      if (currentModuleIndex >= updatedModules.length) {
        setCurrentModuleIndex(updatedModules.length - 1);
      }
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title) newErrors.title = 'Course title is required';
    if (!formData.instructor) newErrors.instructor = 'Instructor name is required';
    if (!formData.category) newErrors.category = 'Category is required';
    
    // Validate modules
    formData.modules.forEach((module, index) => {
      if (!module.title) {
        newErrors[`module_${index}_title`] = `Module ${index + 1} title is required`;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveCourse = () => {
    if (!validateForm()) {
      window.scrollTo(0, 0);
      return;
    }
    
    // Here you would typically save to a database or state management system
    console.log('Saving course:', formData);
    // Redirect back to the main page after saving (implement your own logic)
  };

  const goToNextStep = () => {
    if (step === 1 && !formData.title) {
      setErrors({
        title: !formData.title ? 'Course title is required' : ''
      });
      return;
    }
    setStep(step + 1);
  };

  const goToPreviousStep = () => {
    setStep(step - 1);
  };

  const renderBasicInfo = () => (
    <div className="space-y-6">
      <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded-lg mb-6">
        <p className="text-sm text-blue-700 dark:text-blue-200">
          Start by adding the basic course information. Fields marked with * are required.
        </p>
      </div>
      
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Course Title*
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          required
          className={`mt-1 block w-full px-3 py-2 border ${errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white`}
        />
        {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
      </div>

      <div>
        <label htmlFor="instructor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Instructor*
        </label>
        <input
          type="text"
          id="instructor"
          name="instructor"
          value={formData.instructor}
          onChange={handleInputChange}
          required
          className={`mt-1 block w-full px-3 py-2 border ${errors.instructor ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white`}
        />
        {errors.instructor && <p className="mt-1 text-sm text-red-500">{errors.instructor}</p>}
      </div>
      
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Category*
        </label>
        <input
          type="text"
          id="category"
          name="category"
          value={formData.category}
          onChange={handleInputChange}
          required
          className={`mt-1 block w-full px-3 py-2 border ${errors.category ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white`}
        />
        {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category}</p>}
      </div>
    </div>
  );

  const renderModulesSection = () => (
    <div className="space-y-6">
      <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded-lg mb-6">
        <p className="text-sm text-blue-700 dark:text-blue-200">
          Add modules to your course. Each module should have a title and content.
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4">
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
          
          <div className="space-y-2 overflow-auto max-h-96 pr-2">
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
                  <span className="text-sm font-medium">
                    {module.title || `Module ${index + 1}`}
                  </span>
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
        
        <div className="md:w-3/4">
          <div>
            <label htmlFor={`module-title-${currentModuleIndex}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Module Title*
            </label>
            <input
              type="text"
              id={`module-title-${currentModuleIndex}`}
              name="title"
              value={formData.modules[currentModuleIndex].title}
              onChange={(e) => handleModuleInputChange(e, currentModuleIndex)}
              required
              className={`mt-1 block w-full px-3 py-2 border ${
                errors[`module_${currentModuleIndex}_title`] 
                  ? 'border-red-500' 
                  : 'border-gray-300 dark:border-gray-600'
              } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white`}
              placeholder="Enter module title"
            />
            {errors[`module_${currentModuleIndex}_title`] && (
              <p className="mt-1 text-sm text-red-500">{errors[`module_${currentModuleIndex}_title`]}</p>
            )}
          </div>
          
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor={`module-content-${currentModuleIndex}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Module Content
              </label>
              <button 
                onClick={() => setShowHelp(!showHelp)}
                className="text-blue-500 hover:text-blue-700 text-sm flex items-center"
              >
                <HelpCircle size={16} className="mr-1" />
                Editor Help
              </button>
            </div>
            
            {showHelp && (
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md text-sm">
                <h4 className="font-semibold mb-2">Editor Tips:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Use the formatting toolbar to style your content</li>
                  <li>Add images and videos using the media buttons</li>
                  <li>Create tables to organize information</li>
                  <li>Use headings to structure your content</li>
                </ul>
              </div>
            )}
            
            <div className="black-text-editor">
              <JoditEditor
                value={formData.modules[currentModuleIndex].content}
                config={editorConfig}
                onBlur={(content) => handleModuleContentChange(content, currentModuleIndex)}
              />
            </div>
            
            {/* Add style tag to ensure black text in the editor */}
            <style jsx global>{`
              .jodit-wysiwyg {
                color: #000000 !important;
              }
              .jodit-wysiwyg p, 
              .jodit-wysiwyg div, 
              .jodit-wysiwyg span, 
              .jodit-wysiwyg a,
              .jodit-wysiwyg h1,
              .jodit-wysiwyg h2,
              .jodit-wysiwyg h3,
              .jodit-wysiwyg h4,
              .jodit-wysiwyg h5,
              .jodit-wysiwyg h6,
              .jodit-wysiwyg li,
              .jodit-wysiwyg td,
              .jodit-wysiwyg th,
              .jodit-wysiwyg pre,
              .jodit-wysiwyg code {
                color: #000000 !important;
              }
              /* Fix for dark mode */
              .dark .jodit-wysiwyg {
                background-color: white;
                color: #000000 !important;
              }
            `}</style>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDetailsSection = () => (
    <div className="space-y-6">
      <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded-lg mb-6">
        <p className="text-sm text-blue-700 dark:text-blue-200">
          Add additional details about your course.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="level" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Level
          </label>
          <select
            id="level"
            name="level"
            value={formData.level}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>

        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Duration
          </label>
          <input
            type="text"
            id="duration"
            name="duration"
            value={formData.duration}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="e.g., 6 weeks"
          />
        </div>
      </div>

      <div>
        <label htmlFor="thumbnail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Thumbnail Image
        </label>
        <div className="mt-1 flex items-center">
          <input
            type="text"
            id="thumbnail"
            name="thumbnail"
            value={formData.thumbnail}
            onChange={handleInputChange}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Enter image URL or upload"
          />
          <button className="ml-2 bg-gray-100 dark:bg-gray-700 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">
            <Upload size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
        </div>
        {formData.thumbnail && (
          <div className="mt-2 h-32 w-48 border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
            <img 
              src={formData.thumbnail || "/api/placeholder/400/250?text=Course"} 
              alt="Thumbnail preview" 
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      <div>
        <label htmlFor="progress" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Initial Progress (%)
        </label>
        <input
          type="number"
          id="progress"
          name="progress"
          value={formData.progress}
          onChange={handleInputChange}
          min="0"
          max="100"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        />
        <div className="mt-2 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-600 rounded-full h-2"
            style={{ width: `${formData.progress}%` }}
          ></div>
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Set initial progress if this course is partially complete
        </p>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Add New Course</h1>
        <Link href="/modules">
          <button className="flex items-center space-x-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors">
            <X size={18} />
            <span>Back to List</span>
          </button>
        </Link>
      </div>

      {/* Progress indicators */}
      <div className="flex mb-8">
        <div className="flex-1">
          <div className={`h-2 ${step >= 1 ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'} rounded-l-full`}></div>
          <p className={`text-center text-sm mt-2 ${step === 1 ? 'font-semibold text-blue-500' : 'text-gray-500'}`}>Course Info</p>
        </div>
        <div className="flex-1">
          <div className={`h-2 ${step >= 2 ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
          <p className={`text-center text-sm mt-2 ${step === 2 ? 'font-semibold text-blue-500' : 'text-gray-500'}`}>Modules</p>
        </div>
        <div className="flex-1">
          <div className={`h-2 ${step >= 3 ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'} rounded-r-full`}></div>
          <p className={`text-center text-sm mt-2 ${step === 3 ? 'font-semibold text-blue-500' : 'text-gray-500'}`}>Details</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        {/* Error summary */}
        {Object.keys(errors).length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6">
            <h3 className="text-red-800 dark:text-red-300 font-medium">Please fix the following errors:</h3>
            <ul className="list-disc ml-5 mt-2">
              {Object.values(errors).map((error, index) => (
                <li key={index} className="text-red-700 dark:text-red-400 text-sm">{error}</li>
              ))}
            </ul>
          </div>
        )}

        {step === 1 && renderBasicInfo()}
        {step === 2 && renderModulesSection()}
        {step === 3 && renderDetailsSection()}

        <div className="flex justify-between pt-6 border-t mt-8">
          <div>
            {step > 1 && (
              <button 
                onClick={goToPreviousStep} 
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                Previous
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <Link href="/admin/courses">
              <button className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
                Cancel
              </button>
            </Link>
            
            {step < 3 ? (
              <button
                onClick={goToNextStep}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={saveCourse}
                className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded transition-colors"
              >
                <Save size={18} />
                <span>Save Course</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}