'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '@/lib/firebase';

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
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollmentStatus, setEnrollmentStatus] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 6;

  // Authentication check
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && courses.length > 0) {
        checkEnrollmentStatus(currentUser.uid, courses);
      }
    });
    return () => unsubscribe();
  }, [courses]);

  // Fetch courses from Firestore
  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const coursesCollection = collection(db, 'courses');
        const coursesSnapshot = await getDocs(coursesCollection);
        const coursesList: Course[] = coursesSnapshot.docs.map((doc) => ({
          id: doc.id,
          title: doc.data().title || 'Untitled Course',
          instructor: doc.data().instructor || 'Unknown Instructor',
          level: ['Beginner', 'Intermediate', 'Advanced'].includes(doc.data().level)
            ? doc.data().level
            : 'Beginner',
          duration: doc.data().duration || 'Unknown',
          progress: typeof doc.data().progress === 'number' ? doc.data().progress : 0,
          thumbnail: doc.data().thumbnail || '/api/placeholder/400/250?text=No+Image',
          category: doc.data().category || 'Uncategorized',
          groupId: doc.data().groupId || null,
        }));
        setCourses(coursesList);
        setError(null);
        if (user) {
          checkEnrollmentStatus(user.uid, coursesList);
        }
      } catch (err: any) {
        console.error('Error fetching courses:', err);
        setError(`Failed to load courses: ${err.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [user]);

  // Check enrollment status for all courses
  const checkEnrollmentStatus = async (userId: string, courses: Course[]) => {
    try {
      const status: Record<string, boolean> = {};
      for (const course of courses) {
        const enrollmentRef = doc(db, 'users', userId, 'enrollments', course.id);
        const enrollmentSnap = await getDoc(enrollmentRef);
        status[course.id] = enrollmentSnap.exists();
      }
      setEnrollmentStatus(status);
    } catch (err) {
      console.error('Error checking enrollment status:', err);
    }
  };

  // Filter and paginate courses
  const filteredCourses = filter === 'All' ? courses : courses.filter((course) => course.category === filter);
  const totalPages = Math.ceil(filteredCourses.length / coursesPerPage);
  const currentCourses = filteredCourses.slice(
    (currentPage - 1) * coursesPerPage,
    currentPage * coursesPerPage
  );

  const paginate = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">My Courses</h1>
        <div className="flex flex-wrap gap-2 justify-end">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => {
                setFilter(category);
                setCurrentPage(1);
              }}
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
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentCourses.map((course) => (
          <div key={course.id} className="group">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl transform hover:-translate-y-2 hover:scale-105">
              <div className="relative">
                <img src={course.thumbnail} alt={course.title} className="w-full h-48 object-cover" />
                <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-full text-xs">
                  {course.level}
                </div>
              </div>
              <div className="p-6">
                <Link href={`/courses/${course.id}`}>
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2 hover:underline">{course.title}</h2>
                </Link>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{course.instructor}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{course.duration}</span>
                </div>
                {course.groupId && (
                  <div className="mt-2">
                    <Link href="/groups" className="text-blue-600 hover:underline text-sm">
                      Join Study Group
                    </Link>
                  </div>
                )}
                {user && (
                  <div className="mt-4">
                    {enrollmentStatus[course.id] ? (
                      <>
                        <Link href={`/courses/${course.id}/learn`}>
                          <button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                            Resume Course
                          </button>
                        </Link>
                        <div className="mt-2">
                          <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-600 rounded-full h-2"
                              style={{ width: `${course.progress}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between mt-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Progress</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{course.progress}%</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <Link href={`/courses/${course.id}`}>
                        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                          Enroll Now
                        </button>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {!loading && currentCourses.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p className="text-xl">No courses found in this category.</p>
        </div>
      )}
      {filteredCourses.length > 0 && (
        <div className="flex justify-center items-center mt-8 space-x-2">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-lg ${
              currentPage === 1
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
              className={`px-4 py-2 rounded-lg ${
                currentPage === number
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
            className={`px-4 py-2 rounded-lg ${
              currentPage === totalPages
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