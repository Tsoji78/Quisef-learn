import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export interface Module {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: any[];
  content?: any;
  rawContent?: any;
  estimatedTime?: number;
  [key: string]: any;
}

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
  
  // Memoized current module calculation
  const currentModule = useMemo(() => {
    if (!Array.isArray(modules) || modules.length === 0) {
      return null;
    }
    
    if (!moduleId) {
      return modules[0] || null;
    }
    
    const foundModule = modules.find(m => m?.id === moduleId);
    return foundModule || modules[0] || null;
  }, [modules, moduleId]);

  // Memoized navigation data
  const navigationData = useMemo(() => {
    if (!Array.isArray(modules) || modules.length === 0 || !currentModule) {
      return {
        previousModule: null,
        nextModule: null,
        currentModuleIndex: -1
      };
    }
    
    const currentIndex = modules.findIndex(m => m?.id === currentModule.id);
    
    if (currentIndex === -1) {
      return {
        previousModule: null,
        nextModule: null,
        currentModuleIndex: -1
      };
    }
    
    return {
      previousModule: currentIndex > 0 ? modules[currentIndex - 1] : null,
      nextModule: currentIndex < modules.length - 1 ? modules[currentIndex + 1] : null,
      currentModuleIndex: currentIndex
    };
  }, [modules, currentModule]);

  // Navigate to module function with error handling
  const navigateToModule = useCallback((module: Module | null) => {
    if (!module?.id || !courseId) {
      console.warn('Cannot navigate: missing module ID or course ID');
      return;
    }
    
    try {
      // Get current search params
      const currentUrl = new URL(window.location.href);
      const params = new URLSearchParams(currentUrl.search);
      
      // Update module parameter
      params.set('module', module.id);
      
      // If the module has lessons, navigate to the first lesson
      if (module.lessons && module.lessons.length > 0) {
        params.set('lesson', module.lessons[0].id);
      } else {
        params.delete('lesson');
      }
      
      // Navigate to new URL
      const newUrl = `/${courseId}/learn?${params.toString()}`;
      router.push(newUrl);
      
    } catch (error) {
      console.error('Error navigating to module:', error);
      // Fallback navigation without search params preservation
      router.push(`/${courseId}/learn?module=${module.id}`);
    }
  }, [courseId, router]);

  // Navigate to next module
  const navigateToNextModule = useCallback(() => {
    if (navigationData.nextModule) {
      navigateToModule(navigationData.nextModule);
    }
  }, [navigationData.nextModule, navigateToModule]);

  // Navigate to previous module
  const navigateToPreviousModule = useCallback(() => {
    if (navigationData.previousModule) {
      navigateToModule(navigationData.previousModule);
    }
  }, [navigationData.previousModule, navigateToModule]);

  // Check if user can navigate to next/previous modules
  const canNavigateNext = useMemo(() => {
    return navigationData.nextModule !== null;
  }, [navigationData.nextModule]);

  const canNavigatePrevious = useMemo(() => {
    return navigationData.previousModule !== null;
  }, [navigationData.previousModule]);

  // Get module progress information
  const moduleProgress = useMemo(() => {
    if (!Array.isArray(modules) || modules.length === 0) {
      return {
        current: 0,
        total: 0,
        percentage: 0
      };
    }
    
    return {
      current: navigationData.currentModuleIndex + 1,
      total: modules.length,
      percentage: Math.round(((navigationData.currentModuleIndex + 1) / modules.length) * 100)
    };
  }, [modules, navigationData.currentModuleIndex]);

  return {
    // Current navigation state
    currentModule,
    previousModule: navigationData.previousModule,
    nextModule: navigationData.nextModule,
    currentModuleIndex: navigationData.currentModuleIndex,
    
    // Navigation functions
    navigateToModule,
    navigateToNextModule,
    navigateToPreviousModule,
    
    // Navigation capabilities
    canNavigateNext,
    canNavigatePrevious,
    
    // Progress information
    moduleProgress,
    
    // Utility functions
    getModuleByIndex: useCallback((index: number) => {
      return modules?.[index] || null;
    }, [modules]),
    
    getModuleById: useCallback((id: string) => {
      return modules?.find(m => m?.id === id) || null;
    }, [modules]),
    
    // Module validation
    isValidModule: useCallback((module: any): module is Module => {
      return module && typeof module === 'object' && typeof module.id === 'string';
    }, [])
  };
};