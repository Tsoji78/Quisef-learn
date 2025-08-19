import { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Course } from '../types';

export const useCourses = (user: any) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchCourses = async () => {
      setLoading(true);
      try {
        const coursesCollection = collection(db, 'courses');
        const coursesSnapshot = await getDocs(coursesCollection);
        const coursesList = coursesSnapshot.docs
          .map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              title: data.title || '',
              instructor: data.instructor || '',
              level: ['Beginner', 'Intermediate', 'Advanced'].includes(data.level) ? data.level : 'Beginner',
              duration: data.duration || '',
              thumbnail: data.thumbnail || '/api/placeholder/400/250?text=No+Image',
            } as Course;
          })
          .filter((course): course is Course => {
            return (
              typeof course.id === 'string' &&
              typeof course.title === 'string' &&
              typeof course.instructor === 'string' &&
              ['Beginner', 'Intermediate', 'Advanced'].includes(course.level) &&
              typeof course.duration === 'string' &&
              typeof course.thumbnail === 'string'
            );
          });

        setCourses(coursesList);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching courses:', err);
        setError(`Failed to load courses: ${err.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [user]);

  const deleteCourse = async (courseId: string) => {
    try {
      await deleteDoc(doc(db, 'courses', courseId));
      setCourses(courses.filter((course) => course.id !== courseId));
      setError(null);
    } catch (err: any) {
      console.error('Error deleting course:', err);
      setError(`Failed to delete course: ${err.message || 'Unknown error'}`);
    }
  };

  return { courses, loading, error, deleteCourse };
};