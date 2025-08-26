'use client';

import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCourse } from '@/hooks/useCourse';
import { useDraftEditor } from '@/hooks/useDraftEditor';
import CourseForm from '@/components/CourseForm';
import { Loader } from 'lucide-react';
import { Editor, EditorState, ContentBlock } from 'draft-js';

// Interface definitions
interface CourseActions {
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleModuleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, index: number) => void;
  addModule: () => void;
  removeModule: (index: number) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  clearThumbnail: () => void;
  saveCourse: () => void;
  deleteCourse: () => void;
}

interface DraftEditorState {
  editorStates: EditorState[];
  editorRefs: React.MutableRefObject<Map<number, Editor | null>>;
  getMediaBlockRenderer: (moduleIndex: number) => (block: ContentBlock) => { component: React.FC<any>; editable: boolean } | null;
  styleMap: Record<string, React.CSSProperties>;
  blockStyleFn: (block: ContentBlock) => string;
  textColors: string[];
  highlightColors: string[];
  textAlignOptions: readonly string[];
  fontFamilies: Array<{ name: string; value: string; preview: string }>;
}

interface DraftEditorActions {
  handleEditorStateChange: (moduleIndex: number, newEditorState: EditorState) => void;
  handleInlineStyleChange: (moduleIndex: number, inlineStyle: string) => void;
  handleBlockTypeChange: (moduleIndex: number, blockType: string) => void;
  handleKeyCommand: (moduleIndex: number, command: string) => 'handled' | 'not-handled';
  handleImageUpload: (moduleIndex: number, file?: File) => void;
  handleVideoUpload: (moduleIndex: number, file?: File) => void;
  handleVideoEmbed: (moduleIndex: number, embedUrl: string, originalUrl: string) => void;
  handleGifUpload: (moduleIndex: number, file?: File) => void;
  handleStickerUpload: (moduleIndex: number, file?: File) => void;
  handleEmojiInsert: (moduleIndex: number, emoji: string) => void;
  handleLinkToggle: (moduleIndex: number) => void;
  handleTextColor: (moduleIndex: number, color: string) => void;
  handleTextHighlight: (moduleIndex: number, color: string) => void;
  handleFontFamily: (moduleIndex: number, fontFamily: string) => void;
  handleTextAlignment: (moduleIndex: number, alignment: string) => void;
  handleColorPicker: (moduleIndex: number, type: 'text' | 'highlight') => void;
  formatText: (moduleIndex: number, format: string) => void;
  clearFormatting: (moduleIndex: number) => void;
  focusEditor: (moduleIndex: number) => void;
  getEditorContent: (moduleIndex: number) => any;
  setEditorContent: (moduleIndex: number, content: any) => void;
  getEditorText: (moduleIndex: number) => string;
  hasInlineStyle: (moduleIndex: number, style: string) => boolean;
  getCurrentBlockType: (moduleIndex: number) => string;
  getCurrentTextAlignment: (moduleIndex: number) => string;
  getCurrentTextColor: (moduleIndex: number) => string | null;
  getCurrentHighlightColor: (moduleIndex: number) => string | null;
  getCurrentFontFamily: (moduleIndex: number) => string | null;
  setEditorRef: (moduleIndex: number, ref: Editor | null) => void;
  isUploading: (moduleIndex: number) => boolean;
  saveToFirebase: (courseId: string) => Promise<void>;
  getEditorState: (moduleIndex: number) => EditorState;
}

export default function CourseManagementPage() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get('id');
  const { user, loading: authLoading } = useAuth();
  
  // Course-related state and handlers
  const {
    formData,
    setFormData,
    errors,
    setErrors,
    thumbnailFile,
    setThumbnailFile,
    saving,
    modal,
    setModal,
    loading: courseLoading,
    isEditing,
    handleInputChange,
    handleModuleInputChange,
    addModule,
    removeModule,
    handleFileChange,
    clearThumbnail,
    saveCourse,
    deleteCourse,
  } = useCourse(user, courseId);
  
  // Draft.js editor state and handlers
  const editorHook = useDraftEditor(formData, setFormData, setModal);
  
  // Local state for form steps
  const [step, setStep] = useState(1);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);

  // Memoized grouped props
  const courseActions: CourseActions = useMemo(() => ({
    handleInputChange,
    handleModuleInputChange,
    addModule,
    removeModule,
    handleFileChange,
    clearThumbnail,
    saveCourse,
    deleteCourse,
  }), [
    handleInputChange,
    handleModuleInputChange,
    addModule,
    removeModule,
    handleFileChange,
    clearThumbnail,
    saveCourse,
    deleteCourse,
  ]);

  const draftEditorState: DraftEditorState = useMemo(() => ({
    editorStates: editorHook.editorStates,
    editorRefs: editorHook.editorRefs,
    getMediaBlockRenderer: editorHook.getMediaBlockRenderer,
    styleMap: editorHook.styleMap,
    blockStyleFn: editorHook.blockStyleFn,
    textColors: editorHook.textColors,
    highlightColors: editorHook.highlightColors,
    textAlignOptions: editorHook.textAlignOptions,
    fontFamilies: editorHook.fontFamilies,
  }), [
    editorHook.editorStates,
    editorHook.editorRefs,
    editorHook.getMediaBlockRenderer,
    editorHook.styleMap,
    editorHook.blockStyleFn,
    editorHook.textColors,
    editorHook.highlightColors,
    editorHook.textAlignOptions,
    editorHook.fontFamilies,
  ]);

  const draftEditorActions: DraftEditorActions = useMemo(() => ({
    handleEditorStateChange: editorHook.handleEditorStateChange,
    handleInlineStyleChange: editorHook.handleInlineStyleChange,
    handleBlockTypeChange: editorHook.handleBlockTypeChange,
    handleKeyCommand: editorHook.handleKeyCommand,
    handleImageUpload: editorHook.handleImageUpload,
    handleVideoUpload: editorHook.handleVideoUpload,
    handleVideoEmbed: editorHook.handleVideoEmbed,
    handleGifUpload: editorHook.handleGifUpload,
    handleStickerUpload: editorHook.handleStickerUpload,
    handleEmojiInsert: editorHook.handleEmojiInsert,
    handleLinkToggle: editorHook.handleLinkToggle,
    handleTextColor: editorHook.handleTextColor,
    handleTextHighlight: editorHook.handleTextHighlight,
    handleFontFamily: editorHook.handleFontFamily,
    handleTextAlignment: editorHook.handleTextAlignment,
    handleColorPicker: editorHook.handleColorPicker,
    formatText: editorHook.formatText,
    clearFormatting: editorHook.clearFormatting,
    focusEditor: editorHook.focusEditor,
    getEditorContent: editorHook.getEditorContent,
    setEditorContent: editorHook.setEditorContent,
    getEditorText: editorHook.getEditorText,
    hasInlineStyle: editorHook.hasInlineStyle,
    getCurrentBlockType: editorHook.getCurrentBlockType,
    getCurrentTextAlignment: editorHook.getCurrentTextAlignment,
    getCurrentTextColor: editorHook.getCurrentTextColor,
    getCurrentHighlightColor: editorHook.getCurrentHighlightColor,
    getCurrentFontFamily: editorHook.getCurrentFontFamily,
    setEditorRef: editorHook.setEditorRef,
    isUploading: editorHook.isUploading,
    saveToFirebase: editorHook.saveToFirebase,
    getEditorState: editorHook.getEditorState,
  }), [editorHook]);

  // Loading state
  const isLoading = authLoading || courseLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-700 dark:text-gray-300">
        <Loader className="animate-spin mr-2" size={24} />
        <span>Loading course data...</span>
      </div>
    );
  }

  // Error state - if user is not authenticated
  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Authentication Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please log in to manage courses.
          </p>
        </div>
      </div>
    );
  }

  // Error state - if courseId is provided but course data failed to load
  if (courseId && !formData.title && !isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Course Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            The course with ID {courseId} could not be found. Please check the ID or create a new course.
          </p>
        </div>
      </div>
    );
  }

  return (
    <CourseForm
      formData={formData}
      setFormData={setFormData}
      errors={errors}
      setErrors={setErrors}
      step={step}
      setStep={setStep}
      currentModuleIndex={currentModuleIndex}
      setCurrentModuleIndex={setCurrentModuleIndex}
      thumbnailFile={thumbnailFile}
      setThumbnailFile={setThumbnailFile}
      saving={saving}
      modal={modal}
      setModal={setModal}
      isEditing={isEditing}
      courseActions={courseActions}
      draftEditorState={draftEditorState}
      draftEditorActions={draftEditorActions}
      user={user} // Add this line
      courseId={courseId}
    />
  );
}