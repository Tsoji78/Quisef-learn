'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { ArrowLeft, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import parse from 'html-react-parser';

interface Module {
  id: string;
  title: string;
  content: string;
  completed?: boolean;
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
}

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [userProgress, setUserProgress] = useState<UserProgress>({
    readModules: {},
    scrollPositions: {},
    lastReadDate: new Date(),
  });
  const [savingProgress, setSavingProgress] = useState(false);
  const contentRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle authentication state
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && courseId) {
        loadUserProgress(currentUser.uid, courseId);
      }
    });
    return () => unsubscribe();
  }, [courseId]);

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
        });
      }
    } catch (err) {
      console.error('Error loading user progress:', err);
    }
  };

  // Save user progress with debounce
  const saveUserProgress = async (updatedProgress: UserProgress) => {
    if (!user || !courseId || savingProgress) return;
    setSavingProgress(true);
    try {
      const progressRef = doc(db, 'users', user.uid, 'courseProgress', courseId);
      await updateDoc(progressRef, {
        readModules: updatedProgress.readModules,
        scrollPositions: updatedProgress.scrollPositions,
        lastReadDate: new Date(),
        courseId,
        userId: user.uid,
      });

      if (course) {
        const totalModules = course.modules.length;
        const completedModules = Object.values(updatedProgress.readModules).filter(Boolean).length;
        const newProgressPercentage = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
        const courseRef = doc(db, 'courses', courseId);
        await updateDoc(courseRef, { progress: newProgressPercentage });
        setCourse((prev) => prev ? { ...prev, progress: newProgressPercentage } : null);
      }
    } catch (err) {
      console.error('Error saving progress:', err);
    } finally {
      setSavingProgress(false);
    }
  };

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
    };

    if (scrollPercentage >= 0.9) {
      updatedProgress.readModules = {
        ...userProgress.readModules,
        [moduleId]: true,
      };
    }

    setUserProgress(updatedProgress);

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveUserProgress(updatedProgress);
    }, 2000);
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
    const fetchCourse = async () => {
      if (!courseId) {
        setError('No course ID provided');
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const docRef = doc(db, 'courses', courseId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const courseData: Course = {
            id: docSnap.id,
            title: data.title || 'Untitled Course',
            instructor: data.instructor || 'Unknown Instructor',
            description: data.description || 'No description available.',
            level: ['Beginner', 'Intermediate', 'Advanced'].includes(data.level) ? data.level : 'Beginner',
            duration: data.duration || 'Unknown',
            progress: typeof data.progress === 'number' ? data.progress : 0,
            thumbnail: data.thumbnail || '/api/placeholder/400/250?text=No+Image',
            category: data.category || 'Uncategorized',
            modules: Array.isArray(data.modules)
              ? data.modules.map((m: any) => ({
                  id: m.id || crypto.randomUUID(),
                  title: m.title || 'Untitled Module',
                  content: m.content || '',
                  completed: false,
                }))
              : [],
          };
          setCourse(courseData);
          setExpandedModules(
            courseData.modules.reduce((acc, module) => ({ ...acc, [module.id]: true }), {})
          );
          setError(null);
        } else {
          setError('Course not found');
        }
      } catch (err: any) {
        console.error('Error fetching course:', err);
        setError(`Failed to load course: ${err.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  const calculateProgress = () => {
    if (!course) return 0;
    const totalModules = course.modules.length;
    if (totalModules === 0) return 0;
    const completedModules = course.modules.filter((module) => userProgress.readModules[module.id]).length;
    return Math.round((completedModules / totalModules) * 100);
  };

  const toggleModuleRead = (moduleId: string) => {
    const updatedProgress = {
      ...userProgress,
      readModules: {
        ...userProgress.readModules,
        [moduleId]: !userProgress.readModules[moduleId],
      },
      lastReadDate: new Date(),
    };
    setUserProgress(updatedProgress);
    saveUserProgress(updatedProgress);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error || 'Course not found'}
        </div>
        <Link href="/courses" className="flex items-center text-blue-600 hover:text-blue-800">
          <ArrowLeft size={18} className="mr-2" />
          Back to Courses
        </Link>
      </div>
    );
  }

  const currentProgress = calculateProgress();

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/courses" className="flex items-center text-blue-600 hover:text-blue-800 mb-6">
        <ArrowLeft size={18} className="mr-2" />
        Back to Courses
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="md:flex">
          <img src={course.thumbnail} alt={course.title} className="w-full md:w-1/3 h-64 object-cover" />
          <div className="p-6 flex-1">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">{course.title}</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{course.description}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Instructor:</span>
                <span className="ml-2 text-gray-800 dark:text-white">{course.instructor}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Level:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs 
                  ${course.level === 'Beginner' ? 'bg-green-100 text-green-800' : 
                    course.level === 'Intermediate' ? 'bg-blue-100 text-blue-800' : 
                    'bg-purple-100 text-purple-800'}`}>
                  {course.level}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Duration:</span>
                <span className="ml-2 text-gray-800 dark:text-white">{course.duration}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Category:</span>
                <span className="ml-2 text-gray-800 dark:text-white">{course.category}</span>
              </div>
            </div>
            {user && (
              <div className="mt-6">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 rounded-full h-2 transition-all duration-700"
                    style={{ width: `${currentProgress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Progress</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{currentProgress}%</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Modules</h2>
        {course.modules.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No modules available for this course.</p>
        ) : (
          <div className="space-y-6">
            {course.modules.map((module) => (
              <div key={module.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <div
                  className="px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={() => toggleModule(module.id)}
                >
                  <div className="flex items-center">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{module.title}</h3>
                    {userProgress.readModules[module.id] && (
                      <CheckCircle className="ml-2 text-green-500" size={18} />
                    )}
                  </div>
                  <div className="flex items-center">
                    <button
                      className={`mr-4 text-sm px-3 py-1 rounded-full ${
                        userProgress.readModules[module.id]
                          ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleModuleRead(module.id);
                      }}
                    >
                      {userProgress.readModules[module.id] ? 'Mark Unread' : 'Mark Read'}
                    </button>
                    {expandedModules[module.id] ? (
                      <ChevronUp className="text-gray-500 dark:text-gray-400" size={20} />
                    ) : (
                      <ChevronDown className="text-gray-500 dark:text-gray-400" size={20} />
                    )}
                  </div>
                </div>
                {expandedModules[module.id] && (
                  <div className="px-6 pb-6">
                    <div
                      ref={(el) => { contentRefs.current[module.id] = el; }}
                      onScroll={() => handleScroll(module.id)}
                      className="prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 max-h-96 overflow-y-auto p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      {parse(module.content || '<p>No content available.</p>')}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}