'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, setDoc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { ArrowLeft, ChevronDown, ChevronUp, CheckCircle, Award, Download, Sparkles } from 'lucide-react';
import Link from 'next/link';
import parse from 'html-react-parser';
import { toast } from 'react-hot-toast';
import debounce from 'lodash/debounce';
import { useTheme } from '@/context/ThemeContext'; // Updated import

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
}

interface Certificate {
  id?: string;
  userId: string;
  courseId: string;
  courseName: string;
  studentName: string;
  completionDate: Date;
  issuedDate: Date;
  certificateUrl?: string;
}

export default function CourseDetailPage() {
  const { isDark } = useTheme(); // Use centralized ThemeProvider
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
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [generatingCertificate, setGeneratingCertificate] = useState(false);
  const [lastToastTime, setLastToastTime] = useState<number>(0);
  const [hasShownCompletionToast, setHasShownCompletionToast] = useState(false);
  const contentRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [authResolved, setAuthResolved] = useState(false);

  // Generate certificate automatically when course is completed
  const generateCertificate = async (courseData: Course, userData: any, completionDate: Date) => {
    if (!userData || !courseData) return null;

    setGeneratingCertificate(true);
    try {
      const certificateData: Certificate = {
        userId: userData.uid,
        courseId: courseData.id,
        courseName: courseData.title,
        studentName: userData.displayName || userData.email?.split('@')[0] || 'Student',
        completionDate: completionDate,
        issuedDate: new Date(),
      };

      const certificateRef = await addDoc(collection(db, 'certificates'), certificateData);
      const progressRef = doc(db, 'users', userData.uid, 'courseProgress', courseData.id);
      await updateDoc(progressRef, {
        certificateGenerated: true,
        certificateId: certificateRef.id,
      });

      const finalCertificate = { ...certificateData, id: certificateRef.id };
      setCertificate(finalCertificate);
      return finalCertificate;
    } catch (error) {
      console.error('Error generating certificate:', error);
      toast.error('Failed to generate certificate');
      return null;
    } finally {
      setGeneratingCertificate(false);
    }
  };

  // Download certificate as PNG
  const downloadCertificate = (cert: Certificate) => {
    if (!cert) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = 1600;
    canvas.height = 900;

    if (!ctx) {
      toast.error('Unable to generate certificate: Canvas context not available.');
      return;
    }

    // Gradient background (theme-aware)
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, isDark ? '#1f2937' : '#f8fafc');
    gradient.addColorStop(1, isDark ? '#374151' : '#e2e8f0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add decorative border
    ctx.strokeStyle = isDark ? '#a78bfa' : '#d4af37';
    ctx.lineWidth = 12;
    ctx.strokeRect(60, 60, canvas.width - 120, canvas.height - 120);

    // Inner elegant border
    ctx.strokeStyle = isDark ? '#60a5fa' : '#1e40af';
    ctx.lineWidth = 4;
    ctx.strokeRect(90, 90, canvas.width - 180, canvas.height - 180);

    // Add corner decorations
    const cornerSize = 80;
    ctx.fillStyle = isDark ? '#a78bfa' : '#d4af37';
    ctx.fillRect(90, 90, cornerSize, 8);
    ctx.fillRect(90, 90, 8, cornerSize);
    ctx.fillRect(canvas.width - 170, 90, cornerSize, 8);
    ctx.fillRect(canvas.width - 98, 90, 8, cornerSize);
    ctx.fillRect(90, canvas.height - 98, cornerSize, 8);
    ctx.fillRect(90, canvas.height - 170, 8, cornerSize);
    ctx.fillRect(canvas.width - 170, canvas.height - 98, cornerSize, 8);
    ctx.fillRect(canvas.width - 98, canvas.height - 170, 8, cornerSize);

    ctx.textAlign = 'center';

    // Title
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

    // Quisef Learn branding
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
  };

  // Content rendering helper functions (unchanged)
  const renderModuleContent = (content: any) => {
    if (!content) {
      return <div className="text-gray-500 dark:text-gray-400 italic">No content available for this module.</div>;
    }

    if (typeof content === 'object' && content !== null && content.blocks && Array.isArray(content.blocks)) {
      try {
        let htmlContent = '';

        content.blocks.forEach((block: any) => {
          if (!block || !block.text) return;

          let blockText = block.text;

          if (block.inlineStyleRanges && block.inlineStyleRanges.length > 0) {
            blockText = applyInlineStyles(blockText, block.inlineStyleRanges);
          }

          if (block.entityRanges && block.entityRanges.length > 0 && content.entityMap) {
            blockText = applyEntityRanges(blockText, block.entityRanges, content.entityMap);
          }

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
            case 'header-four':
              htmlContent += `<h4>${blockText}</h4>`;
              break;
            case 'header-five':
              htmlContent += `<h5>${blockText}</h5>`;
              break;
            case 'header-six':
              htmlContent += `<h6>${blockText}</h6>`;
              break;
            case 'blockquote':
              htmlContent += `<blockquote>${blockText}</blockquote>`;
              break;
            case 'code-block':
              htmlContent += `<pre><code>${blockText}</code></pre>`;
              break;
            case 'unordered-list-item':
              htmlContent += `<li>${blockText}</li>`;
              break;
            case 'ordered-list-item':
              htmlContent += `<li>${blockText}</li>`;
              break;
            case 'atomic':
              if (block.entityRanges && block.entityRanges.length > 0 && content.entityMap) {
                const entityKey = block.entityRanges[0].key;
                const entity = content.entityMap[entityKey];
                if (entity && entity.data) {
                  htmlContent += renderAtomicBlock(entity);
                }
              }
              break;
            default:
              htmlContent += blockText ? `<p>${blockText}</p>` : '<p><br/></p>';
          }
        });

        return htmlContent ? (
          <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: htmlContent }} />
        ) : (
          <div className="text-gray-500 dark:text-gray-400 italic">No content to display.</div>
        );
      } catch (error) {
        console.error('Draft.js content parsing error:', error);
        return <div className="text-red-500 dark:text-red-400">Error parsing Draft.js content. Using fallback display.</div>;
      }
    }

    if (typeof content === 'object' && content !== null) {
      if (content.content) {
        return renderModuleContent(content.content);
      }
      if (content.html) {
        return <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: content.html }} />;
      }
      if (content.text) {
        return <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{content.text}</div>;
      }

      return (
        <div className="text-orange-600 dark:text-orange-400 p-4 bg-orange-50 dark:bg-orange-900/20 rounded">
          <p className="font-bold">Unrecognized content format</p>
          <p className="text-sm mt-1">Keys: {Object.keys(content).join(', ')}</p>
        </div>
      );
    }

    if (typeof content === 'string') {
      if (content.includes('<') && content.includes('>')) {
        try {
          return <div className="prose dark:prose-invert max-w-none">{parse(content)}</div>;
        } catch (error) {
          console.error('HTML parse error:', error);
          return <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: content }} />;
        }
      } else {
        return <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{content}</div>;
      }
    }

    return <div className="text-gray-500 dark:text-gray-400 italic">Unable to display content (Type: {typeof content}).</div>;
  };

  const applyInlineStyles = (text: string, styleRanges: any[]) => {
    let result = text;
    const sortedRanges = [...styleRanges].sort((a, b) => b.offset - a.offset);

    sortedRanges.forEach((range) => {
      const { offset, length, style } = range;
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
        default:
          if (style.startsWith('TEXT_COLOR_')) {
            const color = style.replace('TEXT_COLOR_', '').toLowerCase();
            styledText = `<span style="color: #${color}">${styled}</span>`;
          } else if (style.startsWith('HIGHLIGHT_')) {
            const color = style.replace('HIGHLIGHT_', '').toLowerCase();
            styledText = `<span style="background-color: #${color}">${styled}</span>`;
          }
      }

      result = before + styledText + after;
    });

    return result;
  };

  const applyEntityRanges = (text: string, entityRanges: any[], entityMap: any) => {
    let result = text;
    const sortedRanges = [...entityRanges].sort((a, b) => b.offset - a.offset);

    sortedRanges.forEach((range) => {
      const { offset, length, key } = range;
      const entity = entityMap[key];
      if (!entity) return;

      const before = result.slice(0, offset);
      const entityText = result.slice(offset, offset + length);
      const after = result.slice(offset + length);

      let replacementText = entityText;
      switch (entity.type) {
        case 'LINK':
          replacementText = `<a href="${entity.data.url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline">${entityText}</a>`;
          break;
      }

      result = before + replacementText + after;
    });

    return result;
  };

  const renderAtomicBlock = (entity: any) => {
    const { type, data } = entity;

    switch (type) {
      case 'IMAGE':
        return `<img src="${data.src}" alt="${data.alt || ''}" style="max-width: 100%; height: auto;" />`;
      case 'VIDEO':
        return `<video controls style="max-width: 100%; height: auto;">
          <source src="${data.src}" type="video/mp4">
          Your browser does not support the video tag.
        </video>`;
      case 'IFRAME_VIDEO':
        return `<iframe src="${data.src}" style="width: 100%; height: 315px;" frameborder="0" allowfullscreen></iframe>`;
      default:
        return `<div>Unsupported media type: ${type}</div>`;
    }
  };

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

  useEffect(() => {
    setAuthLoading(true);
    const unsubscribe = onAuthStateChanged(getAuth(), (currentUser) => {
      setUser(currentUser);
      if (!authResolved) {
        setAuthResolved(true);
      }
      if (currentUser && courseId) {
        loadUserProgress(currentUser.uid, courseId);
      } else if (!currentUser && authResolved) {
        router.push('/login');
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [courseId, authResolved]);

  const loadUserProgress = async (userId: string, courseId: string) => {
    try {
      const progressRef = doc(db, 'users', userId, 'courseProgress', courseId);
      const progressSnap = await getDoc(progressRef);
      if (progressSnap.exists()) {
        const data = progressSnap.data();
        const progress: UserProgress = {
          readModules: data.readModules || {},
          scrollPositions: data.scrollPositions || {},
          lastReadDate: data.lastReadDate ? data.lastReadDate.toDate() : new Date(),
          courseId: data.courseId || courseId,
          userId: data.userId || userId,
          progress: data.progress || 0,
          completed: data.completed || false,
          completionDate: data.completionDate ? data.completionDate.toDate() : undefined,
          certificateGenerated: data.certificateGenerated || false,
        };
        setUserProgress(progress);
        setHasShownCompletionToast(progress.completed || false);

        if (progress.certificateGenerated && data.certificateId) {
          const certRef = doc(db, 'certificates', data.certificateId);
          const certSnap = await getDoc(certRef);
          if (certSnap.exists()) {
            const certData = certSnap.data();
            setCertificate({
              ...certData,
              id: certSnap.id,
              completionDate: certData.completionDate.toDate(),
              issuedDate: certData.issuedDate.toDate(),
            } as Certificate);
          }
        }
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
      console.error('Error loading user progress:', err);
      setError(getFriendlyErrorMessage(err));
    }
  };

  const debouncedSaveUserProgress = useCallback(
    debounce(async (updatedProgress: UserProgress) => {
      if (!user || !courseId || savingProgress || !course) return;

      setSavingProgress(true);
      try {
        const progressRef = doc(db, 'users', user.uid, 'courseProgress', courseId);

        const totalModules = course.modules.length;
        const completedModules = Object.values(updatedProgress.readModules).filter(Boolean).length;
        const newProgressPercentage = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

        updatedProgress.progress = newProgressPercentage;

        const wasCompleted = updatedProgress.completed;
        const isNowCompleted = newProgressPercentage === 100;
        const alreadyHasCertificate = updatedProgress.certificateGenerated;

        if (isNowCompleted && !wasCompleted && !alreadyHasCertificate) {
          updatedProgress.completed = true;
          updatedProgress.completionDate = new Date();
          const newCertificate = await generateCertificate(course, user, updatedProgress.completionDate);
          if (newCertificate) {
            updatedProgress.certificateGenerated = true;
          }
        } else if (isNowCompleted && !wasCompleted) {
          updatedProgress.completed = true;
          updatedProgress.completionDate = new Date();
        }

        await updateDoc(progressRef, {
          readModules: updatedProgress.readModules,
          scrollPositions: updatedProgress.scrollPositions,
          lastReadDate: new Date(),
          courseId: updatedProgress.courseId,
          userId: updatedProgress.userId,
          progress: updatedProgress.progress,
          completed: updatedProgress.completed || false,
          completionDate: updatedProgress.completionDate || null,
          certificateGenerated: updatedProgress.certificateGenerated || false,
        });

        if (newProgressPercentage !== course.progress) {
          const courseRef = doc(db, 'courses', courseId);
          await updateDoc(courseRef, { progress: newProgressPercentage });
          setCourse((prev) => (prev ? { ...prev, progress: newProgressPercentage } : null));
        }

        const now = Date.now();
        if (isNowCompleted && !wasCompleted && !hasShownCompletionToast) {
          toast.success('🎉 Congratulations! You completed the course!');
          setHasShownCompletionToast(true);
          setShowCongratulations(true);
          setLastToastTime(now);
        } else if (now - lastToastTime > 5000) {
          toast.success('Progress saved!');
          setLastToastTime(now);
        }
      } catch (err: any) {
        console.error('Error saving progress:', err);
        toast.error('Failed to save progress');
      } finally {
        setSavingProgress(false);
      }
    }, 2000),
    [user, courseId, savingProgress, course, hasShownCompletionToast, lastToastTime]
  );

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
    debouncedSaveUserProgress(updatedProgress);
  };

  useEffect(() => {
    Object.entries(expandedModules).forEach(([moduleId, isExpanded]) => {
      if (isExpanded && contentRefs.current[moduleId] && userProgress.scrollPositions[moduleId]) {
        contentRefs.current[moduleId]!.scrollTop = userProgress.scrollPositions[moduleId];
      }
    });
  }, [expandedModules, userProgress.scrollPositions]);

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
            modules: Array.isArray(data.modules)
              ? data.modules.map((module: any) => ({
                  ...module,
                  id: module.id || `module-${Date.now()}-${Math.random()}`,
                  title: module.title || 'Untitled Module',
                  content: module.content,
                  duration: module.duration,
                }))
              : [],
          });
          setError(null);
        } else {
          setError('Course not found');
        }
      } catch (err: any) {
        console.error('Error fetching course:', err);
        setError(getFriendlyErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId, user, authLoading]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  if (loading || authLoading || !authResolved) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
            {error || 'Course not found'}
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 max-w-lg sm:max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="text-center">
              <div className="mb-6">
                <div className="mx-auto w-20 sm:w-24 h-20 sm:h-24 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-4">
                  <Award className="w-10 sm:w-12 h-10 sm:h-12 text-white" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-2">Congratulations! 🎉</h2>
                <p className="text-base sm:text-xl text-gray-600 dark:text-gray-300 mb-6">
                  You've successfully completed the course!
                </p>
              </div>

              {/* Certificate Preview */}
              <div className="bg-gradient-to-br from-white to-slate-50 dark:from-gray-800 dark:to-gray-700 p-4 sm:p-6 rounded-xl border-4 border-amber-400 dark:border-amber-600 shadow-lg mb-6 relative">
                <div className="absolute top-2 left-2 w-6 sm:w-8 h-6 sm:h-8 border-l-2 border-t-2 border-amber-400 dark:border-amber-600"></div>
                <div className="absolute top-2 right-2 w-6 sm:w-8 h-6 sm:h-8 border-r-2 border-t-2 border-amber-400 dark:border-amber-600"></div>
                <div className="absolute bottom-2 left-2 w-6 sm:w-8 h-6 sm:h-8 border-l-2 border-b-2 border-amber-400 dark:border-amber-600"></div>
                <div className="absolute bottom-2 right-2 w-6 sm:w-8 h-6 sm:h-8 border-r-2 border-b-2 border-amber-400 dark:border-amber-600"></div>

                <div className="text-center space-y-2 sm:space-y-3">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-gray-100">CERTIFICATE OF COMPLETION</h3>
                  <div className="w-12 sm:w-16 h-0.5 bg-amber-400 dark:bg-amber-600 mx-auto"></div>
                  <p className="text-slate-600 dark:text-gray-300 text-xs sm:text-sm">This is to certify that</p>
                  <h4 className="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-500">{certificate.studentName}</h4>
                  <p className="text-slate-600 dark:text-gray-300 text-xs sm:text-sm">has successfully completed</p>
                  <h5 className="text-sm sm:text-base font-bold text-slate-800 dark:text-gray-100">{certificate.courseName}</h5>
                  <p className="text-slate-500 dark:text-gray-400 text-xs">
                    Completed on {certificate.completionDate.toLocaleDateString()}
                  </p>
                  <div className="mt-2">
                    <p className="text-slate-800 dark:text-gray-100 font-bold text-xs sm:text-sm">QUISEF LEARN</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <button
                  onClick={() => downloadCertificate(certificate)}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-xl transition-all duration-300 flex items-center gap-2"
                >
                  <Download className="h-4 sm:h-5 w-4 sm:w-5" />
                  Download Certificate
                </button>
                <Link href="/certificates">
                  <button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-xl transition-all duration-300 flex items-center gap-2">
                    <Award className="h-4 sm:h-5 w-4 sm:w-5" />
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

      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <Link href="/courses" className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
              <ArrowLeft size={18} className="mr-2" />
              Back to Courses
            </Link>

            {certificate && userProgress.completed && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <Award className="h-4 sm:h-5 w-4 sm:w-5" />
                  <span className="font-medium text-sm sm:text-base">Course Completed!</span>
                </div>
                <button
                  onClick={() => downloadCertificate(certificate)}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Certificate
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Course Content */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 mb-6 lg:mb-8">
              <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-4">
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-4">{course.title}</h1>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">{course.description}</p>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>{course.instructor}</span>
                    <span>{course.level}</span>
                    <span>{course.duration}</span>
                  </div>
                </div>
                {userProgress.completed && (
                  <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 px-3 py-2 rounded-full">
                    <CheckCircle className="h-4 sm:h-5 w-4 sm:w-5" />
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
                    className={`rounded-full h-2 transition-all duration-500 ${
                      userProgress.progress === 100
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                        : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                    }`}
                    style={{ width: `${userProgress.progress}%` }}
                  ></div>
                </div>
                {userProgress.completionDate && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Completed on{' '}
                    {userProgress.completionDate.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white p-4 sm:p-6 border-b dark:border-gray-700 flex items-center gap-2">
                Course Content
                {generatingCertificate && (
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
                    <Sparkles className="h-4 sm:h-5 w-4 sm:w-5 animate-spin" />
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
                        {userProgress.readModules[module.id] && (
                          <CheckCircle className="text-green-500" size={16} />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {module.duration && (
                          <span className="text-sm text-gray-500 dark:text-gray-400">{module.duration}</span>
                        )}
                        {expandedModules[module.id] ? (
                          <ChevronUp className="text-gray-500 dark:text-gray-400" size={20} />
                        ) : (
                          <ChevronDown className="text-gray-500 dark:text-gray-400" size={20} />
                        )}
                      </div>
                    </div>
                    {expandedModules[module.id] && (
                      <div
                        className="px-4 sm:px-6 py-4 text-gray-700 dark:text-gray-300 prose dark:prose-invert max-w-none max-h-[60vh] overflow-y-auto"
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
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-32 sm:h-40 object-cover rounded-lg mb-4"
              />

              <div className="mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-2">Course Progress</h3>
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
                    className={`rounded-full h-2 transition-all duration-500 ${
                      userProgress.progress === 100
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                        : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                    }`}
                    style={{ width: `${userProgress.progress}%` }}
                  ></div>
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

              {/* Certificate Section */}
              {userProgress.completed && certificate ? (
                <div className="space-y-3 mb-6">
                  <button
                    onClick={() => downloadCertificate(certificate)}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-2 sm:py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <Download className="h-4 sm:h-5 w-4 sm:w-5" />
                    Download Certificate
                  </button>
                  <button
                    onClick={() => setShowCongratulations(true)}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-2 sm:py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <Award className="h-4 sm:h-5 w-4 sm:w-5" />
                    View Certificate
                  </button>
                </div>
              ) : userProgress.progress > 0 && userProgress.progress < 100 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-2">
                    <Sparkles className="h-4 sm:h-5 w-4 sm:w-5" />
                    <span className="font-medium text-sm">Almost there!</span>
                  </div>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Complete all modules to earn your certificate.
                  </p>
                </div>
              )}

              <Link href="/group">
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 sm:py-3 px-4 rounded-lg transition-colors">
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