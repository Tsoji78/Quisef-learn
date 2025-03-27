'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';

// Define detailed course content interface
interface CourseDetails {
  id: string;
  title: string;
  instructor: string;
  description: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  progress: number;
  thumbnail: string;
  category: string;
  curriculum: {
    week: number;
    title: string;
    topics: string[];
    completed: boolean;
  }[];
  resources: {
    name: string;
    type: 'PDF' | 'Video' | 'Slides';
    url: string;
  }[];
}

// Mock course details data
const coursesDetailsData: { [key: string]: CourseDetails } = {
  'react-101': {
    id: 'react-101',
    title: 'React Fundamentals',
    instructor: 'John Doe',
    description: 'Learn the basics of React and build modern web applications.',
    level: 'Beginner',
    duration: '4 weeks',
    progress: 45,
    thumbnail: '/api/placeholder/400/250?text=React+Course',
    category: 'Web Development',
    curriculum: [
      {
        week: 1,
        title: 'Introduction to React',
        topics: ['JSX', 'Components', 'Props'],
        completed: true
      },
      {
        week: 2,
        title: 'State and Hooks',
        topics: ['useState', 'useEffect', 'Custom Hooks'],
        completed: true
      },
      {
        week: 3,
        title: 'Advanced React Concepts',
        topics: ['Context API', 'Performance Optimization', 'Error Boundaries'],
        completed: false
      },
      {
        week: 4,
        title: 'Final Project',
        topics: ['Building a Complete React Application'],
        completed: false
      }
    ],
    resources: [
      {
        name: 'React Basics Slides',
        type: 'Slides',
        url: '#'
      },
      {
        name: 'Component Design PDF',
        type: 'PDF',
        url: '#'
      },
      {
        name: 'React Hooks Tutorial',
        type: 'Video',
        url: '#'
      }
    ]
  },
  // Add more course details here
};

export default function CourseDetailsPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const course = coursesDetailsData[courseId];

  const [activeSection, setActiveSection] = useState('curriculum');

  if (!course) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p className="text-2xl">Course not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Course Header */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="md:w-1/3">
          <img 
            src={course.thumbnail} 
            alt={course.title} 
            className="w-full rounded-lg shadow-lg"
          />
        </div>
        <div className="md:w-2/3">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
            {course.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {course.description}
          </p>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <span className="block text-xl font-bold text-blue-600">{course.level}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">Level</span>
            </div>
            <div>
              <span className="block text-xl font-bold text-green-600">{course.duration}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">Duration</span>
            </div>
            <div>
              <span className="block text-xl font-bold text-purple-600">{course.progress}%</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">Progress</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        {['curriculum', 'resources'].map((section) => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            className={`px-4 py-2 capitalize transition-colors duration-200 ${
              activeSection === section 
                ? 'border-b-2 border-blue-600 text-blue-600' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {section}
          </button>
        ))}
      </div>

      {/* Curriculum Section */}
      {activeSection === 'curriculum' && (
        <div className="space-y-4">
          {course.curriculum.map((week) => (
            <div 
              key={week.week} 
              className={`border rounded-lg p-4 transition-colors duration-200 ${
                week.completed 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' 
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  Week {week.week}: {week.title}
                </h3>
                {week.completed && (
                  <span className="text-green-600 text-sm">Completed</span>
                )}
              </div>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300">
                {week.topics.map((topic) => (
                  <li key={topic}>{topic}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Resources Section */}
      {activeSection === 'resources' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {course.resources.map((resource) => (
            <div 
              key={resource.name} 
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {resource.name}
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  resource.type === 'PDF' ? 'bg-red-100 text-red-800' :
                  resource.type === 'Video' ? 'bg-green-100 text-green-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {resource.type}
                </span>
              </div>
              <button className="w-full py-2 mt-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                View Resource
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}