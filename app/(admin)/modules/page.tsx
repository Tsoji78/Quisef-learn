'use client';

import { useAuth } from '@/hooks/useAuth';
import { useCourses } from '@/hooks/useCourses';
import CourseList from '@/components/CourseList';


export default function AdminCoursesPage() {
  const { user, loading: authLoading } = useAuth();
  const { courses, loading: coursesLoading, error, deleteCourse } = useCourses(user);

  if (authLoading || coursesLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return <CourseList courses={courses} loading={coursesLoading} error={error} deleteCourse={deleteCourse} />;
}