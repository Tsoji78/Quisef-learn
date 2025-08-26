import { useState, useCallback, useEffect } from 'react';
import { doc, setDoc, getDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Course } from '@/types';
import { convertToRaw } from 'draft-js';

interface DraftMetadata {
  savedAt: string;
  userId: string;
  originalCourseId?: string | null;
  autoSaved: boolean;
  version?: number;
}

interface DraftCourse extends Course {
  isDraft: boolean;
  draftMetadata: DraftMetadata;
}

interface UseDraftSavingOptions {
  user: any;
  courseId?: string | null;
  autoSaveInterval?: number;
  maxDraftVersions?: number;
}

export const useDraftSaving = ({
  user,
  courseId,
  autoSaveInterval = 30000,
  maxDraftVersions = 5,
}: UseDraftSavingOptions) => {
  const [drafts, setDrafts] = useState<DraftCourse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Generate draft ID
  const getDraftId = useCallback((suffix?: string) => {
    const base = courseId ? `draft_${courseId}` : `draft_new_${user?.uid || 'anonymous'}_${Date.now()}`;
    return suffix ? `${base}_${suffix}` : base;
  }, [courseId, user]);

  // Save draft with versioning
  const saveDraft = useCallback(async (
    formData: Course,
    draftEditorActions: { getEditorState: (moduleIndex: number) => any },
    options: { manualSave?: boolean; version?: number } = {}
  ): Promise<string | null> => {
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Prepare draft data
      const draftData: DraftCourse = {
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
          autoSaved: !options.manualSave,
          version: options.version || 1,
        },
      };

      const draftId = getDraftId(options.version ? `v${options.version}` : undefined);
      const draftRef = doc(db, 'course_drafts', draftId);
      
      await setDoc(draftRef, draftData);
      setLastSaved(new Date());

      // Clean up old versions if needed
      if (options.manualSave && maxDraftVersions > 0) {
        await cleanupOldVersions();
      }

      return draftId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to save draft: ${errorMessage}`);
      console.error('Error saving draft:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, courseId, getDraftId, maxDraftVersions]);

  // Load specific draft
  const loadDraft = useCallback(async (draftId?: string): Promise<DraftCourse | null> => {
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      const targetDraftId = draftId || getDraftId();
      const draftRef = doc(db, 'course_drafts', targetDraftId);
      const draftDoc = await getDoc(draftRef);
      
      if (draftDoc.exists()) {
        return draftDoc.data() as DraftCourse;
      }
      
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to load draft: ${errorMessage}`);
      console.error('Error loading draft:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, getDraftId]);

  // Load all drafts for user
  const loadAllDrafts = useCallback(async (): Promise<DraftCourse[]> => {
    if (!user) {
      setError('User not authenticated');
      return [];
    }

    try {
      setIsLoading(true);
      setError(null);

      const draftsQuery = query(
        collection(db, 'courseDrafts'),
        where('draftMetadata.userId', '==', user.uid)
      );
      
      const querySnapshot = await getDocs(draftsQuery);
      const draftsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DraftCourse[];

      // Sort by saved date (newest first)
      draftsData.sort((a, b) => 
        new Date(b.draftMetadata.savedAt).getTime() - new Date(a.draftMetadata.savedAt).getTime()
      );

      setDrafts(draftsData);
      return draftsData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to load drafts: ${errorMessage}`);
      console.error('Error loading drafts:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Delete draft
  const deleteDraft = useCallback(async (draftId: string): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      const draftRef = doc(db, 'courseDrafts', draftId);
      await deleteDoc(draftRef);

      // Update local drafts list
      setDrafts(prev => prev.filter(draft => draft.id !== draftId));
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to delete draft: ${errorMessage}`);
      console.error('Error deleting draft:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Clean up old draft versions
  const cleanupOldVersions = useCallback(async () => {
    if (!user || maxDraftVersions <= 0) return;

    try {
      const userDrafts = await loadAllDrafts();
      const courseRelatedDrafts = userDrafts.filter(draft => 
        draft.draftMetadata.originalCourseId === courseId
      );

      if (courseRelatedDrafts.length > maxDraftVersions) {
        // Sort by version and keep only the latest versions
        const sortedDrafts = courseRelatedDrafts.sort((a, b) => 
          (b.draftMetadata.version || 0) - (a.draftMetadata.version || 0)
        );
        
        const draftsToDelete = sortedDrafts.slice(maxDraftVersions);
        
        for (const draft of draftsToDelete) {
          if (draft.id) {
            await deleteDraft(draft.id);
          }
        }
      }
    } catch (err) {
      console.error('Error cleaning up old versions:', err);
    }
  }, [user, maxDraftVersions, courseId, loadAllDrafts, deleteDraft]);

  // Get draft summary info
  const getDraftSummary = useCallback((draft: DraftCourse) => {
    const moduleCount = draft.modules?.length || 0;
    const hasContent = draft.title || draft.instructor || moduleCount > 0;
    const savedDate = new Date(draft.draftMetadata.savedAt);
    const isAutoSaved = draft.draftMetadata.autoSaved;
    
    return {
      moduleCount,
      hasContent,
      savedDate,
      isAutoSaved,
      version: draft.draftMetadata.version || 1,
      formattedDate: savedDate.toLocaleString(),
    };
  }, []);

  // Check if draft exists
  const hasDraft = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    
    const draft = await loadDraft();
    return draft !== null;
  }, [user, loadDraft]);

  // Initialize - load existing drafts
  useEffect(() => {
    if (user) {
      loadAllDrafts();
    }
  }, [user, loadAllDrafts]);

  return {
    // State
    drafts,
    isLoading,
    lastSaved,
    error,
    
    // Actions
    saveDraft,
    loadDraft,
    loadAllDrafts,
    deleteDraft,
    cleanupOldVersions,
    
    // Utilities
    getDraftId,
    getDraftSummary,
    hasDraft,
    
    // Clear error
    clearError: () => setError(null),
  };
};