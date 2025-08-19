import { Course, Module } from '../types';
import { RawDraftContentState } from 'draft-js';

// Utility to validate RawDraftContentState
const isValidRawContent = (content: unknown): content is RawDraftContentState => {
  return (
    typeof content === 'object' &&
    content !== null &&
    'blocks' in content &&
    Array.isArray((content as any).blocks) &&
    'entityMap' in content &&
    typeof (content as any).entityMap === 'object'
  );
};

export const validateForm = (formData: Course): Record<string, string> => {
  const errors: Record<string, string> = {};

  // Validate course-level fields
  if (!formData.title?.trim()) {
    errors.title = 'Course title is required';
  }
  if (!formData.instructor?.trim()) {
    errors.instructor = 'Instructor name is required';
  }
  if (formData.description && formData.description.length > 1000) {
    errors.description = 'Description cannot exceed 1000 characters';
  }

  // Validate modules array
  if (!Array.isArray(formData.modules)) {
    errors.modules = 'Modules must be an array';
    console.error('Invalid modules:', formData.modules);
    return errors;
  }

  // Validate each module
  formData.modules.forEach((module: Module, index: number) => {
    if (!module.title?.trim()) {
      errors[`module_${index}_title`] = `Module ${index + 1} title is required`;
    }
    // Validate module content
    if (module.content && !isValidRawContent(module.content)) {
      errors[`module_${index}_content`] = `Module ${index + 1} content is invalid or corrupted`;
      console.warn(`Invalid content for module ${index}:`, module.content);
    }
    // Optionally: Ensure content is not empty
    if (module.content && isValidRawContent(module.content) && module.content.blocks.length === 0) {
      errors[`module_${index}_content_empty`] = `Module ${index + 1} content cannot be empty`;
    }
  });

  // Log errors for debugging
  if (Object.keys(errors).length > 0) {
    console.warn('Form validation errors:', errors);
  }

  return errors;
};