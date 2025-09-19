'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, setDoc, updateDoc, addDoc, collection, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ArrowLeft, ChevronDown, ChevronUp, CheckCircle, Award, Download, Sparkles } from 'lucide-react';
import Link from 'next/link';
import parse from 'html-react-parser';
import { toast } from 'react-hot-toast';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

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
  completed?: boolean;
  completionDate?: Date;
  certificateGenerated?: boolean;
  certificateId?: string;
}

interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  courseName: string;
  studentName: string;
  completionDate: Date;
  issuedDate: Date;
}

export default function CourseDetailPage() {
  const { isDark } = useTheme();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [generatingCertificate, setGeneratingCertificate] = useState(false);
  const contentRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to get friendly error messages
  const getFriendlyErrorMessage = (error: any): string => {
    switch (error.code) {
      case 'permission-denied':
        return 'You do not have permission to access this course. Please enroll or contact support.';
      case 'not-found':
        return 'Course or progress data not found.';
      case 'unavailable':
        return 'Service temporarily unavailable. Please try again later.';
      default:
        return error.message || 'An unexpected error occurred.';
    }
  };

  // Generate certificate function
  const generateCertificate = useCallback(async () => {
    if (!user || !course || userProgress.certificateGenerated || generatingCertificate) return;

    setGeneratingCertificate(true);
    try {
      const certificateData = {
        userId: user.uid,
        courseId: course.id,
        courseName: course.title,
        studentName: user.displayName || user.email?.split('@')[0] || 'Student',
        completionDate: new Date(),
        issuedDate: new Date(),
      };

      // Create certificate document
      const certificateRef = collection(db, 'certificates');
      const newCertificateDoc = await addDoc(certificateRef, certificateData);

      // Update progress with certificate info
      const progressRef = doc(db, 'users', user.uid, 'courseProgress', courseId);
      await updateDoc(progressRef, {
        certificateGenerated: true,
        certificateId: newCertificateDoc.id,
      });

      const newCertificate: Certificate = {
        ...certificateData,
        id: newCertificateDoc.id,
      };

      setCertificate(newCertificate);
      setUserProgress((prev) => ({
        ...prev,
        certificateGenerated: true,
        certificateId: newCertificateDoc.id,
      }));

      toast.success('Certificate generated successfully!');
    } catch (error) {
      console.error('Error generating certificate:', error);
      toast.error('Failed to generate certificate');
    } finally {
      setGeneratingCertificate(false);
    }
  }, [user, course, courseId, userProgress.certificateGenerated, generatingCertificate]);

  // Fetch course and user progress
  useEffect(() => {
    if (!courseId || authLoading) return;

    const fetchData = async () => {
      if (!user) {
        router.push(`/login?redirect=/courses/${courseId}/learn`);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch course data
        const docRef = doc(db, 'courses', courseId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          throw new Error('Course not found');
        }

        const data = docSnap.data();
        const courseData: Course = {
          id: docSnap.id,
          title: data.title || 'Untitled Course',
          instructor: data.instructor || 'Unknown Instructor',
          description: data.description || 'No description available.',
          level: ['Beginner', 'Intermediate', 'Advanced'].includes(data.level) ? data.level : 'Beginner',
          duration: data.duration || 'Unknown',
          progress: data.progress || 0,
          thumbnail: data.thumbnail || '/api/placeholder/400/250?text=Course+Image',
          category: data.category || 'Uncategorized',
          modules: Array.isArray(data.modules)
            ? data.modules.map((module: any, index: number) => ({
                id: module.id || `module-${index}`,
                title: module.title || `Module ${index + 1}`,
                content: module.content || '',
                duration: module.duration,
              }))
            : [],
        };
        setCourse(courseData);

        // Fetch user progress
        const progressRef = doc(db, 'users', user.uid, 'courseProgress', courseId);
        const progressSnap = await getDoc(progressRef);

        if (progressSnap.exists()) {
          const progressData = progressSnap.data();
          const progress: UserProgress = {
            readModules: progressData.readModules || {},
            scrollPositions: progressData.scrollPositions || {},
            lastReadDate: progressData.lastReadDate?.toDate() || new Date(),
            courseId: progressData.courseId || courseId,
            userId: progressData.userId || user.uid,
            progress: progressData.progress || 0,
            completed: progressData.completed || false,
            completionDate: progressData.completionDate?.toDate(),
            certificateGenerated: progressData.certificateGenerated || false,
            certificateId: progressData.certificateId,
          };
          setUserProgress(progress);

          // Load certificate if it exists
          if (progress.certificateGenerated && progressData.certificateId) {
            try {
              const certRef = doc(db, 'certificates', progressData.certificateId);
              const certSnap = await getDoc(certRef);
              if (certSnap.exists()) {
                const certData = certSnap.data();
                setCertificate({
                  id: certSnap.id,
                  userId: certData.userId,
                  courseId: certData.courseId,
                  courseName: certData.courseName,
                  studentName: certData.studentName,
                  completionDate: certData.completionDate.toDate(),
                  issuedDate: certData.issuedDate.toDate(),
                });
              }
            } catch (certError) {
              console.warn('Error loading certificate:', certError);
            }
          }
        } else {
          // Create initial progress document
          const defaultProgress: UserProgress = {
            readModules: {},
            scrollPositions: {},
            lastReadDate: new Date(),
            courseId,
            userId: user.uid,
            progress: 0,
          };
          await setDoc(progressRef, defaultProgress);
          setUserProgress(defaultProgress);
          toast.success('Course progress initialized!');
        }
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(getFriendlyErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId, user, authLoading, router]);

  // Save user progress with debouncing
  const saveUserProgress = useCallback(
    async (updatedProgress: UserProgress) => {
      if (!user || !course || savingProgress) return;

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Debounce the save operation
      saveTimeoutRef.current = setTimeout(async () => {
        setSavingProgress(true);

        try {
          // Calculate progress percentage
          const totalModules = course.modules.length;
          const completedModules = Object.values(updatedProgress.readModules).filter(Boolean).length;
          const newProgressPercentage = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

          const wasCompleted = updatedProgress.completed;
          const isNowCompleted = newProgressPercentage === 100;

          const progressToSave = {
            ...updatedProgress,
            progress: newProgressPercentage,
            completed: isNowCompleted || updatedProgress.completed || false,
            completionDate: isNowCompleted && !wasCompleted
              ? new Date()
              : updatedProgress.completionDate || null,
            lastReadDate: new Date(),
          };

          // Use transaction for atomic updates
          await runTransaction(db, async (transaction) => {
            // ALL READS FIRST
            const progressRef = doc(db, 'users', user.uid, 'courseProgress', courseId);
            const courseRef = doc(db, 'courses', courseId);

            const progressDoc = await transaction.get(progressRef);
            const courseDoc = await transaction.get(courseRef);

            if (!progressDoc.exists()) {
              throw new Error('Progress document not found');
            }
            if (!courseDoc.exists()) {
              throw new Error('Course document not found');
            }

            // Get current course progress from Firestore
            const currentCourseData = courseDoc.data();
            const currentCourseProgress = currentCourseData?.progress ?? 0;

            // ALL WRITES AFTER READS
            // Update progress document
            transaction.update(progressRef, {
              readModules: progressToSave.readModules,
              scrollPositions: progressToSave.scrollPositions,
              lastReadDate: progressToSave.lastReadDate,
              progress: progressToSave.progress,
              completed: progressToSave.completed,
              completionDate: progressToSave.completionDate,
            });

            // Update course progress if changed
            if (newProgressPercentage !== currentCourseProgress) {
              transaction.update(courseRef, { progress: newProgressPercentage });
            }
          });

          // Update local state AFTER successful transaction
          setUserProgress(progressToSave);
          setCourse((prev) => (prev ? { ...prev, progress: newProgressPercentage } : null));

          // Handle completion AFTER transaction completes
          if (isNowCompleted && !wasCompleted) {
            toast.success('🎉 Congratulations! You completed the course!');
            setShowCongratulations(true);
            // Generate certificate separately (not in transaction)
            await generateCertificate();
          }
        } catch (err: any) {
          console.error('Error saving progress:', err);
          toast.error('Failed to save progress: ' + getFriendlyErrorMessage(err));
        } finally {
          setSavingProgress(false);
        }
      }, 1000); // 1 second debounce
    },
    [user, course, courseId, savingProgress, generateCertificate]
  );

  // Handle scroll for progress tracking
  const handleScroll = useCallback(
    (moduleId: string) => {
      const element = contentRefs.current[moduleId];
      if (!element || !user) return;

      const scrollHeight = element.scrollHeight;
      const scrollTop = element.scrollTop;
      const clientHeight = element.clientHeight;
      const scrollPercentage = scrollHeight > 0 ? (scrollTop + clientHeight) / scrollHeight : 0;

      const updatedProgress = {
        ...userProgress,
        scrollPositions: {
          ...userProgress.scrollPositions,
          [moduleId]: scrollTop,
        },
        userId: user.uid,
        courseId,
      };

      // Mark module as read if scrolled to 90%
      if (scrollPercentage >= 0.9 && !userProgress.readModules[moduleId]) {
        updatedProgress.readModules = {
          ...userProgress.readModules,
          [moduleId]: true,
        };
        toast.success(`Module "${course?.modules.find((m) => m.id === moduleId)?.title}" completed!`);
      }

      setUserProgress(updatedProgress);
      saveUserProgress(updatedProgress);
    },
    [user, course, courseId, userProgress, saveUserProgress]
  );

  // Restore scroll positions when modules are expanded
  useEffect(() => {
    Object.entries(expandedModules).forEach(([moduleId, isExpanded]) => {
      if (isExpanded && contentRefs.current[moduleId] && userProgress.scrollPositions[moduleId]) {
        const element = contentRefs.current[moduleId];
        if (element) {
          element.scrollTop = userProgress.scrollPositions[moduleId];
        }
      }
    });
  }, [expandedModules, userProgress.scrollPositions]);

  // Toggle module expansion
  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  // Download certificate as PNG
  const downloadCertificate = useCallback(
    (cert: Certificate) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 1600;
      canvas.height = 900;

      if (!ctx) {
        toast.error('Unable to generate certificate: Canvas context not available.');
        return;
      }

      // Gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, isDark ? '#1f2937' : '#f8fafc');
      gradient.addColorStop(1, isDark ? '#374151' : '#e2e8f0');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Decorative border
      ctx.strokeStyle = isDark ? '#a78bfa' : '#d4af37';
      ctx.lineWidth = 12;
      ctx.strokeRect(60, 60, canvas.width - 120, canvas.height - 120);

      // Inner border
      ctx.strokeStyle = isDark ? '#60a5fa' : '#1e40af';
      ctx.lineWidth = 4;
      ctx.strokeRect(90, 90, canvas.width - 180, canvas.height - 180);

      // Corner decorations
      const cornerSize = 80;
      ctx.fillStyle = isDark ? '#a78bfa' : '#d4af37';
      [
        [90, 90],
        [canvas.width - 170, 90],
        [90, canvas.height - 98],
        [canvas.width - 170, canvas.height - 98],
      ].forEach(([x, y]) => {
        ctx.fillRect(x, y, cornerSize, 8);
        ctx.fillRect(x, y, 8, cornerSize);
      });

      ctx.textAlign = 'center';

      // Certificate content
      ctx.fillStyle = isDark ? '#93c5fd' : '#1e40af';
      ctx.font = 'bold 64px serif';
      ctx.fillText('CERTIFICATE OF COMPLETION', canvas.width / 2, 200);

      // Decorative line
      ctx.strokeStyle = isDark ? '#a78bfa' : '#d4af37';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2 - 300, 230);
      ctx.lineTo(canvas.width / 2 + 300, 230);
      ctx.stroke();

      // Certificate text
      ctx.font = '28px serif';
      ctx.fillStyle = isDark ? '#d1d5db' : '#64748b';
      ctx.fillText('This is to certify that', canvas.width / 2, 300);

      // Student name
      ctx.font = 'bold 56px serif';
      ctx.fillStyle = isDark ? '#a78bfa' : '#d4af37';
      ctx.fillText(cert.studentName.toUpperCase(), canvas.width / 2, 380);

      // Underline for student name
      ctx.strokeStyle = isDark ? '#a78bfa' : '#d4af37';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const nameWidth = ctx.measureText(cert.studentName.toUpperCase()).width;
      ctx.moveTo(canvas.width / 2 - nameWidth / 2 - 20, 400);
      ctx.lineTo(canvas.width / 2 + nameWidth / 2 + 20, 400);
      ctx.stroke();

      // Course completion text
      ctx.fillStyle = isDark ? '#d1d5db' : '#64748b';
      ctx.font = '28px serif';
      ctx.fillText('has successfully completed the course', canvas.width / 2, 460);

      // Course name
      ctx.font = 'bold 42px serif';
      ctx.fillStyle = isDark ? '#93c5fd' : '#1e40af';
      ctx.fillText(cert.courseName, canvas.width / 2, 530);

      // Completion date
      ctx.fillStyle = isDark ? '#d1d5db' : '#64748b';
      ctx.font = '24px serif';
      ctx.fillText(
        `Completed on ${cert.completionDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}`,
        canvas.width / 2,
        600
      );

      // Branding
      ctx.fillStyle = isDark ? '#93c5fd' : '#1e40af';
      ctx.font = 'bold 32px serif';
      ctx.fillText('QUISEF LEARN', canvas.width / 2, 720);

      // Issue date
      ctx.fillStyle = isDark ? '#d1d5db' : '#64748b';
      ctx.font = '20px serif';
      ctx.fillText(
        `Issued on ${cert.issuedDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}`,
        canvas.width / 2,
        760
      );

      // Download
      const link = document.createElement('a');
      link.download = `${cert.studentName.replace(/\s+/g, '_')}_${cert.courseName.replace(/\s+/g, '_')}_Certificate.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();

      toast.success('Certificate downloaded successfully!');
    },
    [isDark]
  );

  // Render module content with better error handling
  const renderModuleContent = (content: any) => {
    if (!content) {
      return <div className="text-gray-500 dark:text-gray-400 italic">No content available.</div>;
    }

    if (typeof content === 'string') {
      try {
        return <div className="prose dark:prose-invert max-w-none">{parse(content)}</div>;
      } catch {
        return <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: content }} />;
      }
    }

    // Handle rich text editor format (Draft.js style)
    if (typeof content === 'object' && content.blocks && Array.isArray(content.blocks)) {
      try {
        let htmlContent = '';
        content.blocks.forEach((block: any) => {
          if (!block || !block.text) return;

          let blockText = block.text;

          // Apply inline styles
          if (block.inlineStyleRanges?.length) {
            blockText = applyInlineStyles(blockText, block.inlineStyleRanges);
          }

          // Apply entity ranges (links, etc.)
          if (block.entityRanges?.length && content.entityMap) {
            blockText = applyEntityRanges(blockText, block.entityRanges, content.entityMap);
          }

          // Convert block types to HTML
          switch (block.type) {
            case 'header-one':
              htmlContent += `<h1>${blockText}</h1>`;
              break;
            case 'header-two':
              htmlContent += `<h2>${blockText}</h2>`;
              break;
            case 'header-three':
              htmlContent += `<h3>${blockText}</h3>`;
              break;
            case 'unordered-list-item':
              htmlContent += `<li>${blockText}</li>`;
              break;
            case 'ordered-list-item':
              htmlContent += `<li>${blockText}</li>`;
              break;
            case 'blockquote':
              htmlContent += `<blockquote>${blockText}</blockquote>`;
              break;
            case 'atomic':
              if (block.entityRanges?.length && content.entityMap) {
                const entity = content.entityMap[block.entityRanges[0].key];
                htmlContent += renderAtomicBlock(entity);
              }
              break;
            default:
              htmlContent += `<p>${blockText}</p>`;
          }
        });

        return <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: htmlContent }} />;
      } catch (error) {
        console.error('Error rendering rich content:', error);
        return <div className="text-red-500 dark:text-red-400">Error rendering content.</div>;
      }
    }

    return <div className="text-gray-500 dark:text-gray-400 italic">Unsupported content format.</div>;
  };

  // Helper functions for rich text processing
  const applyInlineStyles = (text: string, styleRanges: any[]): string => {
    let result = text;
    const sortedRanges = [...styleRanges].sort((a, b) => b.offset - a.offset);

    sortedRanges.forEach(({ offset, length, style }) => {
      const before = result.slice(0, offset);
      const styled = result.slice(offset, offset + length);
      const after = result.slice(offset + length);
      let styledText = styled;

      switch (style) {
        case 'BOLD':
          styledText = `<strong>${styled}</strong>`;
          break;
        case 'ITALIC':
          styledText = `<em>${styled}</em>`;
          break;
        case 'UNDERLINE':
          styledText = `<u>${styled}</u>`;
          break;
        case 'CODE':
          styledText = `<code>${styled}</code>`;
          break;
      }

      result = before + styledText + after;
    });

    return result;
  };

  const applyEntityRanges = (text: string, entityRanges: any[], entityMap: any): string => {
    let result = text;
    const sortedRanges = [...entityRanges].sort((a, b) => b.offset - a.offset);

    sortedRanges.forEach(({ offset, length, key }) => {
      const entity = entityMap[key];
      if (!entity) return;

      const before = result.slice(0, offset);
      const entityText = result.slice(offset, offset + length);
      const after = result.slice(offset + length);
      let replacementText = entityText;

      if (entity.type === 'LINK') {
        replacementText = `<a href="${entity.data.url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline">${entityText}</a>`;
      }

      result = before + replacementText + after;
    });

    return result;
  };

  const renderAtomicBlock = (entity: any): string => {
    const { type, data } = entity;
    switch (type) {
      case 'IMAGE':
        return `<img src="${data.src}" alt="${data.alt || ''}" style="max-width: 100%; height: auto; margin: 1rem 0;" />`;
      case 'VIDEO':
        return `<video controls style="max-width: 100%; height: auto; margin: 1rem 0;"><source src="${data.src}" type="video/mp4">Your browser does not support the video tag.</video>`;
      case 'IFRAME_VIDEO':
        return `<iframe src="${data.src}" style="width: 100%; height: 315px; margin: 1rem 0;" frameborder="0" allowfullscreen></iframe>`;
      default:
        return `<div class="bg-gray-100 dark:bg-gray-700 p-4 rounded text-center">Unsupported media type: ${type}</div>`;
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Loading state
  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex justify-center items-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading course...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {error || 'Course not found'}
            </div>
          </div>
          <Link href="/courses" className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
            <ArrowLeft size={18} className="mr-2" />
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Congratulations Modal */}
      {showCongratulations && certificate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 sm:p-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="text-center">
              <div className="mb-6">
                <div className="mx-auto w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-4">
                  <Award className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Congratulations!</h2>
                <p className="text-base text-gray-600 dark:text-gray-300 mb-6">You've successfully completed {course.title}!</p>
              </div>

              {/* Certificate Preview */}
              <div className="bg-gradient-to-br from-white to-slate-50 dark:from-gray-800 dark:to-gray-700 p-4 rounded-xl border-4 border-amber-400 dark:border-amber-600 shadow-lg mb-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-gray-100">CERTIFICATE OF COMPLETION</h3>
                <div className="w-16 h-0.5 bg-amber-400 dark:bg-amber-600 mx-auto my-2"></div>
                <p className="text-slate-600 dark:text-gray-300 text-sm">This is to certify that</p>
                <h4 className="text-base font-bold text-amber-600 dark:text-amber-500">{certificate.studentName}</h4>
                <p className="text-slate-600 dark:text-gray-300 text-sm">has successfully completed</p>
                <h5 className="text-sm font-bold text-slate-800 dark:text-gray-100">{certificate.courseName}</h5>
                <p className="text-slate-500 dark:text-gray-400 text-xs">
                  Completed on {certificate.completionDate.toLocaleDateString()}
                </p>
                <p className="text-slate-800 dark:text-gray-100 font-bold text-xs mt-2">QUISEF LEARN</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => downloadCertificate(certificate)}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Certificate
                </button>
                <Link href="/certificates">
                  <button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2">
                    <Award className="h-4 w-4" />
                    View All Certificates
                  </button>
                </Link>
              </div>
              <button
                onClick={() => setShowCongratulations(false)}
                className="mt-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <Link href="/courses" className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
              <ArrowLeft size={18} className="mr-2" />
              Back to Courses
            </Link>
            {certificate && userProgress.completed && (
              <button
                onClick={() => downloadCertificate(certificate)}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Certificate
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Course Content */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 mb-6">
              <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-4">
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-2">{course.title}</h1>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">{course.description}</p>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                    <span>{course.instructor}</span>
                    <span>{course.level}</span>
                    <span>{course.duration}</span>
                  </div>
                </div>
                {userProgress.completed && (
                  <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 px-3 py-2 rounded-full">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium text-sm">Completed</span>
                  </div>
                )}
              </div>
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Course Progress</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{userProgress.progress}%</span>
                </div>
                <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`rounded-full h-2 transition-all duration-300 ${
                      userProgress.progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${userProgress.progress}%` }}
                  />
                </div>
                {userProgress.completionDate && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Completed on{' '}
                    {userProgress.completionDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white p-4 border-b dark:border-gray-700 flex items-center gap-2">
                Course Content
                {generatingCertificate && (
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
                    <Sparkles className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Generating certificate...</span>
                  </div>
                )}
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
                        {userProgress.readModules[module.id] && <CheckCircle className="text-green-500" size={16} />}
                      </div>
                      <div className="flex items-center gap-2">
                        {module.duration && <span className="text-sm text-gray-500 dark:text-gray-400">{module.duration}</span>}
                        {expandedModules[module.id] ? (
                          <ChevronUp className="text-gray-500 dark:text-gray-400" size={20} />
                        ) : (
                          <ChevronDown className="text-gray-500 dark:text-gray-400" size={20} />
                        )}
                      </div>
                    </div>
                    {expandedModules[module.id] && (
                      <div
                        className="px-4 py-4 text-gray-700 dark:text-gray-300 prose dark:prose-invert max-w-none max-h-[60vh] overflow-y-auto"
                        ref={(el) => {
                          contentRefs.current[module.id] = el;
                        }}
                        onScroll={() => handleScroll(module.id)}
                      >
                        {renderModuleContent(module.content)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 sticky top-8">
              <img src={course.thumbnail} alt={course.title} className="w-full h-32 object-cover rounded-lg mb-4" />
              <div className="mb-6">
                <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-2">Course Progress</h3>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{userProgress.progress}% Complete</p>
                  {userProgress.completed && (
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <CheckCircle size={16} />
                      <span className="text-sm font-medium">Done!</span>
                    </div>
                  )}
                </div>
                <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
                  <div
                    className={`rounded-full h-2 transition-all duration-300 ${
                      userProgress.progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${userProgress.progress}%` }}
                  />
                </div>
              </div>
              <div className="space-y-2 mb-6">
                {course.modules.map((module, index) => (
                  <div
                    key={module.id}
                    className="flex items-center gap-2 text-sm cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded"
                    onClick={() => toggleModule(module.id)}
                  >
                    {userProgress.readModules[module.id] ? (
                      <CheckCircle className="text-green-500 flex-shrink-0" size={16} />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-500 flex-shrink-0" />
                    )}
                    <span className="truncate">{module.title}</span>
                  </div>
                ))}
              </div>
              {userProgress.completed && certificate ? (
                <div className="space-y-3 mb-6">
                  <button
                    onClick={() => downloadCertificate(certificate)}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download Certificate
                  </button>
                  <button
                    onClick={() => setShowCongratulations(true)}
                    className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2"
                  >
                    <Award className="h-4 w-4" />
                    View Certificate
                  </button>
                </div>
              ) : userProgress.progress > 0 && userProgress.progress < 100 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-2">
                    <Sparkles className="h-4 w-4" />
                    <span className="font-medium text-sm">Almost there!</span>
                  </div>
                  <p className="text-sm text-blue-600 dark:text-blue-400">Complete all modules to earn your certificate.</p>
                </div>
              )}
              <Link href="/group">
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg">
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