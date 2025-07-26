'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { ArrowLeft, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import parse from 'html-react-parser';
import { toast } from 'react-hot-toast';
import debounce from 'lodash/debounce';

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
  progress: number;
  thumbnail: string;
  category: string;
  modules: Module[];
}

interface UserProgress {
  readModules: Record<string, boolean>;
  scrollPositions: Record<string, number>;
  lastReadDate: Date;
  courseId: string;
  userId: string;
  progress: number;
}

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [userProgress, setUserProgress] = useState<UserProgress>({
    readModules: {},
    scrollPositions: {},
    lastReadDate: new Date(),
    courseId: '',
    userId: '',
    progress: 0,
  });
  const [savingProgress, setSavingProgress] = useState(false);
  const contentRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Get friendly error message
  const getFriendlyErrorMessage = (error: any) => {
    switch (error.code) {
      case 'permission-denied':
        return 'You do not have permission to access this course. Please enroll or contact support.';
      case 'not-found':
        return 'Course or progress data not found.';
      default:
        return `An error occurred: ${error.message || 'Unknown error'}`;
    }
  };

  // Handle authentication state
  useEffect(() => {
    setAuthLoading(true);
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && courseId) {
        loadUserProgress(currentUser.uid, courseId);
      } else if (!currentUser) {
        router.push('/login');
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [courseId, router]);

  // Load user progress
  const loadUserProgress = async (userId: string, courseId: string) => {
    try {
      const progressRef = doc(db, 'users', userId, 'courseProgress', courseId);
      const progressSnap = await getDoc(progressRef);
      if (progressSnap.exists()) {
        const data = progressSnap.data();
        setUserProgress({
          readModules: data.readModules || {},
          scrollPositions: data.scrollPositions || {},
          lastReadDate: data.lastReadDate ? data.lastReadDate.toDate() : new Date(),
          courseId: data.courseId || courseId,
          userId: data.userId || userId,
          progress: data.progress || 0,
        });
      } else {
        const defaultProgress: UserProgress = {
          readModules: {},
          scrollPositions: {},
          lastReadDate: new Date(),
          courseId,
          userId,
          progress: 0,
        };
        await setDoc(progressRef, defaultProgress);
        setUserProgress(defaultProgress);
        toast.success('Enrolled in course!');
      }
    } catch (err: any) {
      console.error('Error loading user progress:', err.code, err.message, err);
      setError(getFriendlyErrorMessage(err));
    }
  };

  // Save user progress with debounce
  const saveUserProgress = debounce(async (updatedProgress: UserProgress) => {
    if (!user || !courseId || savingProgress || !course) return;
    setSavingProgress(true);
    try {
      const progressRef = doc(db, 'users', user.uid, 'courseProgress', courseId);
      await updateDoc(progressRef, {
        readModules: updatedProgress.readModules,
        scrollPositions: updatedProgress.scrollPositions,
        lastReadDate: new Date(),
        courseId: updatedProgress.courseId,
        userId: updatedProgress.userId,
        progress: updatedProgress.progress,
      });

      const totalModules = course.modules.length;
      const completedModules = Object.values(updatedProgress.readModules).filter(Boolean).length;
      const newProgressPercentage = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
      if (newProgressPercentage !== updatedProgress.progress) {
        updatedProgress.progress = newProgressPercentage;
        await updateDoc(progressRef, { progress: newProgressPercentage });
        const courseRef = doc(db, 'courses', courseId);
        await updateDoc(courseRef, { progress: newProgressPercentage });
        setCourse((prev) => (prev ? { ...prev, progress: newProgressPercentage } : null));
      }
      toast.success('Progress saved!');
    } catch (err: any) {
      console.error('Error saving progress:', err.code, err.message, err);
      toast.error('Failed to save progress');
    } finally {
      setSavingProgress(false);
    }
  }, 2000);

  // Handle scroll tracking
  const handleScroll = (moduleId: string) => {
    if (!contentRefs.current[moduleId]) return;
    const element = contentRefs.current[moduleId];
    const scrollHeight = element.scrollHeight;
    const scrollTop = element.scrollTop;
    const clientHeight = element.clientHeight;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

    const updatedProgress = {
      ...userProgress,
      scrollPositions: {
        ...userProgress.scrollPositions,
        [moduleId]: scrollTop,
      },
      lastReadDate: new Date(),
      courseId,
      userId: user?.uid || '',
    };

    if (scrollPercentage >= 0.9 && !userProgress.readModules[moduleId]) {
      updatedProgress.readModules = {
        ...userProgress.readModules,
        [moduleId]: true,
      };
      if (course) {
        const totalModules = course.modules.length;
        const completedModules = Object.values(updatedProgress.readModules).filter(Boolean).length;
        updatedProgress.progress = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
      }
    }

    setUserProgress(updatedProgress);
    saveUserProgress(updatedProgress);
  };

  // Restore scroll positions
  useEffect(() => {
    Object.entries(expandedModules).forEach(([moduleId, isExpanded]) => {
      if (isExpanded && contentRefs.current[moduleId] && userProgress.scrollPositions[moduleId]) {
        contentRefs.current[moduleId]!.scrollTop = userProgress.scrollPositions[moduleId];
      }
    });
  }, [expandedModules, userProgress.scrollPositions]);

  // Fetch course details
  useEffect(() => {
    if (!user || !courseId || authLoading) return;
    const fetchCourse = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'courses', courseId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCourse({
            id: docSnap.id,
            title: data.title || 'Untitled Course',
            instructor: data.instructor || 'Unknown Instructor',
            description: data.description || 'No description available.',
            level: ['Beginner', 'Intermediate', 'Advanced'].includes(data.level) ? data.level : 'Beginner',
            duration: data.duration || 'Unknown',
            progress: data.progress || 0,
            thumbnail: data.thumbnail || '/api/placeholder/400/250?text=No+Image',
            category: data.category || 'Uncategorized',
            modules: Array.isArray(data.modules) ? data.modules : [],
          });
          setError(null);
        } else {
          setError('Course not found');
        }
      } catch (err: any) {
        console.error('Error fetching course:', err.code, err.message, err);
        setError(getFriendlyErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId, user, authLoading]);

  // Toggle module expansion
  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error || 'Course not found'}
          </div>
          <Link href="/courses" className="flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft size={18} className="mr-2" />
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Link href="/courses" className="flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft size={18} className="mr-2" />
            Back to Courses
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Course Content */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">{course.title}</h1>
              <p className="text-gray-600 dark:text-gray-300 mb-4">{course.description}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span>{course.instructor}</span>
                <span>{course.level}</span>
                <span>{course.duration}</span>
              </div>
              <div className="mt-6">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 rounded-full h-2"
                    style={{ width: `${course.progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>Progress</span>
                  <span>{course.progress}%</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white p-6 border-b dark:border-gray-700">
                Course Content
              </h2>
              <div className="divide-y dark:divide-gray-700">
                {course.modules.map((module, index) => (
                  <div key={module.id}>
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                      onClick={() => toggleModule(module.id)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{index + 1}.</span>
                        <span className="font-medium text-gray-800 dark:text-white">{module.title}</span>
                        {userProgress.readModules[module.id] && (
                          <CheckCircle className="text-green-500" size={16} />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {module.duration && (
                          <span className="text-sm text-gray-500 dark:text-gray-400">{module.duration}</span>
                        )}
                        {expandedModules[module.id] ? (
                          <ChevronUp className="text-gray-500" size={20} />
                        ) : (
                          <ChevronDown className="text-gray-500" size={20} />
                        )}
                      </div>
                    </div>
                    {expandedModules[module.id] && (
                      <div
                        className="px-6 py-4 text-gray-700 dark:text-gray-300 prose dark:prose-invert max-w-none max-h-[60vh] overflow-y-auto"
                        ref={(el) => { contentRefs.current[module.id] = el; }}
                        onScroll={() => handleScroll(module.id)}
                      >
                        {parse(module.content)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sticky top-8">
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-40 object-cover rounded-lg mb-4"
              />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                Course Progress
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {userProgress.progress}% Complete
              </p>
              <div className="space-y-2">
                {course.modules.map((module) => (
                  <div
                    key={module.id}
                    className="flex items-center gap-2 text-sm cursor-pointer hover:text-blue-600"
                    onClick={() => toggleModule(module.id)}
                  >
                    {userProgress.readModules[module.id] ? (
                      <CheckCircle className="text-green-500" size={16} />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                    )}
                    <span className="truncate">{module.title}</span>
                  </div>
                ))}
              </div>
              <Link href="/groups">
                <button className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                  Join Study Group
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}