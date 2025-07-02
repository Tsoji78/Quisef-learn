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
  duration?: string;
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
  courseId: string;
  userId: string;
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
    courseId: '',
    userId: '',
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
          courseId: data.courseId || courseId,
          userId: data.userId || userId,
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
        courseId: updatedProgress.courseId,
        userId: updatedProgress.userId,
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
      courseId,
      userId: user?.uid || '',
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
        console.error('Error fetching course:', err);
        setError(`Failed to load course: ${err.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId]);

  // Toggle module expansion
  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  if (loading) {
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="relative">
            <img src={course.thumbnail} alt={course.title} className="w-full h-64 object-cover" />
          </div>
          <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">{course.title}</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{course.description}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <p>Instructor: {course.instructor}</p>
              <p>Level: {course.level}</p>
              <p>Duration: {course.duration}</p>
              <p>Progress: {course.progress}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">Course Content</h2>
            <div className="space-y-4">
              {course.modules.map((module) => (
                <div key={module.id} className="border border-gray-200 dark:border-gray-700 rounded-lg">
                  <button
                    onClick={() => toggleModule(module.id)}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-800 dark:text-white">{module.title}</span>
                      {userProgress.readModules[module.id] && (
                        <CheckCircle className="text-green-500" size={16} />
                      )}
                    </div>
                    {expandedModules[module.id] ? (
                      <ChevronUp className="text-gray-400" size={20} />
                    ) : (
                      <ChevronDown className="text-gray-400" size={20} />
                    )}
                  </button>
                  {expandedModules[module.id] && (
                    <div
                      ref={(el) => { contentRefs.current[module.id] = el; }}
                      onScroll={() => handleScroll(module.id)}
                      className="p-4 max-h-96 overflow-y-auto prose dark:prose-invert"
                    >
                      {parse(module.content)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}