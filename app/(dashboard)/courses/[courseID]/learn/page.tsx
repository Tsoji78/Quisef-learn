'use client';

import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCourseDetails } from '@/hooks/useCourseDetails';
import { useCourseContent } from '@/hooks/useCourseContent';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  Circle, 
  PlayCircle, 
  FileText, 
  Clock,
  BookOpen,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

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

export default function CourseLearnPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const courseId = params?.courseId as string;
  const moduleId = searchParams?.get('module');
  const lessonId = searchParams?.get('lesson');
  
  const { course, isEnrolled, loading: courseLoading, error } = useCourseDetails(courseId, user?.uid || null);
  const { modules, currentLesson, progress, loading: contentLoading, markLessonComplete } = useCourseContent(
    courseId, 
    user?.uid || null,
    moduleId,
    lessonId
  );
  
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  // Initialize expanded modules and selected content
  useEffect(() => {
    if (modules.length > 0) {
      // If no module/lesson specified, select first lesson of first module
      if (!moduleId && !lessonId) {
        const firstModule = modules[0];
        const firstLesson = firstModule?.lessons?.[0];
        if (firstModule && firstLesson) {
          router.replace(`/courses/${courseId}/learn?`);
          return;
        }
      }

      // Set expanded modules
      const expanded = new Set<string>();
      if (moduleId) {
        expanded.add(moduleId);
      } else {
        // Expand first module by default
        expanded.add(modules[0]?.id);
      }
      setExpandedModules(expanded);

      // Set selected module and lesson
      const module = modules.find(m => m.id === moduleId) || modules[0];
      const lesson = module?.lessons?.find(l => l.id === lessonId) || module?.lessons?.[0];
      
      setSelectedModule(module || null);
      setSelectedLesson(lesson || null);
    }
  }, [modules, moduleId, lessonId, courseId, router]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const selectLesson = (module: Module, lesson: Lesson) => {
    setSelectedModule(module);
    setSelectedLesson(lesson);
    router.push(`/courses/${courseId}/learn?`);
  };

  const getNextLesson = () => {
    if (!selectedModule || !selectedLesson) return null;
    
    const currentModuleIndex = modules.findIndex(m => m.id === selectedModule.id);
    const currentLessonIndex = selectedModule.lessons.findIndex(l => l.id === selectedLesson.id);
    
    // Next lesson in current module
    if (currentLessonIndex < selectedModule.lessons.length - 1) {
      return {
        module: selectedModule,
        lesson: selectedModule.lessons[currentLessonIndex + 1]
      };
    }
    
    // First lesson of next module
    if (currentModuleIndex < modules.length - 1) {
      const nextModule = modules[currentModuleIndex + 1];
      return {
        module: nextModule,
        lesson: nextModule.lessons[0]
      };
    }
    
    return null;
  };

  const getPrevLesson = () => {
    if (!selectedModule || !selectedLesson) return null;
    
    const currentModuleIndex = modules.findIndex(m => m.id === selectedModule.id);
    const currentLessonIndex = selectedModule.lessons.findIndex(l => l.id === selectedLesson.id);
    
    // Previous lesson in current module
    if (currentLessonIndex > 0) {
      return {
        module: selectedModule,
        lesson: selectedModule.lessons[currentLessonIndex - 1]
      };
    }
    
    // Last lesson of previous module
    if (currentModuleIndex > 0) {
      const prevModule = modules[currentModuleIndex - 1];
      return {
        module: prevModule,
        lesson: prevModule.lessons[prevModule.lessons.length - 1]
      };
    }
    
    return null;
  };

  const handleMarkComplete = async () => {
    if (selectedLesson && user?.uid) {
      await markLessonComplete(selectedLesson.id);
      
      // Auto-navigate to next lesson after marking complete
      const nextLesson = getNextLesson();
      if (nextLesson) {
        setTimeout(() => {
          selectLesson(nextLesson.module, nextLesson.lesson);
        }, 1000);
      }
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getLessonIcon = (lesson: Lesson) => {
    switch (lesson.type) {
      case 'video':
        return <PlayCircle size={16} className="text-red-500" />;
      case 'quiz':
        return <Circle size={16} className="text-green-500" />;
      default:
        return <FileText size={16} className="text-blue-500" />;
    }
  };

  if (authLoading || courseLoading || contentLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex justify-center items-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading course content...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex justify-center items-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Authentication Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please sign in to access course content.
          </p>
          <Link
            href="/auth/login"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <strong>Error:</strong> {error || 'Course not found'}
              </div>
            </div>
          </div>
          <Link
            href="/courses"
            className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800"
          >
            <ArrowLeft size={18} className="mr-2" />
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  if (!isEnrolled) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex justify-center items-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Enrollment Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You need to enroll in this course to access its content.
          </p>
          <Link
            href={`/courses/${courseId}`}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Course Details
          </Link>
        </div>
      </div>
    );
  }

  const nextLesson = getNextLesson();
  const prevLesson = getPrevLesson();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href={`/courses/${courseId}`}
                className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 transition-colors"
              >
                <ArrowLeft size={18} className="mr-2" />
                Course Details
              </Link>
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {course.title}
                </h1>
                {progress && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Progress: {Math.round(progress.completedLessons / progress.totalLessons * 100)}%
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Course Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sticky top-6">
              <div className="flex items-center mb-4">
                <BookOpen size={20} className="text-blue-600 mr-2" />
                <h3 className="font-semibold text-gray-800 dark:text-white">Course Content</h3>
              </div>
              
              {progress && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <span>Progress</span>
                    <span>{Math.round(progress.completedLessons / progress.totalLessons * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(progress.completedLessons / progress.totalLessons) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {progress.completedLessons} of {progress.totalLessons} lessons completed
                  </p>
                </div>
              )}

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {modules.map((module) => (
                  <div key={module.id} className="border border-gray-200 dark:border-gray-700 rounded-lg">
                    <button
                      onClick={() => toggleModule(module.id)}
                      className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800 dark:text-white text-sm">
                          {module.title}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {module.lessons.length} lessons
                        </p>
                      </div>
                      {expandedModules.has(module.id) ? (
                        <ChevronDown size={16} className="text-gray-400" />
                      ) : (
                        <ChevronRight size={16} className="text-gray-400" />
                      )}
                    </button>
                    
                    {expandedModules.has(module.id) && (
                      <div className="border-t border-gray-200 dark:border-gray-700">
                        {module.lessons.map((lesson) => (
                          <button
                            key={lesson.id}
                            onClick={() => selectLesson(module, lesson)}
                            className={`w-full flex items-center p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                              selectedLesson?.id === lesson.id 
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-600' 
                                : ''
                            }`}
                          >
                            <div className="flex items-center space-x-3 flex-1">
                              {lesson.completed ? (
                                <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                              ) : (
                                <div className="flex-shrink-0">
                                  {getLessonIcon(lesson)}
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                                  {lesson.title}
                                </p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Clock size={12} className="text-gray-400" />
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatDuration(lesson.duration)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {selectedLesson ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                {/* Lesson Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {getLessonIcon(selectedLesson)}
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                          {selectedLesson.title}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                          {selectedModule?.title} • {formatDuration(selectedLesson.duration)}
                        </p>
                      </div>
                    </div>
                    
                    {!selectedLesson.completed && (
                      <button
                        onClick={handleMarkComplete}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                      >
                        <CheckCircle size={16} />
                        <span>Mark Complete</span>
                      </button>
                    )}
                  </div>
                  
                  {selectedLesson.description && (
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedLesson.description}
                    </p>
                  )}
                </div>

                {/* Lesson Content */}
                <div className="p-6">
                  <div className="prose dark:prose-invert max-w-none">
                    {selectedLesson.type === 'video' ? (
                      <div className="mb-6">
                        <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <PlayCircle size={48} className="text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-500 dark:text-gray-400">Video content would be displayed here</p>
                          </div>
                        </div>
                      </div>
                    ) : null}
                    
                    <div 
                      className="lesson-content"
                      dangerouslySetInnerHTML={{ __html: selectedLesson.content }}
                    />
                  </div>
                </div>

                {/* Navigation */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                  <div>
                    {prevLesson && (
                      <button
                        onClick={() => selectLesson(prevLesson.module, prevLesson.lesson)}
                        className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 transition-colors"
                      >
                        <ArrowLeft size={16} className="mr-2" />
                        Previous: {prevLesson.lesson.title}
                      </button>
                    )}
                  </div>
                  
                  <div>
                    {nextLesson && (
                      <button
                        onClick={() => selectLesson(nextLesson.module, nextLesson.lesson)}
                        className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 transition-colors"
                      >
                        Next: {nextLesson.lesson.title}
                        <ArrowRight size={16} className="ml-2" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
                <BookOpen size={48} className="text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                  Select a Lesson
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Choose a lesson from the sidebar to start learning.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}