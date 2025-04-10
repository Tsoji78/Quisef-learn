'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import Link from 'next/link'; // Assuming Next.js for routing

interface Course {
  id: string;
  title: string;
  instructor: string;
  content: string; // Changed from description to support rich text
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  progress: number;
  thumbnail: string;
  category: string;
}

const initialCoursesData: Course[] = [
  {
    id: 'react-101',
    title: 'React Fundamentals',
    instructor: 'John Doe',
    content: '<p>Learn the basics of React and build modern web applications.</p>',
    level: 'Beginner',
    duration: '4 weeks',
    progress: 45,
    thumbnail: '/api/placeholder/400/250?text=React+Course',
    category: 'Web Development',
  },
  // Other courses remain the same, just replace description with content
  {
    id: 'advanced-typescript',
    title: 'Advanced TypeScript',
    instructor: 'Jane Smith',
    content: '<p>Deep dive into TypeScript and advanced type system concepts.</p>',
    level: 'Advanced',
    duration: '6 weeks',
    progress: 25,
    thumbnail: '/api/placeholder/400/250?text=TypeScript+Course',
    category: 'Programming Languages',
  },
  {
    id: 'python-data-science',
    title: 'Python for Data Science',
    instructor: 'Mike Johnson',
    content: '<p>Learn data science techniques using Python and popular libraries.</p>',
    level: 'Intermediate',
    duration: '8 weeks',
    progress: 60,
    thumbnail: '/api/placeholder/400/250?text=Data+Science+Course',
    category: 'Data Science',
  },
  {
    id: 'nodejs-backend',
    title: 'Node.js Backend Development',
    instructor: 'Sarah Williams',
    content: '<p>Build scalable backend applications with Node.js and Express.</p>',
    level: 'Intermediate',
    duration: '5 weeks',
    progress: 35,
    thumbnail: '/api/placeholder/400/250?text=Node.js+Course',
    category: 'Backend Development',
  },
  {
    id: 'machine-learning-intro',
    title: 'Introduction to Machine Learning',
    instructor: 'Alex Rodriguez',
    content: '<p>Understand machine learning principles and practical applications.</p>',
    level: 'Advanced',
    duration: '10 weeks',
    progress: 15,
    thumbnail: '/api/placeholder/400/250?text=ML+Course',
    category: 'Artificial Intelligence',
  },
  {
    id: 'design-ux-ui',
    title: 'UX/UI Design Mastery',
    instructor: 'Emma Thompson',
    content: '<p>Learn modern design principles and create intuitive user interfaces.</p>',
    level: 'Intermediate',
    duration: '6 weeks',
    progress: 50,
    thumbnail: '/api/placeholder/400/250?text=UX+UI+Course',
    category: 'Design',
  },
];

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>(initialCoursesData);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

  const openDeleteModal = (course: Course) => {
    setCourseToDelete(course);
    setIsDeleteModalOpen(true);
  };

  const deleteCourse = () => {
    if (courseToDelete) {
      setCourses(courses.filter((course) => course.id !== courseToDelete.id));
    }
    setIsDeleteModalOpen(false);
    setCourseToDelete(null);
  };

  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Course Management</h1>
        <div className="flex space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search courses..."
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          <Link href="/modules/modulesID">
            <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
              <Plus size={18} />
              <span>Add Course</span>
            </button>
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Thumbnail</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Instructor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Progress</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredCourses.map((course) => (
                <tr key={course.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <img src={course.thumbnail} alt={course.title} className="h-12 w-20 object-cover rounded" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{course.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">ID: {course.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{course.instructor}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{course.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        course.level === 'Beginner'
                          ? 'bg-green-100 text-green-800'
                          : course.level === 'Intermediate'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {course.level}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{course.duration}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-blue-600 rounded-full h-2" style={{ width: `${course.progress}%` }}></div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{course.progress}%</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => openDeleteModal(course)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCourses.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No courses found. Try a different search or add a new course.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isDeleteModalOpen && courseToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setIsDeleteModalOpen(false)}>
              <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Delete Course</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Are you sure you want to delete the course "{courseToDelete.title}"? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={deleteCourse}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Delete
                </button>
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}