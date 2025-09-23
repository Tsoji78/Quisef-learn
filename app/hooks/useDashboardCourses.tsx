import { useState, useEffect, useRef } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Course } from '@/types';

export function useDashboardCourses(userId: string | null) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollmentStatus, setEnrollmentStatus] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const enrollmentCache = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      setError(null);
      try {
        const coursesCollection = collection(db, 'courses');
        const coursesSnapshot = await getDocs(coursesCollection);
        if (coursesSnapshot.empty) {
          setCourses([]);
          setLoading(false);
          return;
        }

        const coursesList: Course[] = await Promise.all(
          coursesSnapshot.docs.map(async (courseDoc) => {
            const data = courseDoc.data();
            let groupId: string | undefined;
            try {
              const groupsQuery = query(collection(db, 'groups'), where('courseId', '==', courseDoc.id));
              const groupsSnapshot = await getDocs(groupsQuery);
              if (!groupsSnapshot.empty) {
                groupId = groupsSnapshot.docs[0].id;
              }
            } catch (groupError) {
              console.warn('Error fetching group info:', groupError);
            }

            return {
              id: courseDoc.id,
              title: data.title || 'Untitled Course',
              instructor: data.instructor || 'Unknown Instructor',
              level: ['Beginner', 'Intermediate', 'Advanced'].includes(data.level) ? data.level : 'Beginner',
              duration: data.duration || 'Unknown',
              progress: typeof data.progress === 'number' ? data.progress : 0,
              thumbnail: data.thumbnail || '/api/placeholder/400/250?text=No+Image',
              category: data.category || 'Uncategorized',
              groupId,
              modules: Array.isArray(data.modules) ? data.modules : [],
            };
          })
        );

        setCourses(coursesList);
        setError(null);
      } catch (err: any) {
        setError(`Failed to load courses: ${err.message || 'Unknown error'}`);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  useEffect(() => {
    if (!userId) {
      setEnrollmentStatus({});
      enrollmentCache.current = {};
      return;
    }

    const checkEnrollmentStatus = async () => {
      try {
        const enrollmentsQuery = query(collection(db, 'users', userId, 'enrollments'));
        const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
        const status: Record<string, boolean> = {};
        enrollmentsSnapshot.forEach((doc) => {
          status[doc.id] = true;
        });
        enrollmentCache.current = status;
        setEnrollmentStatus(status);
      } catch (err) {
        console.error('Error checking enrollment status:', err);
      }
    };

    checkEnrollmentStatus();
  }, [userId]);

  return { courses, enrollmentStatus, loading, error };
}