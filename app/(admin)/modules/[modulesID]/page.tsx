'use client';

import { useState } from 'react';
import JoditEditor from 'jodit-react';
import { Save, X } from 'lucide-react';
import Link from 'next/link';

interface Course {
  id: string;
  title: string;
  instructor: string;
  content: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  progress: number;
  thumbnail: string;
  category: string;
}

export default function AddCoursePage() {
  const [formData, setFormData] = useState<Partial<Course>>({
    id: '',
    title: '',
    instructor: '',
    content: '',
    level: 'Beginner',
    duration: '',
    progress: 0,
    thumbnail: '',
    category: '',
  });

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
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'progress' ? parseInt(value) : value,
    });
  };

  const handleContentChange = (newContent: string) => {
    setFormData({ ...formData, content: newContent });
  };

  const saveCourse = () => {
    if (!formData.id || !formData.title || !formData.instructor || !formData.category) {
      alert('Please fill in all required fields');
      return;
    }
    // Here you would typically save to a database or state management system
    console.log('Saving course:', formData);
    // Redirect back to the main page after saving (implement your own logic)
  };

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

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="space-y-6">
          <div>
            <label htmlFor="id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Course ID*
            </label>
            <input
              type="text"
              id="id"
              name="id"
              value={formData.id}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="unique-course-id"
            />
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Title*
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
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
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Course Content
            </label>
            <JoditEditor
              value={formData.content || ''}
              config={editorConfig}
              onBlur={handleContentChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="thumbnail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Thumbnail URL
            </label>
            <input
              type="text"
              id="thumbnail"
              name="thumbnail"
              value={formData.thumbnail}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="/api/placeholder/400/250?text=Course"
            />
          </div>

          <div>
            <label htmlFor="progress" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Progress (%)
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
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t">
          <Link href="/admin/courses">
            <button className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
              Cancel
            </button>
          </Link>
          <button
            onClick={saveCourse}
            className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded transition-colors"
          >
            <Save size={18} />
            <span>Save Course</span>
          </button>
        </div>
      </div>
    </div>
  );
}