import { useState, useEffect } from 'react';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  serverTimestamp,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Module {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string;
  type: 'video' | 'text' | 'quiz';
  duration: number;
  order: number;
  moduleId: string;
  completed: boolean;
}

interface Progress {
  completedLessons: number;
  totalLessons: number;
  completedModules: number;
  totalModules: number;
  percentage: number;
  lastAccessedModule?: string;
  lastAccessedLesson?: string;
}

interface UserEnrollment {
  enrolledAt: any;
  progress: number;
  completedModules: string[];
  completedLessons: string[];
  lastAccessedModule?: string;
  lastAccessedLesson?: string;
  certificateEligible?: boolean;
  certificateGenerated?: boolean;
}

export const useCourseContent = (
  courseId: string,
  userId: string | null,
  moduleId?: string | null,
  lessonId?: string | null
) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [userEnrollment, setUserEnrollment] = useState<UserEnrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to convert course modules to lesson structure
  const convertCourseModulesToLessons = (courseModules: any[]): Module[] => {
    return courseModules.map((module, moduleIndex) => {
      // Extract lessons from module content
      const lessons: Lesson[] = [];
      
      // If module has content, convert it to lessons
      if (module.content) {
        let content = '';
        
        // Handle different content formats
        if (typeof module.content === 'string') {
          content = module.content;
        } else if (module.content.ops) {
          // Delta/Quill format
          content = module.content.ops
            .map((op: any) => op.insert || '')
            .join('');
        }
        
        // For now, create a single lesson per module
        // In a real app, you might want to parse the content to create multiple lessons
        const lesson: Lesson = {
          id: `${module.id}_lesson_1`,
          title: module.title || `${module.title} - Content`,
          description: `Main content for ${module.title}`,
          content: content,
          type: 'text', // Default to text, could be determined by content analysis
          duration: Math.max(5, Math.ceil(content.length / 200)), // Rough estimate: 200 chars per minute
          order: 1,
          moduleId: module.id,
          completed: false
        };
        
        lessons.push(lesson);
      }
      
      return {
        id: module.id,
        title: module.title || `Module ${moduleIndex + 1}`,
        description: module.description || `Content for module ${moduleIndex + 1}`,
        order: moduleIndex + 1,
        lessons
      };
    }).filter(module => module.lessons.length > 0); // Only include modules with lessons
  };

  // Load course content and user progress
  useEffect(() => {
    if (!courseId) {
      setLoading(false);
      return;
    }

    const loadCourseContent = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch course data
        const courseDoc = await getDoc(doc(db, 'courses', courseId));
        
        if (!courseDoc.exists()) {
          setError('Course not found');
          setLoading(false);
          return;
        }

        const courseData = courseDoc.data();
        const courseModules = courseData.modules || [];
        
        // Convert course modules to lesson structure
        const convertedModules = convertCourseModulesToLessons(courseModules);
        
        // Load user enrollment and progress if user is logged in
        let enrollment: UserEnrollment | null = null;
        if (userId) {
          try {
            const enrollmentDoc = await getDoc(
              doc(db, 'users', userId, 'enrollments', courseId)
            );
            
            if (enrollmentDoc.exists()) {
              enrollment = enrollmentDoc.data() as UserEnrollment;
            }
          } catch (enrollmentError) {
            console.error('Error loading user enrollment:', enrollmentError);
          }
        }

        // Update lesson completion status based on user progress
        const updatedModules = convertedModules.map(module => ({
          ...module,
          lessons: module.lessons.map(lesson => ({
            ...lesson,
            completed: enrollment?.completedLessons?.includes(lesson.id) || false
          }))
        }));

        // Calculate progress
        const totalLessons = updatedModules.reduce((sum, module) => sum + module.lessons.length, 0);
        const completedLessons = enrollment?.completedLessons?.length || 0;
        const totalModules = updatedModules.length;
        const completedModules = enrollment?.completedModules?.length || 0;

        const progressData: Progress = {
          completedLessons,
          totalLessons,
          completedModules,
          totalModules,
          percentage: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
          lastAccessedModule: enrollment?.lastAccessedModule,
          lastAccessedLesson: enrollment?.lastAccessedLesson
        };

        setModules(updatedModules);
        setUserEnrollment(enrollment);
        setProgress(progressData);

        // Set current lesson based on URL parameters or user progress
        if (moduleId && lessonId) {
          const targetModule = updatedModules.find(m => m.id === moduleId);
          const targetLesson = targetModule?.lessons.find(l => l.id === lessonId);
          setCurrentLesson(targetLesson || null);
        } else if (enrollment?.lastAccessedLesson) {
          // Resume from last accessed lesson
          const resumeModule = updatedModules.find(m => 
            m.lessons.some(l => l.id === enrollment.lastAccessedLesson)
          );
          const resumeLesson = resumeModule?.lessons.find(l => l.id === enrollment.lastAccessedLesson);
          setCurrentLesson(resumeLesson || null);
        } else if (updatedModules.length > 0 && updatedModules[0].lessons.length > 0) {
          // Start with first lesson
          setCurrentLesson(updatedModules[0].lessons[0]);
        }

      } catch (err: any) {
        console.error('Error loading course content:', err);
        setError(`Failed to load course content: ${err.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    loadCourseContent();
  }, [courseId, userId]);

  // Update current lesson when moduleId or lessonId changes
  useEffect(() => {
    if (modules.length > 0 && moduleId && lessonId) {
      const targetModule = modules.find(m => m.id === moduleId);
      const targetLesson = targetModule?.lessons.find(l => l.id === lessonId);
      setCurrentLesson(targetLesson || null);
    }
  }, [modules, moduleId, lessonId]);

  // Mark lesson as complete
  const markLessonComplete = async (lessonId: string) => {
    if (!userId || !courseId) {
      console.warn('User not authenticated or course ID missing');
      return;
    }

    try {
      const lesson = modules
        .flatMap(m => m.lessons)
        .find(l => l.id === lessonId);
      
      if (!lesson || lesson.completed) return;

      // Update local state immediately for better UX
      setModules(prevModules => 
        prevModules.map(module => ({
          ...module,
          lessons: module.lessons.map(l => 
            l.id === lessonId ? { ...l, completed: true } : l
          )
        }))
      );

      // Update progress
      const newCompletedLessons = (progress?.completedLessons || 0) + 1;
      const totalLessons = progress?.totalLessons || 0;
      const newPercentage = totalLessons > 0 ? Math.round((newCompletedLessons / totalLessons) * 100) : 0;

      setProgress(prev => prev ? {
        ...prev,
        completedLessons: newCompletedLessons,
        percentage: newPercentage
      } : null);

      // Check if module is complete
      const currentModule = modules.find(m => m.lessons.some(l => l.id === lessonId));
      const moduleCompleted = currentModule?.lessons.every(l => 
        l.id === lessonId || l.completed
      );

      // Update Firestore
      const enrollmentRef = doc(db, 'users', userId, 'enrollments', courseId);
      
      const updateData: any = {
        completedLessons: arrayUnion(lessonId),
        lastAccessedLesson: lessonId,
        lastAccessedModule: lesson.moduleId,
        lastAccessed: serverTimestamp(),
        progress: newPercentage
      };

      // If module is completed, add it to completed modules
      if (moduleCompleted && currentModule) {
        updateData.completedModules = arrayUnion(currentModule.id);
        
        // Update local progress
        setProgress(prev => prev ? {
          ...prev,
          completedModules: (prev.completedModules || 0) + 1
        } : null);
      }

      // If course is completed, mark as certificate eligible
      if (newPercentage === 100) {
        updateData.completedAt = serverTimestamp();
        updateData.certificateEligible = true;
      }

      await updateDoc(enrollmentRef, updateData);

    } catch (error) {
      console.error('Error marking lesson complete:', error);
      
      // Revert local state on error
      setModules(prevModules => 
        prevModules.map(module => ({
          ...module,
          lessons: module.lessons.map(l => 
            l.id === lessonId ? { ...l, completed: false } : l
          )
        }))
      );
    }
  };

  // Get next lesson
  const getNextLesson = (currentLessonId: string): { module: Module, lesson: Lesson } | null => {
    for (let moduleIndex = 0; moduleIndex < modules.length; moduleIndex++) {
      const module = modules[moduleIndex];
      const lessonIndex = module.lessons.findIndex(l => l.id === currentLessonId);
      
      if (lessonIndex !== -1) {
        // Next lesson in current module
        if (lessonIndex < module.lessons.length - 1) {
          return {
            module,
            lesson: module.lessons[lessonIndex + 1]
          };
        }
        
        // First lesson of next module
        if (moduleIndex < modules.length - 1) {
          const nextModule = modules[moduleIndex + 1];
          if (nextModule.lessons.length > 0) {
            return {
              module: nextModule,
              lesson: nextModule.lessons[0]
            };
          }
        }
        
        break;
      }
    }
    
    return null;
  };

  // Get previous lesson
  const getPreviousLesson = (currentLessonId: string): { module: Module, lesson: Lesson } | null => {
    for (let moduleIndex = 0; moduleIndex < modules.length; moduleIndex++) {
      const module = modules[moduleIndex];
      const lessonIndex = module.lessons.findIndex(l => l.id === currentLessonId);
      
      if (lessonIndex !== -1) {
        // Previous lesson in current module
        if (lessonIndex > 0) {
          return {
            module,
            lesson: module.lessons[lessonIndex - 1]
          };
        }
        
        // Last lesson of previous module
        if (moduleIndex > 0) {
          const prevModule = modules[moduleIndex - 1];
          if (prevModule.lessons.length > 0) {
            return {
              module: prevModule,
              lesson: prevModule.lessons[prevModule.lessons.length - 1]
            };
          }
        }
        
        break;
      }
    }
    
    return null;
  };

  // Update last accessed lesson (for tracking user progress)
  const updateLastAccessed = async (lessonId: string, moduleId: string) => {
    if (!userId || !courseId) return;

    try {
      const enrollmentRef = doc(db, 'users', userId, 'enrollments', courseId);
      await updateDoc(enrollmentRef, {
        lastAccessedLesson: lessonId,
        lastAccessedModule: moduleId,
        lastAccessed: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating last accessed:', error);
    }
  };

  return {
    modules,
    currentLesson,
    progress,
    userEnrollment,
    loading,
    error,
    markLessonComplete,
    getNextLesson,
    getPreviousLesson,
    updateLastAccessed
  };
};