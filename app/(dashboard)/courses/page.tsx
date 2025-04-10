'use client';

import { useState } from 'react';
import Link from 'next/link';

// Define Course interface
interface Course {
  id: string;
  title: string;
  instructor: string;
  description: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  progress: number;
  thumbnail: string;
  category: string;
}

// Mock course data (in a real app, this would come from an API)
const coursesData: Course[] = [
  {
    id: 'react-101',
    title: 'React Fundamentals',
    instructor: 'John Doe',
    description: 'Learn the basics of React and build modern web applications.',
    level: 'Beginner',
    duration: '4 weeks',
    progress: 45,
    thumbnail: '/api/placeholder/400/250?text=React+Course',
    category: 'Web Development'
  },
  {
    id: 'advanced-typescript',
    title: 'Advanced TypeScript',
    instructor: 'Jane Smith',
    description: 'Deep dive into TypeScript and advanced type system concepts.',
    level: 'Advanced',
    duration: '6 weeks',
    progress: 25,
    thumbnail: '/api/placeholder/400/250?text=TypeScript+Course',
    category: 'Programming Languages'
  },
  {
    id: 'python-data-science',
    title: 'Python for Data Science',
    instructor: 'Mike Johnson',
    description: 'Learn data science techniques using Python and popular libraries.',
    level: 'Intermediate',
    duration: '8 weeks',
    progress: 60,
    thumbnail: '/api/placeholder/400/250?text=Data+Science+Course',
    category: 'Data Science'
  },
  {
    id: 'nodejs-backend',
    title: 'Node.js Backend Development',
    instructor: 'Sarah Williams',
    description: 'Build scalable backend applications with Node.js and Express.',
    level: 'Intermediate',
    duration: '5 weeks',
    progress: 35,
    thumbnail: '/api/placeholder/400/250?text=Node.js+Course',
    category: 'Backend Development'
  },
  {
    id: 'machine-learning-intro',
    title: 'Introduction to Machine Learning',
    instructor: 'Alex Rodriguez',
    description: 'Understand machine learning principles and practical applications.',
    level: 'Advanced',
    duration: '10 weeks',
    progress: 15,
    thumbnail: '/api/placeholder/400/250?text=ML+Course',
    category: 'Artificial Intelligence'
  },
  {
    id: 'design-ux-ui',
    title: 'UX/UI Design Mastery',
    instructor: 'Emma Thompson',
    description: 'Learn modern design principles and create intuitive user interfaces.',
    level: 'Intermediate',
    duration: '6 weeks',
    progress: 50,
    thumbnail: '/api/placeholder/400/250?text=UX+UI+Course',
    category: 'Design'
  }
];

export default function CoursesPage() {
  const [filter, setFilter] = useState('All');

  // Unique categories for filtering
  const categories = ['All', ...new Set(coursesData.map(course => course.category))];

  // Filter courses based on selected category
  const filteredCourses = filter === 'All' 
    ? coursesData 
    : coursesData.filter(course => course.category === filter);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          My Courses
        </h1>
        
        {/* Category Filter */}
        <div className="flex-1 space-x-4 space-y-4">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setFilter(category)}
              className={`px-4 py-2 rounded-full transition-colors duration-200 ${
                filter === category 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <Link 
            key={course.id} 
            href={`/dashboard/courses/${course.id}`}
            className="group"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-all duration-300 
              hover:shadow-xl transform hover:-translate-y-2 hover:scale-105">
              {/* Course Thumbnail */}
              <div className="relative">
                <img 
                  src={course.thumbnail} 
                  alt={course.title} 
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-full text-xs">
                  {course.level}
                </div>
              </div>

              {/* Course Details */}
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                  {course.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {course.description}
                </p>

                {/* Course Meta Information */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {course.instructor}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {course.duration}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mt-4 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 rounded-full h-2" 
                    style={{ width: `${course.progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Progress
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {course.progress}%
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* No Courses Found Message */}
      {filteredCourses.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p className="text-xl">No courses found in this category.</p>
        </div>
      )}
    </div>
  );
}