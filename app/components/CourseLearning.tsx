'use client';

import React, { useState } from 'react';
import { Course } from '@/types';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useCourseProgress } from '@/hooks/useCourseProgress';
import { useModuleNavigation } from '@/hooks/useModuleNavigation';
import { useCertificate } from '@/hooks/useCertificate';
import { CourseSidebar } from '@/components/CourseSidebar';
import { CourseTopNavigation } from '@/components/CourseTopNavigation';
import { ModuleContent } from '@/components/ModuleContent';
import { ModuleCompletionCard } from '@/components/ModuleCompletionCard';
import { CertificateModal } from '@/components/CertificateModal';
import { CertificateBanner } from '@/components/CertificateBanner';

interface CourseLearningProps {
  course: Course | null;
  moduleId: string | null;
}

export default function CourseLearning({ course, moduleId }: CourseLearningProps) {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Early return if course is not available
  if (!course) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex justify-center items-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading course content...</p>
        </div>
      </div>
    );
  }

  const modules = course.modules || [];
  
  // Custom hooks
  const { 
    completedModules, 
    currentProgress, 
    loading, 
    markModuleComplete 
  } = useCourseProgress({ 
    userId: user?.uid, 
    courseId: course.id, 
    modules,
    initialProgress: course.progress 
  });

  const {
    currentModule,
    previousModule,
    nextModule,
    currentModuleIndex,
    navigateToModule
  } = useModuleNavigation({ 
    modules, 
    moduleId, 
    courseId: course.id 
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

  // Handle module completion with auto-navigation
  const handleModuleComplete = async (module: any) => {
    await markModuleComplete(module);
    if (nextModule) {
      setTimeout(() => {
        navigateToModule(nextModule);
      }, 1000);
    }
  };

  if (!currentModule || modules.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex justify-center items-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
            No modules available
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This course doesn't have any modules yet.
          </p>
          <Link
            href={`/courses/`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Course
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <CourseSidebar
        course={course}
        modules={modules}
        currentModule={currentModule}
        completedModules={completedModules}
        currentProgress={currentProgress}
        isOpen={isSidebarOpen}
        onModuleSelect={navigateToModule}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation */}
        <CourseTopNavigation
          currentModule={currentModule}
          currentModuleIndex={currentModuleIndex}
          totalModules={modules.length}
          previousModule={previousModule}
          nextModule={nextModule}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onNavigateToPrevious={() => navigateToModule(previousModule)}
          onNavigateToNext={() => navigateToModule(nextModule)}
        />

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            {/* Module Content */}
            <ModuleContent module={currentModule} />

            {/* Module Completion */}
            <ModuleCompletionCard
              module={currentModule}
              isCompleted={completedModules.includes(currentModule.id)}
              loading={loading}
              onMarkComplete={handleModuleComplete}
            />
          </div>
        </div>
      </div>

      {/* Certificate Modal */}
      <CertificateModal
        course={course}
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