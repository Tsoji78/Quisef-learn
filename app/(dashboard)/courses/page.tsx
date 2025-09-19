'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

interface Course {
  id: string;
  title: string;
  instructor: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  progress: number;
  thumbnail: string;
  category: string;
  groupId?: string;
}

export default function CoursesPage() {
  const { isDark } = useTheme();
  const { user } = useAuth(); // Use the user from AuthContext instead of local state
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollmentStatus, setEnrollmentStatus] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 6;
  const enrollmentCache = useRef<Record<string, boolean>>({});

  // Remove the redundant auth state listener since we're using AuthContext
  useEffect(() => {
    if (user) {
      checkEnrollmentStatus(user.uid);
    } else {
      setEnrollmentStatus({});
      enrollmentCache.current = {};
    }
  }, [user]);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      setError(null); // Clear previous errors
      try {
        console.log('Fetching courses...'); // Debug log
        const coursesCollection = collection(db, 'courses');
        const coursesSnapshot = await getDocs(coursesCollection);
        
        console.log('Courses snapshot size:', coursesSnapshot.size); // Debug log
        
        if (coursesSnapshot.empty) {
          console.log('No courses found in database');
          setCourses([]);
          setLoading(false);
          return;
        }

        const coursesList: Course[] = await Promise.all(
          coursesSnapshot.docs.map(async (courseDoc) => {
            const data = courseDoc.data();
            console.log('Course data:', { id: courseDoc.id, data }); // Debug log
            
            let groupId: string | undefined = undefined;
            try {
              const groupsQuery = query(collection(db, 'groups'), where('courseId', '==', courseDoc.id));
              const groupsSnapshot = await getDocs(groupsQuery);
              if (!groupsSnapshot.empty) {
                groupId = groupsSnapshot.docs[0].id;
              }
            } catch (groupError) {
              console.warn('Error fetching group info for course:', courseDoc.id, groupError);
            }

            return {
              id: courseDoc.id,
              title: data.title || 'Untitled Course',
              instructor: data.instructor || 'Unknown Instructor',
              level: ['Beginner', 'Intermediate', 'Advanced'].includes(data.level)
                ? data.level
                : 'Beginner',
              duration: data.duration || 'Unknown',
              progress: typeof data.progress === 'number' ? data.progress : 0,
              thumbnail: data.thumbnail || '/api/placeholder/400/250?text=No+Image',
              category: data.category || 'Uncategorized',
              groupId,
            };
          })
        );
        
        console.log('Processed courses:', coursesList); // Debug log
        setCourses(coursesList);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching courses:', err); // Debug log
        setError(`Failed to load courses: ${err.message || 'Unknown error'}`);
        setCourses([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []); // Remove user dependency to avoid infinite loops

  const checkEnrollmentStatus = async (userId: string) => {
    if (!userId) return;
    try {
      console.log('Checking enrollment status for user:', userId); // Debug log
      const enrollmentsQuery = query(collection(db, 'users', userId, 'enrollments'));
      const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
      
      const status: Record<string, boolean> = {};
      enrollmentsSnapshot.forEach((doc) => {
        status[doc.id] = true;
      });
      
      console.log('Enrollment status:', status); // Debug log
      enrollmentCache.current = status;
      setEnrollmentStatus(status);
    } catch (err) {
      console.error('Error checking enrollment status:', err);
    }
  };

  // Handle URL parameter for enrollment refresh
  useEffect(() => {
    if (user && typeof window !== 'undefined' && window.location.search.includes('enrolled=true')) {
      checkEnrollmentStatus(user.uid);
    }
  }, [user]);

  const filteredCourses = filter === 'All' ? courses : courses.filter((course) => course.category === filter);
  const totalPages = Math.ceil(filteredCourses.length / coursesPerPage);
  const currentCourses = filteredCourses.slice(
    (currentPage - 1) * coursesPerPage,
    currentPage * coursesPerPage
  );

  const paginate = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      // Scroll to top when changing pages
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getPageNumbers = () => {
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };

  const categories = ['All', ...new Set(courses.map((course) => course.category))];

  // Loading state
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
        <div className="mb-4 sm:mb-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
            {user ? 'My Courses' : 'Available Courses'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {user 
              ? `Welcome back! Continue your learning journey.`
              : 'Discover and explore our course catalog.'
            }
          </p>
        </div>
        
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 justify-end">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => {
                setFilter(category);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-full transition-colors duration-200 text-sm sm:text-base
                ${filter === category
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* Authentication Notice */}
      {!user && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 px-4 py-3 rounded mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p className="text-sm">
              <Link href="/login" className="font-semibold hover:underline">
                Sign in
              </Link>{' '}
              to enroll in courses and track your progress, or{' '}
              <Link href="/register" className="font-semibold hover:underline">
                create an account
              </Link>{' '}
              to get started.
            </p>
          </div>
        </div>
      )}

      {/* Courses Grid */}
      {currentCourses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {currentCourses.map((course) => (
            <div key={course.id} className="group">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1">
                {/* Course Thumbnail */}
                <div className="relative">
                  <img 
                    src={course.thumbnail} 
                    alt={course.title} 
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/api/placeholder/400/250?text=' + encodeURIComponent(course.title);
                    }}
                  />
                  <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                    {course.level}
                  </div>
                  {enrollmentStatus[course.id] && (
                    <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                      Enrolled
                    </div>
                  )}
                </div>

                {/* Course Content */}
                <div className="p-4 sm:p-6">
                  <Link href={`/courses/${course.id}`}>
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white mb-2 hover:underline hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      {course.title}
                    </h2>
                  </Link>
                  
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      {course.instructor}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      {course.duration}
                    </span>
                  </div>

                  <div className="mt-4">
                    {user ? (
                      enrollmentStatus[course.id] ? (
                        <div className="space-y-3">
                          <Link href={`/courses/${course.id}/learn`}>
                            <button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200">
                              Resume Course
                            </button>
                          </Link>
                          <div>
                            <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-blue-600 rounded-full h-2 transition-all duration-300"
                                style={{ width: `${course.progress}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between mt-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400">Progress</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">{course.progress}%</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <Link href={`/courses/${course.id}`}>
                          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200">
                            Enroll Now
                          </button>
                        </Link>
                      )
                    ) : (
                      <div className="space-y-2">
                        <Link href={`/courses/${course.id}`}>
                          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200">
                            View Course
                          </button>
                        </Link>
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                          Sign in to enroll and track progress
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" clipRule="evenodd" />
          </svg>
          <p className="text-lg sm:text-xl">
            {filter === 'All' 
              ? 'No courses available at the moment.' 
              : `No courses found in "${filter}" category.`
            }
          </p>
          {filter !== 'All' && (
            <button
              onClick={() => {
                setFilter('All');
                setCurrentPage(1);
              }}
              className="mt-4 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              View all courses
            </button>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-8 space-x-2">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-lg text-sm sm:text-base transition-colors duration-200
              ${currentPage === 1
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
          >
            Previous
          </button>
          
          {getPageNumbers().map((number) => (
            <button
              key={number}
              onClick={() => paginate(number)}
              className={`px-4 py-2 rounded-lg text-sm sm:text-base transition-colors duration-200
                ${currentPage === number
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
            >
              {number}
            </button>
          ))}
          
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded-lg text-sm sm:text-base transition-colors duration-200
              ${currentPage === totalPages
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}