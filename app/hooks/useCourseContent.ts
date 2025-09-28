// Updated useCourseContent hook with better error handling
import { useState, useEffect } from 'react';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Type definitions
export type Lesson = {
  id: string;
  title: string;
  description: string;
  content: string;
  rawContent: any;
  type: string;
  duration: number;
  order: number;
  moduleId: string;
  completed: boolean;
};

export type Module = {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
  rawContent: any;
};

export type Progress = {
  completedLessons: number;
  totalLessons: number;
  completedModules: number;
  totalModules: number;
  percentage: number;
  lastAccessedModule?: string;
  lastAccessedLesson?: string;
};

export type UserEnrollment = {
  completedLessons?: string[];
  completedModules?: string[];
  lastAccessedModule?: string;
  lastAccessedLesson?: string;
  [key: string]: any;
};

// Helper function to convert Draft.js content to HTML for display
const convertDraftContentToHTML = (content: any): string => {
  if (!content) return '';
  
  try {
    // If it's already a string, return it
    if (typeof content === 'string') {
      return content;
    }
    
    // If it's Draft.js format with ops array
    if (content.ops && Array.isArray(content.ops)) {
      return content.ops
        .map((op: any) => op.insert || '')
        .join('')
        .replace(/\n/g, '<br>');
    }
    
    // If it's proper Draft.js raw content state
    if (content.blocks && Array.isArray(content.blocks)) {
      try {
        const { convertFromRaw } = require('draft-js');
        const { stateToHTML } = require('draft-js-export-html');
        const contentState = convertFromRaw(content);
        return stateToHTML(contentState);
      } catch (importError) {
        // Fallback if draft-js is not available
        return content.blocks
          .map((block: any) => block.text || '')
          .join('<br>');
      }
    }
    
    return JSON.stringify(content);
    
  } catch (error) {
    console.warn('Error converting content:', error);
    return typeof content === 'string' ? content : '';
  }
};

// Safe conversion function that handles missing data
const convertCourseModulesToLessons = (courseModules: any[]): Module[] => {
  if (!Array.isArray(courseModules)) {
    console.warn('courseModules is not an array:', courseModules);
    return [];
  }

  return courseModules.map((module, moduleIndex) => {
    if (!module || typeof module !== 'object') {
      console.warn('Invalid module data:', module);
      return null;
    }

    const lessons: Lesson[] = [];
    
    // Convert module content to lesson
    if (module.content) {
      const htmlContent = convertDraftContentToHTML(module.content);
      
      const lesson: Lesson = {
        id: `${module.id || `module_${moduleIndex}`}_lesson_1`,
        title: module.title || `${module.title || `Module ${moduleIndex + 1}`} - Content`,
        description: `Main content for ${module.title || `Module ${moduleIndex + 1}`}`,
        content: htmlContent,
        rawContent: module.content,
        type: 'text',
        duration: Math.max(5, Math.ceil(htmlContent.length / 200)),
        order: 1,
        moduleId: module.id || `module_${moduleIndex}`,
        completed: false
      };
      
      lessons.push(lesson);
    }
    
    return {
      id: module.id || `module_${moduleIndex}`,
      title: module.title || `Module ${moduleIndex + 1}`,
      description: module.description || `Content for module ${moduleIndex + 1}`,
      order: moduleIndex + 1,
      lessons,
      rawContent: module.content
    };
  }).filter(Boolean) as Module[]; // Filter out null values
};

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
        console.log('Loading course content for:', courseId);
        
        // Fetch course data
        const courseDoc = await getDoc(doc(db, 'courses', courseId));
        
        if (!courseDoc.exists()) {
          setError('Course not found');
          setLoading(false);
          return;
        }

        const courseData = courseDoc.data();
        console.log('Course data loaded:', courseData);
        
        const courseModules = courseData?.modules || [];
        console.log('Course modules:', courseModules);
        
        if (!Array.isArray(courseModules) || courseModules.length === 0) {
          console.warn('No modules found in course');
          setError('No course content available');
          setLoading(false);
          return;
        }
        
        // Convert course modules to lesson structure with proper content handling
        const convertedModules = convertCourseModulesToLessons(courseModules);
        console.log('Converted modules:', convertedModules);
        
        if (convertedModules.length === 0) {
          setError('Failed to convert course content');
          setLoading(false);
          return;
        }
        
        // Load user enrollment and progress if user is logged in
        let enrollment: UserEnrollment | null = null;
        if (userId) {
          try {
            const enrollmentDoc = await getDoc(
              doc(db, 'users', userId, 'enrollments', courseId)
            );
            
            if (enrollmentDoc.exists()) {
              enrollment = enrollmentDoc.data() as UserEnrollment;
              console.log('User enrollment:', enrollment);
            }
          } catch (enrollmentError) {
            console.error('Error loading user enrollment:', enrollmentError);
            // Continue without enrollment data
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
        const totalLessons = updatedModules.reduce((sum, module) => sum + (module.lessons?.length || 0), 0);
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

        console.log('Setting modules and progress:', { updatedModules, progressData });
        
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

  const getNextLesson = (currentLessonId: string): { module: Module, lesson: Lesson } | null => {
    for (let moduleIndex = 0; moduleIndex < modules.length; moduleIndex++) {
      const module = modules[moduleIndex];
      const lessonIndex = module.lessons.findIndex(l => l.id === currentLessonId);
      
      if (lessonIndex !== -1) {
        if (lessonIndex < module.lessons.length - 1) {
          return {
            module,
            lesson: module.lessons[lessonIndex + 1]
          };
        }
        
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

  const getPreviousLesson = (currentLessonId: string): { module: Module, lesson: Lesson } | null => {
    for (let moduleIndex = 0; moduleIndex < modules.length; moduleIndex++) {
      const module = modules[moduleIndex];
      const lessonIndex = module.lessons.findIndex(l => l.id === currentLessonId);
      
      if (lessonIndex !== -1) {
        if (lessonIndex > 0) {
          return {
            module,
            lesson: module.lessons[lessonIndex - 1]
          };
        }
        
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

// Updated useModuleNavigation hook with better error handling
export const useModuleNavigation = ({ 
  modules, 
  moduleId, 
  courseId 
}: {
  modules: Module[];
  moduleId: string | null;
  courseId: string;
}) => {
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [previousModule, setPreviousModule] = useState<Module | null>(null);
  const [nextModule, setNextModule] = useState<Module | null>(null);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(-1);

  useEffect(() => {
    if (!Array.isArray(modules) || modules.length === 0) {
      setCurrentModule(null);
      setPreviousModule(null);
      setNextModule(null);
      setCurrentModuleIndex(-1);
      return;
    }

    let module = null;
    let index = -1;

    if (moduleId) {
      index = modules.findIndex(m => m.id === moduleId);
      module = index >= 0 ? modules[index] : null;
    }

    // Fallback to first module if not found
    if (!module && modules.length > 0) {
      module = modules[0];
      index = 0;
    }

    setCurrentModule(module);
    setCurrentModuleIndex(index);
    setPreviousModule(index > 0 ? modules[index - 1] : null);
    setNextModule(index < modules.length - 1 ? modules[index + 1] : null);
  }, [modules, moduleId]);

  const navigateToModule = (module: Module | null) => {
    if (!module || typeof window === 'undefined') return;
    
    try {
      const params = new URLSearchParams(window.location.search);
      params.set('module', module.id);
      const newUrl = `/courses/${courseId}/learn?${params.toString()}`;
      window.history.pushState({}, '', newUrl);
    } catch (error) {
      console.error('Error navigating to module:', error);
    }
  };

  return {
    currentModule,
    previousModule,
    nextModule,
    currentModuleIndex,
    navigateToModule
  };
};