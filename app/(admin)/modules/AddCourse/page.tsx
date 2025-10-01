// app/courses/add/page.tsx (or your route)
import { Suspense } from 'react';
import CourseManagementClient from './CourseManagementClient';
import { Loader } from 'lucide-react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Loading Component
function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center min-h-screen text-gray-700 dark:text-gray-300">
      <Loader className="animate-spin mr-2" size={24} />
      <span>Loading course editor...</span>
    </div>
  );
}

// Main Server Component
export default function AddCoursePage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CourseManagementClient />
    </Suspense>
  );
}