import { useState, useEffect } from 'react';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Module } from '@/types/course';

interface UseCourseProgressProps {
  userId: string | undefined;
  courseId: string | undefined;
  modules: Module[];
  initialProgress?: number;
}

export const useCourseProgress = ({ 
  userId, 
  courseId, 
  modules, 
  initialProgress = 0 
}: UseCourseProgressProps) => {
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [currentProgress, setCurrentProgress] = useState(initialProgress);
  const [loading, setLoading] = useState(false);

  // Load user progress
  const loadUserProgress = async () => {
    if (!userId || !courseId) return;
    
    try {
      // Mock completed modules based on progress
      const completedCount = Math.floor((initialProgress / 100) * modules.length);
      const completed = modules.slice(0, completedCount).map(m => m.id);
      setCompletedModules(completed);
    } catch (error) {
      console.error('Error loading user progress:', error);
    }
  };

  // Mark module as complete
  const markModuleComplete = async (module: Module) => {
    if (!userId || !courseId || completedModules.includes(module.id)) return;

    setLoading(true);
    try {
      const newCompleted = [...completedModules, module.id];
      setCompletedModules(newCompleted);

      const userProgressRef = doc(db, 'users', userId, 'enrollments', courseId);
      await updateDoc(userProgressRef, {
        completedModules: arrayUnion(module.id),
        lastAccessed: new Date(),
        progress: Math.round((newCompleted.length / modules.length) * 100),
        ...(newCompleted.length === modules.length && { 
          completedAt: new Date(),
          certificateEligible: true 
        })
      });
    } catch (error) {
      console.error('Error marking module complete:', error);
      setCompletedModules(prev => prev.filter(id => id !== module.id));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId && courseId) {
      loadUserProgress();
    }
  }, [userId, courseId]);

  useEffect(() => {
    if (modules.length > 0) {
      const progress = Math.round((completedModules.length / modules.length) * 100);
      setCurrentProgress(progress);
    }
  }, [completedModules, modules.length]);

  return {
    completedModules,
    currentProgress,
    loading,
    markModuleComplete,
    loadUserProgress
  };
};