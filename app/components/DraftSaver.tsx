import React, { useState, useCallback, useEffect } from 'react';
import { Save, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Course } from '@/types';
import { convertToRaw } from 'draft-js';

interface DraftSaverProps {
  formData: Course;
  user: any;
  courseId?: string | null;
  draftEditorActions: {
    getEditorState: (moduleIndex: number) => any;
  };
  className?: string;
}

interface DraftStatus {
  status: 'idle' | 'saving' | 'saved' | 'error';
  message: string;
  lastSaved?: Date;
}

export const DraftSaver: React.FC<DraftSaverProps> = ({
  formData,
  user,
  courseId,
  draftEditorActions,
  className = '',
}) => {
  const [draftStatus, setDraftStatus] = useState<DraftStatus>({
    status: 'idle',
    message: '',
  });
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [autoSaveInterval, setAutoSaveInterval] = useState(30000); // 30 seconds

  // Generate draft ID based on courseId or create new one
  const getDraftId = useCallback(() => {
    if (courseId) {
      return `draft_${courseId}`;
    }
    // For new courses, create a draft ID based on user and timestamp
    const timestamp = Date.now();
    return `draft_new_${user?.uid || 'anonymous'}_${timestamp}`;
  }, [courseId, user]);

  // Save draft to Firebase
  const saveDraft = useCallback(async () => {
    if (!user) {
      setDraftStatus({
        status: 'error',
        message: 'User not authenticated',
      });
      return;
    }

    try {
      setDraftStatus({
        status: 'saving',
        message: 'Saving draft...',
      });

      // Prepare draft data with editor content
      const draftData = {
        ...formData,
        modules: formData.modules.map((module, index) => {
          const editorState = draftEditorActions.getEditorState(index);
          return {
            ...module,
            content: editorState ? convertToRaw(editorState.getCurrentContent()) : module.content,
          };
        }),
        isDraft: true,
        draftMetadata: {
          savedAt: new Date().toISOString(),
          userId: user.uid,
          originalCourseId: courseId,
          autoSaved: true,
        },
      };

      const draftId = getDraftId();
      const draftRef = doc(db, 'courseDrafts', draftId);
      
      await setDoc(draftRef, draftData);

      setDraftStatus({
        status: 'saved',
        message: 'Draft saved successfully',
        lastSaved: new Date(),
      });

      // Clear success message after 3 seconds
      setTimeout(() => {
        setDraftStatus(prev => ({
          ...prev,
          status: 'idle',
          message: '',
        }));
      }, 3000);

    } catch (error) {
      console.error('Error saving draft:', error);
      setDraftStatus({
        status: 'error',
        message: `Failed to save draft: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });

      // Clear error message after 5 seconds
      setTimeout(() => {
        setDraftStatus(prev => ({
          ...prev,
          status: 'idle',
          message: '',
        }));
      }, 5000);
    }
  }, [formData, user, courseId, draftEditorActions, getDraftId]);

  // Manual save draft
  const handleManualSave = useCallback(() => {
    saveDraft();
  }, [saveDraft]);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSaveEnabled || !user) return;

    const intervalId = setInterval(() => {
      // Only auto-save if there's actual content
      const hasContent = formData.title || 
        formData.instructor || 
        (formData.modules && formData.modules.length > 0);

      if (hasContent) {
        saveDraft();
      }
    }, autoSaveInterval);

    return () => clearInterval(intervalId);
  }, [autoSaveEnabled, autoSaveInterval, saveDraft, formData, user]);

  // Load existing draft
  const loadDraft = useCallback(async () => {
    if (!user) return null;

    try {
      const draftId = getDraftId();
      const draftRef = doc(db, 'courseDrafts', draftId);
      const draftDoc = await getDoc(draftRef);
      
      if (draftDoc.exists()) {
        return draftDoc.data() as Course & { 
          isDraft: boolean; 
          draftMetadata: any; 
        };
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
    
    return null;
  }, [user, getDraftId]);

  // Format last saved time
  const formatLastSaved = useCallback((date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    return date.toLocaleDateString();
  }, []);

  // Get status icon
  const getStatusIcon = () => {
    switch (draftStatus.status) {
      case 'saving':
        return <Clock className="w-4 h-4 animate-spin" />;
      case 'saved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Save className="w-4 h-4" />;
    }
  };

  // Get status color classes
  const getStatusClasses = () => {
    switch (draftStatus.status) {
      case 'saving':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'saved':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'error':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
    }
  };

  return (
    <div className={`draft-saver ${className}`}>
      {/* Draft Controls */}
      <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
        {/* Manual Save Button */}
        <button
          onClick={handleManualSave}
          disabled={draftStatus.status === 'saving'}
          className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm font-medium transition-colors ${getStatusClasses()}`}
          title="Save as draft"
        >
          {getStatusIcon()}
          <span>Save Draft</span>
        </button>

        {/* Status Message */}
        {draftStatus.message && (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {draftStatus.message}
          </span>
        )}

        {/* Last Saved Time */}
        {draftStatus.lastSaved && draftStatus.status !== 'saving' && (
          <span className="text-xs text-gray-500 dark:text-gray-500">
            Last saved: {formatLastSaved(draftStatus.lastSaved)}
          </span>
        )}

        {/* Auto-save Toggle */}
        <div className="flex items-center gap-2 ml-auto">
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={autoSaveEnabled}
              onChange={(e) => setAutoSaveEnabled(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Auto-save
          </label>
          
          {autoSaveEnabled && (
            <select
              value={autoSaveInterval}
              onChange={(e) => setAutoSaveInterval(Number(e.target.value))}
              className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400"
            >
              <option value={15000}>15s</option>
              <option value={30000}>30s</option>
              <option value={60000}>1m</option>
              <option value={300000}>5m</option>
            </select>
          )}
        </div>
      </div>

      {/* Draft Info Banner */}
      {formData.isDraft && (
        <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            <span className="text-sm text-yellow-800 dark:text-yellow-200">
              This is a draft version. Changes will be auto-saved but not published until you save the course.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DraftSaver;