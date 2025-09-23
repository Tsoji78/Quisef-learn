'use client';

import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCourseDetails } from '@/hooks/useCourseDetails';
import { useCourseContent } from '@/hooks/useCourseContent';
import { useCourseProgress } from '@/hooks/useCourseProgress';
import { useModuleNavigation } from '@/hooks/useModuleNavigation';
import { useCertificate } from '@/hooks/useCertificate';
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
  ChevronRight,
  Award,
  Download,
  Share2,
  Trophy,
  Star,
  X,
  Menu,
  User,
  Calendar,
  BarChart3
} from 'lucide-react';

interface Module {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
  content?: any;
  rawContent?: any;
  estimatedTime?: number;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string; // HTML content for display
  rawContent?: any; // Original Draft.js content
  type: 'video' | 'text' | 'quiz';
  duration: number;
  order: number;
  moduleId: string;
  completed: boolean;
}

// Helper function to render lesson content safely
const renderLessonContent = (lesson: Lesson) => {
  // If we have HTML content, render it safely
  if (lesson.content && typeof lesson.content === 'string') {
    return (
      <div 
        className="lesson-content prose dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: lesson.content }}
        style={{
          lineHeight: '1.6',
          fontSize: '16px',
        }}
      />
    );
  }
  
  // Try to extract content from rawContent if available
  if (lesson.rawContent) {
    try {
      let textContent = '';
      
      if (typeof lesson.rawContent === 'string') {
        textContent = lesson.rawContent;
      } else if (lesson.rawContent.ops && Array.isArray(lesson.rawContent.ops)) {
        // Draft.js Delta format
        textContent = lesson.rawContent.ops
          .map((op: any) => op.insert || '')
          .join('')
          .replace(/\n/g, '<br>');
      } else if (lesson.rawContent.blocks && Array.isArray(lesson.rawContent.blocks)) {
        // Draft.js raw content state
        textContent = lesson.rawContent.blocks
          .map((block: any) => block.text || '')
          .join('<br>');
      }
      
      if (textContent) {
        return (
          <div 
            className="lesson-content prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: textContent }}
            style={{
              lineHeight: '1.6',
              fontSize: '16px',
            }}
          />
        );
      }
    } catch (error) {
      console.warn('Error rendering raw content:', error);
    }
  }
  
  // Fallback for empty or invalid content
  return (
    <div className="text-gray-500 dark:text-gray-400 italic p-4 bg-gray-50 dark:bg-gray-800 rounded">
      No content available for this lesson.
    </div>
  );
};

// Certificate Modal Component
const CertificateModal = ({ 
  course, 
  user, 
  isOpen, 
  onClose, 
  onDownload, 
  onShare 
}: {
  course: any;
  user: any;
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
  onShare: () => void;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
              <Award className="mr-2 text-yellow-500" size={24} />
              Certificate of Completion
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X size={24} />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {/* Certificate Preview */}
          <div className="border-4 border-yellow-400 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 p-8 text-center rounded-lg mb-6">
            <div className="mb-4">
              <Trophy className="mx-auto text-yellow-600 mb-4" size={48} />
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                Certificate of Completion
              </h2>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-4">This certifies that</p>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              {user?.displayName || user?.email || 'Student'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-2">has successfully completed</p>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">
              {course?.title}
            </h4>
            
            <div className="flex justify-center items-center space-x-8 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center">
                <Calendar size={16} className="mr-1" />
                {new Date().toLocaleDateString()}
              </div>
              <div className="flex items-center">
                <User size={16} className="mr-1" />
                Course Instructor
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={onDownload}
              className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <Download size={16} className="mr-2" />
              Download Certificate
            </button>
            <button
              onClick={onShare}
              className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
            >
              <Share2 size={16} className="mr-2" />
              Share Achievement
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Certificate Banner Component
const CertificateBanner = ({ 
  isVisible, 
  onViewCertificate, 
  onClose 
}: {
  isVisible: boolean;
  onViewCertificate: () => void;
  onClose: () => void;
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white p-4 rounded-lg shadow-lg z-40 max-w-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <Trophy size={24} className="mr-2 flex-shrink-0" />
          <div>
            <h4 className="font-bold">Congratulations! 🎉</h4>
            <p className="text-sm opacity-90">You've earned a certificate!</p>
          </div>
        </div>
        <button onClick={onClose} className="text-white/80 hover:text-white">
          <X size={20} />
        </button>
      </div>
      <button
        onClick={onViewCertificate}
        className="mt-3 w-full bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded text-sm transition-colors"
      >
        View Certificate
      </button>
    </div>
  );
};

// Module Completion Card Component
const ModuleCompletionCard = ({ 
  module, 
  isCompleted, 
  loading, 
  onMarkComplete 
}: {
  module: any;
  isCompleted: boolean;
  loading: boolean;
  onMarkComplete: (module: any) => void;
}) => {
  if (isCompleted) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <CheckCircle size={24} className="text-green-600 mr-3" />
          <div>
            <h4 className="font-semibold text-green-800 dark:text-green-200">
              Module Completed!
            </h4>
            <p className="text-sm text-green-600 dark:text-green-300">
              Great job! You've successfully completed this module.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">
            Ready to complete this module?
          </h4>
          <p className="text-sm text-blue-600 dark:text-blue-300">
            Mark as complete to unlock the next module and track your progress.
          </p>
        </div>
        <button
          onClick={() => onMarkComplete(module)}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
          ) : (
            <CheckCircle size={16} className="mr-2" />
          )}
          {loading ? 'Completing...' : 'Mark Complete'}
        </button>
      </div>
    </div>
  );
};

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
  
  // Enhanced hooks for course completion and certification
  const { 
    completedModules, 
    currentProgress, 
    loading: progressLoading, 
    markModuleComplete 
  } = useCourseProgress({ 
    userId: user?.uid, 
    courseId: courseId, 
    modules: modules || [],
    initialProgress: typeof progress === 'number' ? progress : progress?.percentage ?? undefined
  });

  const {
    currentModule,
    previousModule,
    nextModule,
    currentModuleIndex,
    navigateToModule
  } = useModuleNavigation({ 
    modules: modules || [], 
    moduleId, 
    courseId: courseId 
  });

  const {
    certificateGenerated,
    setCertificateGenerated,
    showCertificateModal,
    setShowCertificateModal,
    downloadCertificate,
    shareCertificate
  } = useCertificate({ 
    userId: user?.uid, 
    course, 
    currentProgress 
  });
  
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Initialize expanded modules and selected content
  useEffect(() => {
    if (modules.length > 0) {
      // If no module/lesson specified, select first lesson of first module
      if (!moduleId && !lessonId) {
        const firstModule = modules[0];
        const firstLesson = firstModule?.lessons?.[0];
        if (firstModule && firstLesson) {
          router.replace(`/courses/${courseId}/learn?module=${firstModule.id}&lesson=${firstLesson.id}`);
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
    router.push(`/courses/${courseId}/learn?module=${module.id}&lesson=${lesson.id}`);
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
      
      // Check if all lessons in current module are completed
      const allLessonsCompleted = selectedModule?.lessons.every(lesson => 
        lesson.id === selectedLesson.id || lesson.completed
      );
      
      // If module is completed, mark it as complete
      if (allLessonsCompleted && selectedModule) {
        await handleModuleComplete(selectedModule);
      }
      
      // Auto-navigate to next lesson after marking complete
      const nextLesson = getNextLesson();
      if (nextLesson) {
        setTimeout(() => {
          selectLesson(nextLesson.module, nextLesson.lesson);
        }, 1000);
      }
    }
  };

  // Handle module completion with auto-navigation and certificate check
  const handleModuleComplete = async (module: Module) => {
    // Ensure 'type' property exists for compatibility with imported Module type
    const moduleWithType = {
      ...module,
      type: (module as any).type || 'text', // fallback to 'text' if not present
      content: (module as any).content || '', // fallback to empty string if not present
    };
    await markModuleComplete(moduleWithType);
    
    // Check if all modules are completed for certificate generation
    const totalModules = modules.length;
    const completedCount = completedModules.length + 1; // +1 for the module being completed now
    
    if (completedCount === totalModules && currentProgress >= 95) {
      // Generate certificate
      setCertificateGenerated(true);
      setTimeout(() => setShowCertificateModal(true), 2000);
    }
    
    if (nextModule) {
      setTimeout(() => {
        navigateToModule(nextModule);
      }, 1000);
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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
      {/* Enhanced Sidebar with Progress */}
      <div className={`${isSidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <Link
              href={`/courses/${courseId}`}
              className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 transition-colors text-sm"
            >
              <ArrowLeft size={16} className="mr-1" />
              Course Details
            </Link>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
          
          <h1 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
            {course.title}
          </h1>
          
          {/* Enhanced Progress Display */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Overall Progress</span>
              <span>{Math.round(currentProgress || 0)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${currentProgress || 0}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{completedModules.length} of {modules.length} modules completed</span>
              {currentProgress === 100 && (
                <div className="flex items-center text-green-600">
                  <Trophy size={14} className="mr-1" />
                  <span>Eligible for certificate!</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Course Content Navigation */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center mb-4">
            <BookOpen size={20} className="text-blue-600 mr-2" />
            <h3 className="font-semibold text-gray-800 dark:text-white">Course Content</h3>
          </div>

          <div className="space-y-2">
            {modules.map((module) => (
              <div key={module.id} className="border border-gray-200 dark:border-gray-700 rounded-lg">
                <button
                  onClick={() => toggleModule(module.id)}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center flex-1">
                    {completedModules.includes(module.id) ? (
                      <CheckCircle size={16} className="text-green-500 mr-2 flex-shrink-0" />
                    ) : (
                      <Circle size={16} className="text-gray-400 mr-2 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800 dark:text-white text-sm">
                        {module.title}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {module.lessons?.length || 0} lessons
                      </p>
                    </div>
                  </div>
                  {expandedModules.has(module.id) ? (
                    <ChevronDown size={16} className="text-gray-400" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-400" />
                  )}
                </button>
                
                {expandedModules.has(module.id) && (
                  <div className="border-t border-gray-200 dark:border-gray-700">
                    {module.lessons?.map((lesson) => (
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
                    )) || (
                      <div className="p-3 text-center text-sm text-gray-500 dark:text-gray-400">
                        No lessons available
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation Bar */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className={`${isSidebarOpen ? 'hidden' : 'block'} text-gray-600 dark:text-gray-400 hover:text-gray-800`}
              >
                <Menu size={24} />
              </button>
              
              {selectedModule && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                    {selectedModule.title}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Module {currentModuleIndex + 1} of {modules.length}
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {prevLesson && (
                <button
                  onClick={() => selectLesson(prevLesson.module, prevLesson.lesson)}
                  className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 transition-colors px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <ArrowLeft size={16} className="mr-1" />
                  <span className="hidden sm:inline">Previous</span>
                </button>
              )}
              
              {nextLesson && (
                <button
                  onClick={() => selectLesson(nextLesson.module, nextLesson.lesson)}
                  className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 transition-colors px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ArrowRight size={16} className="ml-1" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
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
                  
                  {/* Updated content rendering using the helper function */}
                  {renderLessonContent(selectedLesson)}
                  
                  {/* Add debugging information in development */}
                  {process.env.NODE_ENV === 'development' && (
                    <details className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded">
                      <summary className="cursor-pointer font-medium">Debug Info</summary>
                      <pre className="mt-2 text-xs overflow-auto max-h-40">
                        <strong>Lesson Data:</strong>
                        {JSON.stringify(selectedLesson, null, 2)}
                      </pre>
                      {selectedLesson?.rawContent && (
                        <pre className="mt-2 text-xs overflow-auto max-h-40">
                          <strong>Raw Content:</strong>
                          {JSON.stringify(selectedLesson.rawContent, null, 2)}
                        </pre>
                      )}
                      <div className="mt-2 text-xs">
                        <strong>Modules Count:</strong> {modules.length}<br />
                        <strong>Current Module Lessons:</strong> {selectedModule?.lessons?.length || 0}
                      </div>
                    </details>
                  )}
                </div>

                {/* Module Completion Card */}
                {selectedModule && (
                  <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                    <ModuleCompletionCard
                      module={selectedModule}
                      isCompleted={completedModules.includes(selectedModule.id)}
                      loading={progressLoading}
                      onMarkComplete={handleModuleComplete}
                    />
                  </div>
                )}

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
                {process.env.NODE_ENV === 'development' && (
                  <div className="mt-4 text-sm text-gray-500">
                    <p>Debug: {modules.length} modules loaded</p>
                    {modules.length === 0 && (
                      <p className="text-red-500">No modules found - check your course data</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Certificate Modal */}
      <CertificateModal
        course={course}
        user={user}
        isOpen={showCertificateModal}
        onClose={() => setShowCertificateModal(false)}
        onDownload={downloadCertificate}
        onShare={shareCertificate}
      />

      {/* Certificate Banner */}
      <CertificateBanner
        isVisible={certificateGenerated && currentProgress === 100}
        onViewCertificate={() => setShowCertificateModal(true)}
        onClose={() => setCertificateGenerated(false)}
      />
    </div>
  );
}