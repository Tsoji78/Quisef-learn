import { useState, useCallback, useMemo } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export function useEnrollment(courseId: string, userId: string | null) {
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleEnrollment = useCallback(async () => {
    if (!userId) {
      router.push(`/auth/login?redirect=${encodeURIComponent(`/${courseId}`)}`);
      return false;
    }

    if (!courseId) {
      setError('Invalid course ID');
      toast.error('Invalid course ID');
      return false;
    }

    setEnrolling(true);
    setError(null);

    try {
      console.log('🎓 Starting enrollment process for course:', courseId);

      // Check enrollment status first
      const enrollmentRef = doc(db, 'users', userId, 'enrollments', courseId);
      const enrollmentSnap = await getDoc(enrollmentRef);

      if (enrollmentSnap.exists()) {
        console.log('⚠️ User already enrolled in this course');
        throw new Error('You are already enrolled in this course');
      }

      // Create enrollment document
      await setDoc(enrollmentRef, {
        courseId,
        userId,
        enrolledAt: serverTimestamp(),
        status: 'active',
      });

      console.log('✅ Enrollment document created');

      // Initialize progress tracking
      const progressRef = doc(db, 'users', userId, 'courseProgress', courseId);
      await setDoc(progressRef, {
        readModules: {},
        scrollPositions: {},
        lastReadDate: serverTimestamp(),
        courseId,
        userId,
        progress: 0,
      });

      console.log('✅ Progress tracking initialized');

      toast.success('Enrolled successfully!');

      // Get course data to find first module
      const courseRef = doc(db, 'courses', courseId);
      const courseSnap = await getDoc(courseRef);

      if (courseSnap.exists()) {
        const courseData = courseSnap.data();
        const firstModuleId = courseData.modules?.[0]?.id || courseData.firstModuleId;

        if (firstModuleId) {
          console.log('🚀 Redirecting to first module:', firstModuleId);
          // Redirect to the first module of the course
          router.push(`/${courseId}/learn/${firstModuleId}`);
        } else {
          console.warn('⚠️ No modules found, redirecting to courses list');
          // No modules available, go back to courses
          router.push('/courses');
        }
      } else {
        console.error('❌ Course document not found');
        // Course not found, redirect to courses list
        router.push('/courses');
      }

      return true;
    } catch (err: any) {
      console.error('❌ Enrollment error:', err);
      const errorMessage = err.message || 'Failed to enroll';
      setError(errorMessage);
      toast.error(`Failed to enroll: ${errorMessage}`);
      return false;
    } finally {
      setEnrolling(false);
    }
  }, [courseId, userId, router]);

  // Clear error when courseId or userId changes
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Memoize the return object to prevent unnecessary recreations
  return useMemo(
    () => ({
      handleEnrollment,
      enrolling,
      error,
      clearError,
    }),
    [handleEnrollment, enrolling, error, clearError]
  );
}