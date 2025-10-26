// app/courses/[courseId]/learn/page.tsx
'use client';

import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCourseDetails } from '@/hooks/useCourseDetails';
import { useCourseContent } from '@/hooks/useCourseContent';
import { useCourseProgress } from '@/hooks/useCourseProgress';
import { useModuleNavigation } from '@/hooks/useModuleNavigation';
import { useCertificate } from '@/hooks/useCertificate';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { generateCertificate } from '@/lib/certificateUtils';
import { toast } from 'react-hot-toast';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
  X,
  Menu,
  User,
  Calendar,
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
  [key: string]: any;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string;
  rawContent?: any;
  type: string;
  duration: number;
  order: number;
  moduleId: string;
  completed: boolean;
}

// Error Boundary Component
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex justify-center items-center">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
          <p className="text-gray-600 mb-4">
            {error?.message || 'An error occurred while loading the course content.'}
          </p>
          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => {
                setHasError(false);
                setError(null);
                window.location.reload();
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Try Again
            </button>
            <Link
              href="/courses"
              className="flex items-center text-blue-600 hover:text-blue-800 px-4 py-2 border border-blue-600 rounded hover:bg-blue-50"
            >
              <ArrowLeft size={18} className="mr-2" />
              Back to Courses
            </Link>
          </div>
        </div>
      </div>
    );
  }

  try {
    return <>{children}</>;
  } catch (err) {
    setHasError(true);
    setError(err instanceof Error ? err : new Error('Unknown error'));
    return null;
  }
}

// Loading Component
function LoadingSpinner({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex justify-center items-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </div>
  );
}

// Helper function to render lesson content safely
const renderLessonContent = (lesson: Lesson) => {
  if (!lesson) {
    return (
      <div className="text-gray-500 dark:text-gray-400 italic p-4 bg-gray-50 dark:bg-gray-800 rounded">
        No lesson data available.
      </div>
    );
  }

  if (lesson.rawContent) {
    try {
      let content = lesson.rawContent;
      
      if (typeof content === 'string') {
        try {
          content = JSON.parse(content);
        } catch {
          return (
            <div className="lesson-content prose dark:prose-invert max-w-none">
              <p>{content}</p>
            </div>
          );
        }
      }
      
      if (content.blocks && Array.isArray(content.blocks) && content.entityMap) {
        const elements: React.ReactNode[] = [];
        
        content.blocks.forEach((block: any, blockIndex: number) => {
          if (block.type === 'atomic' && block.entityRanges?.length > 0) {
            const entityKey = block.entityRanges[0].key.toString();
            const entity = content.entityMap[entityKey];
            
            if (entity?.type === 'VIDEO') {
              elements.push(
                <div key={blockIndex} className="my-6">
                  <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                    <video 
                      src={entity.data.src || entity.data.url}
                      controls
                      className="w-full h-full"
                      poster={entity.data.poster || entity.data.thumbnail}
                    >
                      <source src={entity.data.src || entity.data.url} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </div>
              );
            } else if (entity?.type === 'IMAGE') {
              elements.push(
                <div key={blockIndex} className="my-4">
                  <img 
                    src={entity.data.src || entity.data.url} 
                    alt={entity.data.alt || 'Image'} 
                    className="max-w-full h-auto rounded-lg"
                  />
                </div>
              );
            }
          } else if (block.text) {
            elements.push(
              <p key={blockIndex} className="mb-4">
                {block.text}
              </p>
            );
          }
        });
        
        return (
          <div className="lesson-content prose dark:prose-invert max-w-none">
            {elements}
          </div>
        );
      }
      
      if (content.blocks && Array.isArray(content.blocks)) {
        const textContent = content.blocks
          .map((block: { text?: string }) => block.text || '')
          .join('<br>');
        return (
          <div 
            className="lesson-content prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: textContent }}
          />
        );
      }
      
    } catch (error) {
      console.warn('Error rendering raw content:', error);
    }
  }

  if (lesson.content && typeof lesson.content === 'string') {
    return (
      <div 
        className="lesson-content prose dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: lesson.content }}
      />
    );
  }
  
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
            <h4 className="font-bold">Congratulations!</h4>
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

// Main Course Learn Component
function CourseLearnPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const courseId = (params?.courseId as string) || '';
  const moduleId = searchParams?.get('module') || null;
  const lessonId = searchParams?.get('lesson') || null;
  
  const { course, isEnrolled, loading: courseLoading, error } = useCourseDetails(courseId, user?.uid || null);
  
  const { 
    modules, 
    currentLesson, 
    progress, 
    loading: contentLoading, 
    markLessonComplete,
    error: contentError 
  } = useCourseContent(
    courseId, 
    user?.uid ?? null,
    moduleId,
    lessonId
  );
  
  const { 
    completedModules = [], 
    currentProgress = 0, 
    loading: progressLoading, 
    markModuleComplete 
  } = useCourseProgress({ 
    userId: user?.uid, 
    courseId: courseId, 
    modules: (modules || []).map((m: any) => ({
      ...m,
      content: m.content ?? '',
      type: m.type ?? 'text',
    })),
    initialProgress: typeof progress === 'number' ? progress : progress?.percentage ?? 0
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
    certificateGenerated = false,
    setCertificateGenerated = () => {},
    showCertificateModal = false,
    setShowCertificateModal = () => {},
    downloadCertificate = () => {},
    shareCertificate = () => {}
  } = useCertificate?.({ 
    userId: user?.uid, 
    course, 
    currentProgress 
  }) || {};
  
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (modules && modules.length > 0) {
        if (!moduleId && !lessonId && router) {
          const firstModule = modules[0];
          const firstLesson = firstModule?.lessons?.[0];
          if (firstModule && firstLesson) {
            router.replace(`/learn/${courseId}?module=${firstModule.id}&lesson=${firstLesson.id}`);
            return;
          }
        }

        const expanded = new Set<string>();
        if (moduleId) {
          expanded.add(moduleId);
        } else if (modules[0]?.id) {
          expanded.add(modules[0].id);
        }
        setExpandedModules(expanded);

        const module = modules.find(m => m.id === moduleId) || modules[0];
        const lesson = module?.lessons?.find(l => l.id === lessonId) || module?.lessons?.[0];
        
        setSelectedModule(module || null);
        setSelectedLesson(lesson || null);
      }
    } catch (err) {
      console.error('Error initializing course content:', err);
      setInitializationError('Failed to initialize course content');
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
    try {
      setSelectedModule(module);
      setSelectedLesson(lesson);
      if (router) {
        router.push(`/learn/${courseId}?module=${module.id}&lesson=${lesson.id}`);
      }
    } catch (err) {
      console.error('Error selecting lesson:', err);
    }
  };

  const getNextLesson = () => {
    if (!selectedModule || !selectedLesson || !modules) return null;
    
    try {
      const currentModuleIndex = modules.findIndex(m => m.id === selectedModule.id);
      const currentLessonIndex = selectedModule.lessons.findIndex(l => l.id === selectedLesson.id);
      
      if (currentLessonIndex < selectedModule.lessons.length - 1) {
        return {
          module: selectedModule,
          lesson: selectedModule.lessons[currentLessonIndex + 1]
        };
      }
      
      if (currentModuleIndex < modules.length - 1) {
        const nextModule = modules[currentModuleIndex + 1];
        if (nextModule.lessons && nextModule.lessons.length > 0) {
          return {
            module: nextModule,
            lesson: nextModule.lessons[0]
          };
        }
      }
    } catch (err) {
      console.error('Error getting next lesson:', err);
    }
    
    return null;
  };

  const getPrevLesson = () => {
    if (!selectedModule || !selectedLesson || !modules) return null;
    
    try {
      const currentModuleIndex = modules.findIndex(m => m.id === selectedModule.id);
      const currentLessonIndex = selectedModule.lessons.findIndex(l => l.id === selectedLesson.id);
      
      if (currentLessonIndex > 0) {
        return {
          module: selectedModule,
          lesson: selectedModule.lessons[currentLessonIndex - 1]
        };
      }
      
      if (currentModuleIndex > 0) {
        const prevModule = modules[currentModuleIndex - 1];
        if (prevModule.lessons && prevModule.lessons.length > 0) {
          return {
            module: prevModule,
            lesson: prevModule.lessons[prevModule.lessons.length - 1]
          };
        }
      }
    } catch (err) {
      console.error('Error getting previous lesson:', err);
    }
    
    return null;
  };

  const handleMarkComplete = async () => {
    if (selectedLesson && user?.uid && markLessonComplete) {
      try {
        await markLessonComplete(selectedLesson.id);
        
        const allLessonsCompleted = selectedModule?.lessons.every(lesson => 
          lesson.id === selectedLesson.id || lesson.completed
        );
        
        if (allLessonsCompleted && selectedModule) {
          await handleModuleComplete(selectedModule);
        }
        
        const nextLesson = getNextLesson();
        if (nextLesson) {
          setTimeout(() => {
            selectLesson(nextLesson.module, nextLesson.lesson);
          }, 1000);
        }
      } catch (err) {
        console.error('Error marking lesson complete:', err);
      }
    }
  };

  const handleModuleComplete = async (module: Module) => {
    if (!markModuleComplete) return;
    
    try {
      const moduleWithType = {
        ...module,
        type: module.type ?? 'text',
        content: module.content ?? '',
        lessons: (module.lessons || []).map((lesson: any) => ({
          ...lesson,
          type: (['video', 'text', 'quiz'].includes(lesson.type) ? lesson.type : 'text'),
        })),
      };
      
      await markModuleComplete(moduleWithType);
      
      const totalModules = modules?.length || 0;
      const completedCount = completedModules.length + 1;
      
      // Check if all modules are completed (100% progress)
      if (completedCount === totalModules) {
        console.log('All modules completed! Generating certificate...');
        
        // Mark course as completed first
        if (user && courseId) {
          try {
            const progressRef = doc(db, 'users', user.uid, 'courseProgress', courseId);
            await updateDoc(progressRef, {
              completed: true,
              completedAt: serverTimestamp(),
              progress: 100,
            });
            console.log('Course progress marked as completed');
          } catch (progressError) {
            console.error('Error updating course progress:', progressError);
          }
        }
        
        // Generate certificate
        if (user && course && courseId) {
          const certificateId = await generateCertificate({
            userId: user.uid,
            courseId: courseId,
            courseName: course.title || 'Untitled Course',
            studentName: user.displayName || user.email?.split('@')[0] || 'Student',
            completionDate: new Date(),
          });

          if (certificateId) {
            console.log('Certificate generated successfully:', certificateId);
            toast.success('🎉 Congratulations! Your certificate has been generated!');
            toast.success('📜 Check your Certificates page to download it!', { duration: 5000 });
            
            setCertificateGenerated(true);
            setTimeout(() => setShowCertificateModal(true), 2000);
          } else {
            console.error('Certificate generation returned null');
            toast.error('Failed to generate certificate. Please try again or contact support.');
          }
        }
      }
      
      if (nextModule && navigateToModule) {
        setTimeout(() => {
          navigateToModule(nextModule);
        }, 1000);
      }
    } catch (err) {
      console.error('Error completing module:', err);
      toast.error('An error occurred while completing the module.');
    }
  };

  const formatDuration = (minutes: number) => {
    if (!minutes || minutes < 0) return '0m';
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
    return <LoadingSpinner message="Loading course content..." />;
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
            href="/login"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (error || contentError || initializationError || !course) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <strong>Error:</strong> {error || contentError || initializationError || 'Course not found'}
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
            href={`/${courseId}`}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Course Details
          </Link>
        </div>
      </div>
    );
  }

  if (!modules || modules.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex justify-center items-center">
        <div className="text-center">
          <BookOpen size={48} className="text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            No Course Content
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This course doesn't have any content yet. Please check back later.
          </p>
          <Link
            href={`/courses`}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Course
          </Link>
        </div>
      </div>
    );
  }

  const nextLesson = getNextLesson();
  const prevLesson = getPrevLesson();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <Link
              href={`/${courseId}`}
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
            {course?.title || 'Course'}
          </h1>
          
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

        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center mb-4">
            <BookOpen size={20} className="text-blue-600 mr-2" />
            <h3 className="font-semibold text-gray-800 dark:text-white">Course Content</h3>
          </div>

          <div className="space-y-2">
            {modules.map((module, index) => (
              <div key={module.id || index} className="border border-gray-200 dark:border-gray-700 rounded-lg">
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
                        {module.title || `Module ${index + 1}`}
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
                    {module.lessons && module.lessons.length > 0 ? (
                      module.lessons.map((lesson, lessonIndex) => (
                        <button
                          key={lesson.id || lessonIndex}
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
                                {lesson.title || `Lesson ${lessonIndex + 1}`}
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
                      ))
                    ) : (
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
                    {selectedModule.title || 'Module'}
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

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {selectedLesson ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {getLessonIcon(selectedLesson)}
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                          {selectedLesson.title || 'Lesson'}
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
                  
                  {renderLessonContent(selectedLesson)}
                </div>

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

                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                  <div>
                    {prevLesson && (
                      <button
                        onClick={() => selectLesson(prevLesson.module, prevLesson.lesson)}
                        className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 transition-colors"
                      >
                        <ArrowLeft size={16} className="mr-2" />
                        Previous: {prevLesson.lesson.title || 'Previous lesson'}
                      </button>
                    )}
                  </div>
                  
                  <div>
                    {nextLesson && (
                      <button
                        onClick={() => selectLesson(nextLesson.module, nextLesson.lesson)}
                        className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 transition-colors"
                      >
                        Next: {nextLesson.lesson.title || 'Next lesson'}
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

      {showCertificateModal && (
        <CertificateModal
          course={course}
          user={user}
          isOpen={showCertificateModal}
          onClose={() => setShowCertificateModal(false)}
          onDownload={downloadCertificate}
          onShare={shareCertificate}
        />
      )}

      {certificateGenerated && currentProgress === 100 && (
        <CertificateBanner
          isVisible={true}
          onViewCertificate={() => setShowCertificateModal(true)}
          onClose={() => setCertificateGenerated(false)}
        />
      )}
    </div>
  );
}

export default function CourseLearnPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner message="Loading course..." />}>
        <CourseLearnPageContent />
      </Suspense>
    </ErrorBoundary>
  );
}