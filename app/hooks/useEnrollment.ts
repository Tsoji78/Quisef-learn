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
      router.push(`/auth/login?redirect=${encodeURIComponent(`/courses/${courseId}`)}`);
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
      // Check enrollment status first
      const enrollmentRef = doc(db, 'users', userId, 'enrollments', courseId);
      const enrollmentSnap = await getDoc(enrollmentRef);

      if (enrollmentSnap.exists()) {
        throw new Error('You are already enrolled in this course');
      }

      // Create enrollment document
      await setDoc(enrollmentRef, {
        courseId,
        userId,
        enrolledAt: serverTimestamp(),
        status: 'active',
      });

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

      toast.success('Enrolled successfully!');
      
      // Optional: Redirect to course page after successful enrollment
      // router.push(`/dashboard/courses/${courseId}`);
      
      return true;
    } catch (err: any) {
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