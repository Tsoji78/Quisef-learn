import { useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Module } from '@/types';

interface UseModuleNavigationProps {
  modules: Module[];
  moduleId: string | null;
  courseId: string;
}

export const useModuleNavigation = ({ 
  modules, 
  moduleId, 
  courseId 
}: UseModuleNavigationProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentModule = useMemo(() => {
    if (modules.length === 0) return null;
    if (!moduleId) return modules[0] || null;
    return modules.find(m => m.id === moduleId) || modules[0] || null;
  }, [modules, moduleId]);

  const { previousModule, nextModule, currentModuleIndex } = useMemo(() => {
    if (modules.length === 0 || !currentModule) {
      return {
        previousModule: null,
        nextModule: null,
        currentModuleIndex: -1
      };
    }
    
    const currentIndex = modules.findIndex(m => m.id === currentModule.id);
    return {
      previousModule: currentIndex > 0 ? modules[currentIndex - 1] : null,
      nextModule: currentIndex < modules.length - 1 ? modules[currentIndex + 1] : null,
      currentModuleIndex: currentIndex
    };
  }, [modules, currentModule]);

  const navigateToModule = (module: Module | null) => {
    if (!module) return;
    
    const params = new URLSearchParams(searchParams);
    params.set('module', module.id);
    router.push(`/courses/${courseId}/learn?${params.toString()}`);
  };

  return {
    currentModule,
    previousModule,
    nextModule,
    currentModuleIndex,
    navigateToModule
  };
};