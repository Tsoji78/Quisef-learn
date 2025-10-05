// app/courses/[courseId]/enroll/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCourseDetails } from '@/hooks/useCourseDetails';
import { useEnrollment } from '@/hooks/useEnrollment';
import CourseEnrollment from '@/components/CourseEnrollment';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import DebugPanel from '@/components/DebugPanel';
import { useState, useEffect, useRef, Component, ReactNode } from 'react';

// Proper Error Boundary Component
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex justify-center items-center">
          <div className="text-center p-8 max-w-lg">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {this.state.error?.message || 'An error occurred while loading the course enrollment page.'}
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Try Again
              </button>
              <Link
                href="/courses"
                className="flex items-center text-blue-600 hover:text-blue-800 px-4 py-2 border border-blue-600 rounded hover:bg-blue-50"
              >
                <ArrowLeft size={18} className="mr-2" />
                Back to Courses
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading Component
function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex justify-center items-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </div>
  );
}

// Main Course Enrollment Component
function CourseEnrollmentPageContent() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  
  // Ensure courseId is properly extracted
  const courseId = params?.courseId as string | undefined;
  
  const { course, isEnrolled, loading, error, lastModuleId } = useCourseDetails(
    courseId || '', 
    user?.uid || null
  );
  const { handleEnrollment, enrolling, error: enrollmentError } = useEnrollment(
    courseId || '', 
    user?.uid || null
  );
  
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});
  const renderCount = useRef(0);

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  renderCount.current += 1;

  useEffect(() => {
    if (!mounted) return;

    const newDebugInfo = {
      courseId: courseId || 'No courseId',
      authLoading,
      user: user?.uid || 'No user',
      loading,
      error: error || 'No error',
      courseExists: !!course,
      courseTitle: course?.title || 'No title',
      enrollmentError: enrollmentError || 'No enrollment error',
      mounted,
      renderCount: renderCount.current,
    };

    setDebugInfo((prev) => {
      if (JSON.stringify(prev) !== JSON.stringify(newDebugInfo)) {
        return newDebugInfo;
      }
      return prev;
    });
  }, [courseId, authLoading, user?.uid, loading, error, course, enrollmentError, mounted]);

  // Redirect if no courseId
  useEffect(() => {
    if (mounted && !courseId) {
      console.error('No courseId provided, redirecting to courses');
      router.push('/courses');
    }
  }, [mounted, courseId, router]);

  // Don't render anything until mounted (prevents hydration issues)
  if (!mounted) {
    return <LoadingSpinner message="Initializing..." />;
  }

  // Check for courseId after mounting
  if (!courseId) {
    return <LoadingSpinner message="Redirecting..." />;
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex justify-center items-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {authLoading ? 'Checking authentication...' : 'Loading course details...'}
          </p>
          <div className="text-sm text-gray-500">Course ID: {courseId}</div>
        </div>
        {process.env.NODE_ENV === 'development' && <DebugPanel debugInfo={debugInfo} />}
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <strong>Error:</strong> {error || enrollmentError || 'Course not found'}
                <br />
                <small>Course ID: {courseId}</small>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <Link
              href="/courses"
              className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              <ArrowLeft size={18} className="mr-2" />
              Back to Courses
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
        {process.env.NODE_ENV === 'development' && <DebugPanel debugInfo={debugInfo} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/courses"
            className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
          >
            <ArrowLeft size={18} className="mr-2" />
            Back to Courses
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <CourseEnrollment
            course={course}
            isEnrolled={isEnrolled}
            lastModuleId={lastModuleId}
            handleEnrollment={handleEnrollment}
            enrolling={enrolling}
            error={enrollmentError}
          />
        </div>
      </div>
      {process.env.NODE_ENV === 'development' && <DebugPanel debugInfo={debugInfo} />}
    </div>
  );
}

// Main Export with Error Boundary (no Suspense)
export default function CourseEnrollmentPage() {
  return (
    <ErrorBoundary>
      <CourseEnrollmentPageContent />
    </ErrorBoundary>
  );
}