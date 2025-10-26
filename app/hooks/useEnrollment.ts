import { useState, useCallback, useMemo } from 'react';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export function useEnrollment(courseId: string, userId: string | null) {
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleEnrollment = useCallback(async () => {
    if (!userId) {
      router.push(`/login?redirect=${encodeURIComponent(`/${courseId}`)}`);
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
        console.log('✅ User already enrolled in this course');
        throw new Error('You are already enrolled in this course');
      }

      // Get user details for group membership
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();

      // Get course details to find associated group
      const courseRef = doc(db, 'courses', courseId);
      const courseSnap = await getDoc(courseRef);
      
      if (!courseSnap.exists()) {
        throw new Error('Course not found');
      }

      const courseData = courseSnap.data();
      const groupId = courseData.groupId;

      // Create enrollment document
      await setDoc(enrollmentRef, {
        courseId,
        userId,
        enrolledAt: serverTimestamp(),
        status: 'active',
        groupId: groupId || null,
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

      // Auto-connect to course group if groupId exists
      if (groupId) {
        try {
          console.log('🔗 Connecting user to course group:', groupId);
          
          const groupRef = doc(db, 'groups', groupId);
          const groupSnap = await getDoc(groupRef);

          if (groupSnap.exists()) {
            // Prepare member data
            const newMember = {
              id: userId,
              name: userData?.displayName || userData?.name || 'Unknown User',
              email: userData?.email || '',
              role: 'Student' as const,
              profileImage: userData?.photoURL || userData?.profileImage || '',
            };

            // Add user to group members array
            await updateDoc(groupRef, {
              members: arrayUnion(newMember),
              updatedAt: serverTimestamp(),
            });

            console.log('✅ User successfully added to course group');
            toast.success('Enrolled successfully and connected to course group!');
          } else {
            console.warn('⚠️ Course group not found:', groupId);
            toast.success('Enrolled successfully! (Group connection pending)');
          }
        } catch (groupError) {
          console.error('❌ Error connecting to group:', groupError);
          // Don't fail the entire enrollment if group connection fails
          toast.success('Enrolled successfully! (Unable to connect to group at this time)');
        }
      } else {
        console.log('ℹ️ No group associated with this course');
        toast.success('Enrolled successfully!');
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