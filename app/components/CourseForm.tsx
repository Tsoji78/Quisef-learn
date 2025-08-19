import React, { useState, useCallback, useMemo } from 'react';
import { Save, X, Loader, Trash2 } from 'lucide-react';
import Link from 'next/link';
import ModuleList from './ModulesList';
import DraftEditor from './DraftEditor';
import ThumbnailUploader from './ThumbnailUploader';
import ProgressBar from './ProgressBar';
import FeedbackModal from './FeedbackModal';
import DeleteModal from './DeleteModal';
import { Course, ModalState } from '../types';
import { Editor, EditorState, ContentBlock, RawDraftContentState } from 'draft-js';

interface ValidationErrors {
  [key: string]: string;
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
  handleTextAlignment: (moduleIndex: number, alignment: string) => void;
  handleColorPicker: (moduleIndex: number, type: 'text' | 'highlight') => void;
  formatText: (moduleIndex: number, format: string) => void;
  clearFormatting: (moduleIndex: number) => void;
  focusEditor: (moduleIndex: number) => void;
  getEditorContent: (moduleIndex: number) => RawDraftContentState | null;
  setEditorContent: (moduleIndex: number, content: RawDraftContentState) => void;
  getEditorText: (moduleIndex: number) => string;
  hasInlineStyle: (moduleIndex: number, style: string) => boolean;
  getCurrentBlockType: (moduleIndex: number) => string;
  getCurrentTextAlignment: (moduleIndex: number) => string;
  getCurrentTextColor: (moduleIndex: number) => string | null;
  getCurrentHighlightColor: (moduleIndex: number) => string | null;
  setEditorRef: (moduleIndex: number, ref: Editor | null) => void;
  isUploading: (moduleIndex: number) => boolean;
  getEditorState: (moduleIndex: number) => EditorState;
}

interface DraftEditorState {
  editorStates: EditorState[];
  editorRefs: React.MutableRefObject<Map<number, Editor | null>>;
  getMediaBlockRenderer: (moduleIndex: number) => (block: ContentBlock) => { component: React.FC<any>; editable: boolean } | null;
  styleMap: { [key: string]: React.CSSProperties };
  blockStyleFn: (block: ContentBlock) => string;
  textColors: string[];
  highlightColors: string[];
  textAlignOptions: readonly string[];
}

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

interface CourseFormProps {
  formData: Course;
  setFormData: (data: Course | ((prev: Course) => Course)) => void;
  errors: ValidationErrors;
  setErrors: (errors: ValidationErrors) => void;
  step: number;
  setStep: (step: number) => void;
  currentModuleIndex: number;
  setCurrentModuleIndex: (index: number) => void;
  thumbnailFile: File | null;
  setThumbnailFile: (file: File | null) => void;
  saving: boolean;
  modal: ModalState;
  setModal: (modal: ModalState) => void;
  isEditing: boolean;
  courseActions: CourseActions;
  draftEditorState: DraftEditorState;
  draftEditorActions: DraftEditorActions;
}

// Memoized sub-components
const BasicInfoSection = React.memo(({ 
  formData, 
  errors, 
  isEditing, 
  handleInputChange 
}: {
  formData: Course;
  errors: ValidationErrors;
  isEditing: boolean;
  handleInputChange: CourseActions['handleInputChange'];
}) => (
  <div className="space-y-6">
    <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded-lg mb-6">
      <p className="text-sm text-blue-700 dark:text-blue-200">
        {isEditing ? 'Edit the basic course information.' : 'Start by adding the basic course information.'} Fields marked with * are required.
      </p>
    </div>
    
    <div>
      <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Course Title*
      </label>
      <input
        type="text"
        id="title"
        name="title"
        value={formData.title}
        onChange={handleInputChange}
        required
        aria-describedby={errors.title ? 'title-error' : undefined}
        className={`mt-1 block w-full px-3 py-2 border ${
          errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
        } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white`}
      />
      {errors.title && (
        <p id="title-error" className="mt-1 text-sm text-red-500">{errors.title}</p>
      )}
    </div>
    
    <div>
      <label htmlFor="instructor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Instructor*
      </label>
      <input
        type="text"
        id="instructor"
        name="instructor"
        value={formData.instructor}
        onChange={handleInputChange}
        required
        aria-describedby={errors.instructor ? 'instructor-error' : undefined}
        className={`mt-1 block w-full px-3 py-2 border ${
          errors.instructor ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
        } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white`}
      />
      {errors.instructor && (
        <p id="instructor-error" className="mt-1 text-sm text-red-500">{errors.instructor}</p>
      )}
    </div>
  </div>
));

BasicInfoSection.displayName = 'BasicInfoSection';

const ModuleEditor = React.memo(({ 
  formData,
  setFormData,
  currentModuleIndex,
  errors,
  handleModuleInputChange,
  editorState,
  editorRefs,
  draftEditorState,
  draftEditorActions,
  modal,
  setModal,
}: {
  formData: Course;
  setFormData: (data: Course | ((prev: Course) => Course)) => void;
  currentModuleIndex: number;
  errors: ValidationErrors;
  handleModuleInputChange: CourseActions['handleModuleInputChange'];
  editorState: EditorState | null;
  editorRefs: React.MutableRefObject<Map<number, Editor | null>>;
  draftEditorState: DraftEditorState;
  draftEditorActions: DraftEditorActions;
  modal: ModalState;
  setModal: (modal: ModalState) => void;
}) => {
  const currentModule = formData.modules[currentModuleIndex];
  if (!currentModule) return null;

  return (
    <div className="space-y-4">
      <div>
        <label 
          htmlFor={`module-title-${currentModuleIndex}`} 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Module Title*
        </label>
        <input
          type="text"
          id={`module-title-${currentModuleIndex}`}
          value={currentModule.title || ''}
          onChange={(e) => handleModuleInputChange(e, currentModuleIndex)}
          name="title"
          placeholder="Enter module title..."
          aria-describedby={errors[`module_${currentModuleIndex}_title`] ? `module-title-error-${currentModuleIndex}` : undefined}
          className={`w-full px-3 py-2 border ${
            errors[`module_${currentModuleIndex}_title`] 
              ? 'border-red-500' 
              : 'border-gray-300 dark:border-gray-600'
          } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white`}
        />
        {errors[`module_${currentModuleIndex}_title`] && (
          <p id={`module-title-error-${currentModuleIndex}`} className="mt-1 text-sm text-red-500">
            {errors[`module_${currentModuleIndex}_title`]}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Module Content*
        </label>
        {editorState ? (
          <DraftEditor
            moduleIndex={currentModuleIndex}
            module={currentModule}
            editorHook={{
              editorStates: draftEditorState.editorStates,
              getMediaBlockRenderer: draftEditorState.getMediaBlockRenderer,
              styleMap: draftEditorState.styleMap,
              blockStyleFn: draftEditorState.blockStyleFn,
              textColors: draftEditorState.textColors,
              highlightColors: draftEditorState.highlightColors,
              textAlignOptions: draftEditorState.textAlignOptions,
              handleEditorStateChange: draftEditorActions.handleEditorStateChange,
              getEditorState: draftEditorActions.getEditorState,
              setEditorRef: draftEditorActions.setEditorRef,
              handleImageUpload: draftEditorActions.handleImageUpload,
              handleVideoUpload: draftEditorActions.handleVideoUpload,
              handleVideoEmbed: draftEditorActions.handleVideoEmbed,
              handleGifUpload: draftEditorActions.handleGifUpload,
              handleStickerUpload: draftEditorActions.handleStickerUpload,
              handleEmojiInsert: draftEditorActions.handleEmojiInsert,
              handleLinkToggle: draftEditorActions.handleLinkToggle,
              handleTextColor: draftEditorActions.handleTextColor,
              handleTextHighlight: draftEditorActions.handleTextHighlight,
              handleTextAlignment: draftEditorActions.handleTextAlignment,
              handleColorPicker: draftEditorActions.handleColorPicker,
              formatText: draftEditorActions.formatText,
              clearFormatting: draftEditorActions.clearFormatting,
              focusEditor: draftEditorActions.focusEditor,
              hasInlineStyle: draftEditorActions.hasInlineStyle,
              getCurrentBlockType: draftEditorActions.getCurrentBlockType,
              getCurrentTextAlignment: draftEditorActions.getCurrentTextAlignment,
              getCurrentTextColor: draftEditorActions.getCurrentTextColor,
              getCurrentHighlightColor: draftEditorActions.getCurrentHighlightColor,
              isUploading: draftEditorActions.isUploading,
            }}
            formData={formData}
            setFormData={setFormData}
            setModal={setModal}
          />
        ) : (
          <p className="text-red-500">Editor not initialized</p>
        )}
        {errors[`module_${currentModuleIndex}_content`] && (
          <p className="mt-1 text-sm text-red-500">
            {errors[`module_${currentModuleIndex}_content`]}
          </p>
        )}
      </div>

      <div className="flex gap-2 pt-4">
        <button
          type="button"
          onClick={() => draftEditorActions.focusEditor(currentModuleIndex)}
          className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          aria-label="Focus editor"
        >
          Focus Editor
        </button>
        <button
          type="button"
          onClick={() => draftEditorActions.handleImageUpload(currentModuleIndex)}
          className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
          aria-label="Add image"
        >
          Add Image
        </button>
        <button
          type="button"
          onClick={() => draftEditorActions.handleVideoUpload(currentModuleIndex)}
          className="text-sm px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
          aria-label="Add video"
        >
          Add Video
        </button>
      </div>
    </div>
  );
});

ModuleEditor.displayName = 'ModuleEditor';

const ModulesSection = React.memo(({ 
  formData,
  setFormData,
  currentModuleIndex,
  setCurrentModuleIndex,
  addModule,
  removeModule,
  errors,
  isEditing,
  handleModuleInputChange,
  editorStates,
  editorRefs,
  draftEditorState,
  draftEditorActions,
  modal,
  setModal,
}: {
  formData: Course;
  setFormData: (data: Course | ((prev: Course) => Course)) => void;
  currentModuleIndex: number;
  setCurrentModuleIndex: (index: number) => void;
  addModule: () => void;
  removeModule: (index: number) => void;
  errors: ValidationErrors;
  isEditing: boolean;
  handleModuleInputChange: CourseActions['handleModuleInputChange'];
  editorStates: EditorState[];
  editorRefs: React.MutableRefObject<Map<number, Editor | null>>;
  draftEditorState: DraftEditorState;
  draftEditorActions: DraftEditorActions;
  modal: ModalState;
  setModal: (modal: ModalState) => void;
}) => (
  <div className="space-y-6">
    <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded-lg mb-6">
      <p className="text-sm text-blue-700 dark:text-blue-200">
        {isEditing ? 'Edit or add modules to your course.' : 'Add modules to your course.'} Each module should have a title and content. Use the editor toolbar to format text and insert multiple images or videos inline.
      </p>
    </div>
    
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="lg:w-1/3">
        <ModuleList
          formData={formData}
          currentModuleIndex={currentModuleIndex}
          setCurrentModuleIndex={setCurrentModuleIndex}
          addModule={addModule}
          removeModule={removeModule}
        />
      </div>
      
      <div className="lg:w-2/3">
        {formData.modules.length > 0 && currentModuleIndex < formData.modules.length ? (
          <ModuleEditor
            formData={formData}
            setFormData={setFormData}
            currentModuleIndex={currentModuleIndex}
            errors={errors}
            handleModuleInputChange={handleModuleInputChange}
            editorState={editorStates[currentModuleIndex]}
            editorRefs={editorRefs}
            draftEditorState={draftEditorState}
            draftEditorActions={draftEditorActions}
            modal={modal}
            setModal={setModal}
          />
        ) : (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No modules yet. Add your first module to get started.
            </p>
            <button
              onClick={addModule}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
              aria-label="Add first module"
            >
              Add First Module
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
));

ModulesSection.displayName = 'ModulesSection';

const DetailsSection = React.memo(({ 
  formData, 
  errors, 
  isEditing, 
  handleInputChange,
  handleFileChange,
  clearThumbnail,
  thumbnailFile,
}: {
  formData: Course;
  errors: ValidationErrors;
  isEditing: boolean;
  handleInputChange: CourseActions['handleInputChange'];
  handleFileChange: CourseActions['handleFileChange'];
  clearThumbnail: CourseActions['clearThumbnail'];
  thumbnailFile: File | null;
}) => (
  <div className="space-y-6">
    <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded-lg mb-6">
      <p className="text-sm text-blue-700 dark:text-blue-200">
        {isEditing ? 'Edit additional details about your course.' : 'Add additional details about your course.'}
      </p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label htmlFor="level" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Level
        </label>
        <select
          id="level"
          name="level"
          value={formData.level}
          onChange={handleInputChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>
      </div>
      
      <div>
        <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Duration
        </label>
        <input
          type="text"
          id="duration"
          name="duration"
          value={formData.duration}
          onChange={handleInputChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          placeholder="e.g., 6 weeks"
        />
      </div>
    </div>

    <ThumbnailUploader
      formData={formData}
      errors={errors}
      handleFileChange={handleFileChange}
      clearThumbnail={clearThumbnail}
      thumbnailFile={thumbnailFile}
    />
  </div>
));

DetailsSection.displayName = 'DetailsSection';

export default function CourseForm({
  formData,
  setFormData,
  errors,
  setErrors,
  step,
  setStep,
  currentModuleIndex,
  setCurrentModuleIndex,
  thumbnailFile,
  setThumbnailFile,
  saving,
  modal,
  setModal,
  isEditing,
  courseActions,
  draftEditorState,
  draftEditorActions,
}: CourseFormProps) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const validateStep1 = useCallback(() => {
    const newErrors: ValidationErrors = {};
    if (!formData.title) newErrors.title = 'Course title is required';
    if (!formData.instructor) newErrors.instructor = 'Instructor name is required';
    return newErrors;
  }, [formData.title, formData.instructor]);

  const validateStep2 = useCallback(() => {
    const moduleErrors: ValidationErrors = {};
    formData.modules.forEach((module, index) => {
      if (!module.title) {
        moduleErrors[`module_${index}_title`] = `Module ${index + 1} title is required`;
      }
      if (!draftEditorState.editorStates[index]) {
        moduleErrors[`module_${index}_content`] = `Module ${index + 1} editor not initialized`;
      } else {
        const moduleText = draftEditorActions.getEditorText(index);
        if (!moduleText || moduleText.trim().length === 0) {
          moduleErrors[`module_${index}_content`] = `Module ${index + 1} content is required`;
        }
      }
    });
    return moduleErrors;
  }, [formData.modules, draftEditorState.editorStates, draftEditorActions]);

  const goToNextStep = useCallback(() => {
    let validationErrors: ValidationErrors = {};
    
    if (step === 1) {
      validationErrors = validateStep1();
    } else if (step === 2) {
      validationErrors = validateStep2();
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors({ ...errors, ...validationErrors });
      return;
    }

    setStep(step + 1);
  }, [step, validateStep1, validateStep2, errors, setErrors, setStep]);

  const goToPreviousStep = useCallback(() => {
    setStep(step - 1);
  }, [step, setStep]);

  const hasErrors = useMemo(() => Object.keys(errors).length > 0, [errors]);
  const errorMessages = useMemo(() => Object.values(errors).filter(error => error), [errors]);

  const navigationButtons = useMemo(() => (
    <div className="flex justify-between pt-6 border-t mt-8">
      <div>
        {step > 1 && (
          <button
            onClick={goToPreviousStep}
            disabled={saving}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50"
            aria-label="Go to previous step"
          >
            Previous
          </button>
        )}
      </div>
      <div className="flex gap-3">
        <Link href="/modules">
          <button
            disabled={saving}
            className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50"
            aria-label="Cancel and return to modules list"
          >
            Cancel
          </button>
        </Link>
        {step < 3 ? (
          <button
            onClick={goToNextStep}
            disabled={saving}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded transition-colors disabled:opacity-50"
            aria-label="Go to next step"
          >
            Next
          </button>
        ) : (
          <button
            onClick={courseActions.saveCourse}
            disabled={saving}
            className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded transition-colors disabled:opacity-50"
            aria-label={isEditing ? 'Update course' : 'Save course'}
          >
            {saving ? (
              <>
                <Loader size={18} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={18} />
                <span>{isEditing ? 'Update Course' : 'Save Course'}</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  ), [step, saving, goToPreviousStep, goToNextStep, courseActions.saveCourse, isEditing]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          {isEditing ? 'Edit Course' : 'Add New Course'}
        </h1>
        <div className="flex space-x-4">
          {isEditing && (
            <button
              onClick={() => setDeleteModalOpen(true)}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              aria-label="Delete course"
            >
              <Trash2 size={18} />
              <span>Delete Course</span>
            </button>
          )}
          <Link href="/modules">
            <button className="flex items-center space-x-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors" aria-label="Back to modules list">
              <X size={18} />
              <span>Back to List</span>
            </button>
          </Link>
        </div>
      </div>

      {errors.general && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          {errors.general}
        </div>
      )}

      <ProgressBar step={step} />

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        {hasErrors && !errors.general && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6" role="alert">
            <h3 className="text-red-800 dark:text-red-300 font-medium">Please fix the following errors:</h3>
            <ul className="list-disc ml-5 mt-2">
              {errorMessages.map((error, index) => (
                <li key={index} className="text-red-700 dark:text-red-400 text-sm">{error}</li>
              ))}
            </ul>
          </div>
        )}

        {step === 1 && (
          <BasicInfoSection
            formData={formData}
            errors={errors}
            isEditing={isEditing}
            handleInputChange={courseActions.handleInputChange}
          />
        )}
        
        {step === 2 && (
          <ModulesSection
            formData={formData}
            setFormData={setFormData}
            currentModuleIndex={currentModuleIndex}
            setCurrentModuleIndex={setCurrentModuleIndex}
            addModule={courseActions.addModule}
            removeModule={courseActions.removeModule}
            errors={errors}
            isEditing={isEditing}
            handleModuleInputChange={courseActions.handleModuleInputChange}
            editorStates={draftEditorState.editorStates}
            editorRefs={draftEditorState.editorRefs}
            draftEditorState={draftEditorState}
            draftEditorActions={draftEditorActions}
            modal={modal}
            setModal={setModal}
          />
        )}
        
        {step === 3 && (
          <DetailsSection
            formData={formData}
            errors={errors}
            isEditing={isEditing}
            handleInputChange={courseActions.handleInputChange}
            handleFileChange={courseActions.handleFileChange}
            clearThumbnail={courseActions.clearThumbnail}
            thumbnailFile={thumbnailFile}
          />
        )}

        {navigationButtons}
      </div>

      <FeedbackModal
        modal={modal}
        onClose={() => setModal({ isOpen: false, status: null, message: '' })}
        isEditing={isEditing}
      />

      {deleteModalOpen && (
        <DeleteModal
          title={formData.title}
          onConfirm={() => {
            courseActions.deleteCourse();
            setDeleteModalOpen(false);
          }}
          onCancel={() => setDeleteModalOpen(false)}
        />
      )}
    </div>
  );
}