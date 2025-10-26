import { useState, useEffect, useMemo, useRef } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Course } from '@/types';

export function useCourseDetails(courseId: string, userId: string | null) {
  const [course, setCourse] = useState<Course | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastModuleId, setLastModuleId] = useState<string | null>(null);
  
  // Use ref to track if we've already fetched this course
  const fetchedCourseId = useRef<string | null>(null);

  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) {
        setError('No course ID provided');
        setLoading(false);
        return;
      }

      // Skip if we've already fetched this course
      if (fetchedCourseId.current === courseId) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const docRef = doc(db, 'courses', courseId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const courseData: Course = {
            id: docSnap.id,
            title: data.title || 'Untitled Course',
            instructor: data.instructor || 'Unknown Instructor',
            description: data.description || 'No description available',
            level: ['Beginner', 'Intermediate', 'Advanced'].includes(data.level) ? data.level : 'Beginner',
            duration: data.duration || 'Unknown',
            price: typeof data.price === 'number' ? data.price : 0,
            originalPrice: typeof data.originalPrice === 'number' ? data.originalPrice : undefined,
            thumbnail: data.thumbnail || '',
            category: data.category || 'Uncategorized',
            modules: Array.isArray(data.modules) ? data.modules : [],
            rating: typeof data.rating === 'number' ? data.rating : 4.0,
            totalStudents: typeof data.totalStudents === 'number' ? data.totalStudents : 0,
            lastUpdated: data.lastUpdated || new Date().toLocaleDateString(),
            language: data.language || 'English',
            certificate: Boolean(data.certificate),
            requirements: Array.isArray(data.requirements) ? data.requirements : ['Basic computer skills'],
            whatYouLearn: Array.isArray(data.whatYouLearn) ? data.whatYouLearn : ['Course content and skills'],
            targetAudience: Array.isArray(data.targetAudience) ? data.targetAudience : ['Students interested in learning'],
            instructor_bio: data.instructor_bio || 'Experienced instructor',
            instructor_image: data.instructor_image || '',
            preview_video: data.preview_video || '',
            groupId: data.groupId || undefined,
          };

          setCourse(courseData);
          fetchedCourseId.current = courseId;
        } else {
          setError('Course not found');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load course');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  // In useCourseDetails.ts - replace the enrollment check with:
useEffect(() => {
  if (!userId || !courseId) return;

  const enrollmentRef = doc(db, 'users', userId, 'enrollments', courseId);
  
  const unsubscribe = onSnapshot(enrollmentRef, (snap) => {
    const enrolled = snap.exists();
    setIsEnrolled(enrolled);

    if (enrolled) {
      const progressRef = doc(db, 'users', userId, 'courseProgress', courseId);
      getDoc(progressRef).then(progressSnap => {
        if (progressSnap.exists()) {
          const progressData = progressSnap.data();
          const readModules = progressData.readModules || {};
          const lastModule = Object.keys(readModules).sort().pop();
          setLastModuleId(lastModule || null);
        }
      });
    }
  });

  return () => unsubscribe();
}, [userId, courseId]);

  // Memoize the return value to prevent unnecessary object recreation
  return useMemo(
    () => ({
      course,
      isEnrolled,
      loading,
      error,
      lastModuleId,
    }),
    [course, isEnrolled, loading, error, lastModuleId]
  );
}