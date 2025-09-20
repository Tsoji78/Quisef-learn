'use client';

import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useDashboardCourses } from '@/hooks/useDashboardCourses';
import DashboardCourseList from '@/components/DashboardCourseList';
import Link from 'next/link';

export default function CoursesPage() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { courses, enrollmentStatus, loading, error } = useDashboardCourses(user?.uid || null);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading courses...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
        <div className="mb-4 sm:mb-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
            {user ? 'My Courses' : 'Available Courses'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {user ? `Welcome back! Continue your learning journey.` : 'Discover and explore our course catalog.'}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </div>
        </div>
      )}

      {!user && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 px-4 py-3 rounded mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm">
              <Link href="/auth/login" className="font-semibold hover:underline">
                Sign in
              </Link>{' '}
              to enroll in courses and track your progress, or{' '}
              <Link href="/auth/register" className="font-semibold hover:underline">
                create an account
              </Link>{' '}
              to get started.
            </p>
          </div>
        </div>
      )}

      <DashboardCourseList courses={courses} enrollmentStatus={enrollmentStatus} userId={user?.uid || null} />
    </div>
  );
}