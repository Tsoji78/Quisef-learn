'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, updateDoc, setDoc, collection, query, where, getDocs, addDoc, arrayUnion, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ArrowLeft, Clock, Users, Star, CheckCircle, PlayCircle, BookOpen, Award, Shield, Calendar, Globe, Download } from 'lucide-react';
import Link from 'next/link';
import parse from 'html-react-parser';
import { toast } from 'react-hot-toast';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

interface Module {
  id: string;
  title: string;
  content: string;
  duration?: string;
}

interface Course {
  id: string;
  title: string;
  instructor: string;
  description: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  price: number;
  originalPrice?: number;
  thumbnail: string;
  category: string;
  modules: Module[];
  rating: number;
  totalStudents: number;
  lastUpdated: string;
  language: string;
  certificate: boolean;
  requirements: string[];
  whatYouLearn: string[];
  targetAudience: string[];
  instructor_bio?: string;
  instructor_image?: string;
  preview_video?: string;
  groupId?: string;
}

export default function CourseEnrollmentPage() {
  const { isDark } = useTheme();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const courseId = params?.courseId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [enrollmentSuccess, setEnrollmentSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'instructor' | 'reviews'>('overview');
  const [lastModuleId, setLastModuleId] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});

  const enrollmentChecked = useRef(false);

  // Debug function
  const addDebugInfo = (key: string, value: any) => {
    setDebugInfo((prev: any) => ({ ...prev, [key]: value }));
    console.log(`DEBUG ${key}:`, value);
  };

  // Helper function to get safe image URL
  const getSafeImageUrl = (url: string | undefined, fallbackText: string, size: string = '400/250') => {
    if (!url || url.includes('/api/placeholder/')) {
      return `https://via.placeholder.com/${size}/e2e8f0/6b7280?text=${encodeURIComponent(fallbackText)}`;
    }
    return url;
  };

  // Handle image load errors
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, fallbackText: string, size: string = '400/250') => {
    const target = e.target as HTMLImageElement;
    target.src = `https://via.placeholder.com/${size}/e2e8f0/6b7280?text=${encodeURIComponent(fallbackText)}`;
  };

  // Check enrollment status
  const checkEnrollmentStatus = async (userId: string, courseId: string) => {
    if (!userId || !courseId || enrollmentChecked.current) return;

    try {
      addDebugInfo('checkingEnrollment', { userId, courseId });
      const enrollmentRef = doc(db, 'users', userId, 'enrollments', courseId);
      const enrollmentSnap = await getDoc(enrollmentRef);
      const enrolled = enrollmentSnap.exists();

      setIsEnrolled(enrolled);
      enrollmentChecked.current = true;
      addDebugInfo('enrollmentStatus', enrolled);

      if (enrolled) {
        const progressRef = doc(db, 'users', userId, 'courseProgress', courseId);
        const progressSnap = await getDoc(progressRef);
        if (progressSnap.exists()) {
          const progressData = progressSnap.data();
          const readModules = progressData.readModules || {};
          const lastModule = Object.keys(readModules).sort().pop();
          setLastModuleId(lastModule || null);
          addDebugInfo('lastModuleId', lastModule);
        }
      }
    } catch (err) {
      console.error('Error checking enrollment:', err);
      addDebugInfo('enrollmentError', err);
      setError('Failed to check enrollment status');
    }
  };

  // Fetch course details with enhanced error handling
  const fetchCourse = async () => {
    if (!courseId) {
      addDebugInfo('fetchCourseError', 'No courseId provided');
      setError('No course ID provided');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    addDebugInfo('fetchingCourse', { courseId });

    try {
      // Test Firebase connection first
      addDebugInfo('testingFirebase', 'Testing Firebase connection...');
      
      const docRef = doc(db, 'courses', courseId);
      addDebugInfo('docRef', docRef.path);
      
      const docSnap = await getDoc(docRef);
      addDebugInfo('docSnapExists', docSnap.exists());

      if (docSnap.exists()) {
        const data = docSnap.data();
        addDebugInfo('rawFirebaseData', data);

        // Create course data with proper validation and defaults
        const courseData: Course = {
          id: docSnap.id,
          title: data.title || 'Untitled Course',
          instructor: data.instructor || 'Unknown Instructor',
          description: data.description || 'No description available',
          level: ['Beginner', 'Intermediate', 'Advanced'].includes(data.level) ? data.level : 'Beginner',
          duration: data.duration || 'Unknown',
          price: typeof data.price === 'number' ? data.price : 0,
          originalPrice: typeof data.originalPrice === 'number' ? data.originalPrice : undefined,
          thumbnail: data.thumbnail || '',
          category: data.category || 'Uncategorized',
          modules: Array.isArray(data.modules) ? data.modules : [],
          rating: typeof data.rating === 'number' ? data.rating : 4.0,
          totalStudents: typeof data.totalStudents === 'number' ? data.totalStudents : 0,
          lastUpdated: data.lastUpdated || new Date().toLocaleDateString(),
          language: data.language || 'English',
          certificate: Boolean(data.certificate),
          requirements: Array.isArray(data.requirements) ? data.requirements : ['Basic computer skills'],
          whatYouLearn: Array.isArray(data.whatYouLearn) ? data.whatYouLearn : ['Course content and skills'],
          targetAudience: Array.isArray(data.targetAudience) ? data.targetAudience : ['Students interested in learning'],
          instructor_bio: data.instructor_bio || 'Experienced instructor',
          instructor_image: data.instructor_image || '',
          preview_video: data.preview_video || '',
          groupId: data.groupId || undefined,
        };

        addDebugInfo('processedCourseData', courseData);
        setCourse(courseData);
        addDebugInfo('courseSetSuccess', courseData.title);
      } else {
        addDebugInfo('courseNotFound', courseId);
        setError('Course not found in database');
      }
    } catch (err: any) {
      addDebugInfo('fetchCourseError', {
        error: err,
        code: err.code,
        message: err.message,
        stack: err.stack
      });
      
      console.error('Error fetching course:', err);
      
      let errorMessage = 'Failed to load course';
      if (err.code === 'permission-denied') {
        errorMessage = 'You do not have permission to access this course';
      } else if (err.code === 'not-found') {
        errorMessage = 'Course not found';
      } else if (err.code === 'unavailable') {
        errorMessage = 'Firebase service is currently unavailable';
      } else if (err.message) {
        errorMessage = `Error: ${err.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle user authentication changes
  useEffect(() => {
    addDebugInfo('authEffect', { authLoading, user: !!user });
    
    if (authLoading) return;

    if (!user) {
      addDebugInfo('noUser', 'Redirecting to login');
      router.push(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (courseId && !enrollmentChecked.current) {
      checkEnrollmentStatus(user.uid, courseId);
    }
  }, [user, courseId, authLoading, router]);

  // Fetch course details
  useEffect(() => {
    addDebugInfo('courseEffect', { courseId, authLoading });
    if (authLoading) return;
    fetchCourse();
  }, [courseId, authLoading]);

  // Handle enrollment
  const handleEnrollment = async () => {
    if (!user) {
      router.push(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (!course || !courseId) {
      setError('Invalid course data');
      toast.error('Invalid course data');
      return;
    }

    setEnrolling(true);
    setError(null);

    try {
      addDebugInfo('startingEnrollment', { userId: user.uid, courseId });

      // Check if already enrolled
      const enrollmentRef = doc(db, 'users', user.uid, 'enrollments', courseId);
      const enrollmentSnap = await getDoc(enrollmentRef);

      if (enrollmentSnap.exists()) {
        throw new Error('You are already enrolled in this course');
      }

      // Create enrollment
      await setDoc(enrollmentRef, {
        courseId: courseId,
        userId: user.uid,
        enrolledAt: serverTimestamp(),
        status: 'active',
      });

      // Create progress document
      const progressRef = doc(db, 'users', user.uid, 'courseProgress', courseId);
      await setDoc(progressRef, {
        readModules: {},
        scrollPositions: {},
        lastReadDate: serverTimestamp(),
        courseId: courseId,
        userId: user.uid,
        progress: 0,
      });

      setIsEnrolled(true);
      setEnrollmentSuccess(true);
      toast.success('Enrolled successfully!');

    } catch (err: any) {
      addDebugInfo('enrollmentError', err);
      setError(err.message || 'Failed to enroll');
      toast.error(`Failed to enroll: ${err.message}`);
    } finally {
      setEnrolling(false);
    }
  };

  // Calculate total duration
  const calculateTotalDuration = () => {
    if (!course?.modules || course.modules.length === 0) {
      return course?.duration || 'Unknown';
    }

    let totalMinutes = 0;
    course.modules.forEach((module) => {
      const match = module.duration?.match(/(\d+)/);
      if (match) totalMinutes += parseInt(match[1]);
    });

    if (totalMinutes === 0) return course.duration || 'Unknown';

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  // Debug panel (only in development)
  const DebugPanel = () => {
    if (process.env.NODE_ENV !== 'development') return null;
    
    return (
      <div className="fixed bottom-4 left-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs max-w-sm max-h-60 overflow-auto z-50">
        <h4 className="font-bold mb-2">Debug Info:</h4>
        <pre className="whitespace-pre-wrap">
          {JSON.stringify({
            courseId,
            authLoading,
            user: user?.uid || 'No user',
            loading,
            error,
            courseExists: !!course,
            courseTitle: course?.title || 'No title',
            ...debugInfo
          }, null, 2)}
        </pre>
      </div>
    );
  };

  // Loading state
  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex justify-center items-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {authLoading ? 'Checking authentication...' : 'Loading course details...'}
          </p>
          <div className="text-sm text-gray-500">
            Course ID: {courseId || 'Not found'}
          </div>
        </div>
        <DebugPanel />
      </div>
    );
  }

  // Error state
  if (error && !course) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <strong>Error:</strong> {error}
                <br />
                <small>Course ID: {courseId}</small>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <Link href="/courses" className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
              <ArrowLeft size={18} className="mr-2" />
              Back to Courses
            </Link>
            <button 
              onClick={fetchCourse}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
        <DebugPanel />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex justify-center items-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">No course data available</p>
          <div className="text-sm text-gray-500 mb-4">Course ID: {courseId}</div>
          <div className="flex gap-4 justify-center">
            <Link href="/courses" className="text-blue-600 dark:text-blue-400 hover:underline">
              Back to Courses
            </Link>
            <button 
              onClick={fetchCourse}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Retry Loading
            </button>
          </div>
        </div>
        <DebugPanel />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/courses" className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors">
            <ArrowLeft size={18} className="mr-2" />
            Back to Courses
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Course Details */}
          <div className="lg:col-span-2">
            {/* Course Hero */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-6 lg:mb-8">
              <div className="relative">
                <img
                  src={getSafeImageUrl(course.thumbnail, course.title)}
                  alt={course.title}
                  className="w-full h-48 sm:h-64 object-cover"
                  onError={(e) => handleImageError(e, course.title)}
                />
                {course.preview_video && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button className="bg-black bg-opacity-50 rounded-full p-3 sm:p-4 hover:bg-opacity-70 transition-opacity">
                      <PlayCircle className="text-white" size={32} />
                    </button>
                  </div>
                )}
                {isEnrolled && (
                  <div className="absolute top-4 left-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    Enrolled
                  </div>
                )}
              </div>

              <div className="p-4 sm:p-6">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{course.category}</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      course.level === 'Beginner'
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                        : course.level === 'Intermediate'
                        ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300'
                        : 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300'
                    }`}
                  >
                    {course.level}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-4">{course.title}</h1>
                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">{course.description}</p>

                <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Star className="text-yellow-500" size={16} />
                    <span>{course.rating.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={16} />
                    <span>{course.totalStudents.toLocaleString()} students</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={16} />
                    <span>{calculateTotalDuration()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={16} />
                    <span>Updated {course.lastUpdated}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Course Content Tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex">
                  {['overview', 'curriculum', 'instructor', 'reviews'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab as any)}
                      className={`px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium capitalize transition-colors ${
                        activeTab === tab
                          ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-4 sm:p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6 sm:space-y-8">
                    {course.whatYouLearn.length > 0 && (
                      <div>
                        <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800 dark:text-white">What you'll learn</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {course.whatYouLearn.map((item, index) => (
                            <div key={index} className="flex items-start gap-3">
                              <CheckCircle className="text-green-500 mt-1 flex-shrink-0" size={16} />
                              <span className="text-gray-700 dark:text-gray-300">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {course.requirements.length > 0 && (
                      <div>
                        <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800 dark:text-white">Requirements</h3>
                        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                          {course.requirements.map((req, index) => (
                            <li key={index}>{req}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {course.targetAudience.length > 0 && (
                      <div>
                        <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800 dark:text-white">Who this course is for</h3>
                        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                          {course.targetAudience.map((audience, index) => (
                            <li key={index}>{audience}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'curriculum' && (
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800 dark:text-white">
                      Course Curriculum ({course.modules.length} modules)
                    </h3>
                    {course.modules.length > 0 ? (
                      <div className="space-y-4">
                        {course.modules.map((module, index) => (
                          <div
                            key={module.id}
                            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">{index + 1}.</span>
                              <BookOpen size={16} className="text-gray-400 dark:text-gray-500" />
                              <span className="font-medium text-gray-800 dark:text-white flex-1">{module.title}</span>
                              {module.duration && (
                                <span className="text-sm text-gray-500 dark:text-gray-400">{module.duration}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">No modules available</p>
                    )}
                  </div>
                )}

                {activeTab === 'instructor' && (
                  <div>
                    <div className="flex items-start gap-4 mb-6">
                      <img
                        src={getSafeImageUrl(course.instructor_image, course.instructor, '80/80')}
                        alt={course.instructor}
                        className="w-16 sm:w-20 h-16 sm:h-20 rounded-full object-cover"
                        onError={(e) => handleImageError(e, course.instructor, '80/80')}
                      />
                      <div>
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white">{course.instructor}</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">Course Instructor</p>
                      </div>
                    </div>
                    {course.instructor_bio && (
                      <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                        {parse(course.instructor_bio)}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800 dark:text-white">Student Reviews</h3>
                    <div className="text-center py-8">
                      <Star className="mx-auto text-gray-400 mb-4" size={48} />
                      <p className="text-gray-500 dark:text-gray-400">Reviews will be available after enrollment</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Enrollment Card */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 sticky top-8">
              {/* Price */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  {course.originalPrice && course.originalPrice > course.price && (
                    <span className="text-xl sm:text-2xl font-bold text-gray-400 dark:text-gray-500 line-through">
                      ${course.originalPrice}
                    </span>
                  )}
                  <span className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
                    {course.price === 0 ? 'Free' : `$${course.price}`}
                  </span>
                </div>
                {course.originalPrice && course.originalPrice > course.price && (
                  <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                    {Math.round((1 - course.price / course.originalPrice) * 100)}% off
                  </span>
                )}
              </div>

              {/* Action Button */}
              {isEnrolled ? (
                <Link href={`/courses/${course.id}/learn${lastModuleId ? `?module=${lastModuleId}` : ''}`}>
                  <button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 sm:py-3 px-4 rounded-lg transition-colors mb-4">
                    Resume Course
                  </button>
                </Link>
              ) : (
                <button
                  onClick={() => setShowEnrollmentModal(true)}
                  disabled={enrolling}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 sm:py-3 px-4 rounded-lg transition-colors mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {enrolling ? 'Enrolling...' : 'Enroll Now'}
                </button>
              )}

              {error && (
                <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded mt-4">
                  {error}
                </div>
              )}

              <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">30-day money-back guarantee</p>

              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800 dark:text-white">This course includes:</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Clock size={16} className="text-gray-400 dark:text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">{calculateTotalDuration()} on-demand video</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen size={16} className="text-gray-400 dark:text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">{course.modules.length} modules</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Download size={16} className="text-gray-400 dark:text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">Downloadable resources</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Globe size={16} className="text-gray-400 dark:text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">Full lifetime access</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield size={16} className="text-gray-400 dark:text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">Access on mobile and TV</span>
                  </div>
                  {course.certificate && (
                    <div className="flex items-center gap-3">
                      <Award size={16} className="text-gray-400 dark:text-gray-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">Certificate of completion</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enrollment Modal */}
      {showEnrollmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 sm:p-6 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-md sm:max-w-lg">
            {enrollmentSuccess ? (
              <>
                <h3 className="text-lg sm:text-xl font-semibold mb-4 text-green-600 dark:text-green-400">Enrollment Successful!</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  You have successfully enrolled in <strong>{course.title}</strong>. You can now start learning and access all course materials!
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">What's next?</h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• Access all course modules and materials</li>
                    <li>• Track your progress as you learn</li>
                    <li>• Join the course study group anytime</li>
                    <li>• Earn your completion certificate</li>
                  </ul>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setShowEnrollmentModal(false)}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                  <Link href={`/courses/${course.id}/learn${lastModuleId ? `?module=${lastModuleId}` : ''}`}>
                    <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors">
                      Start Learning
                    </button>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800 dark:text-white">Confirm Enrollment</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  You are about to enroll in <strong>{course.title}</strong>.
                  {course.price > 0 && ` This will charge ${course.price} to your account.`}
                </p>
                {error && (
                  <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
                    {error}
                  </div>
                )}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">What happens next?</h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• Immediate access to all course materials</li>
                    <li>• Progress tracking and completion certificates</li>
                    <li>• Join the course study group</li>
                    <li>• 30-day money-back guarantee</li>
                  </ul>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setShowEnrollmentModal(false)}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEnrollment}
                    disabled={enrolling}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {enrolling ? 'Processing...' : 'Confirm Enrollment'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <DebugPanel />
    </div>
  );
}