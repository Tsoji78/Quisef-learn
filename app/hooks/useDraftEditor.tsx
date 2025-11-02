import React, { useEffect, useRef, useCallback, useMemo, useReducer } from 'react';
import {
  Editor,
  EditorState,
  RichUtils,
  AtomicBlockUtils,
  convertFromRaw,
  convertToRaw,
  ContentState,
  ContentBlock,
  convertFromHTML,
  RawDraftContentState,
  DraftHandleValue,
  Modifier,
  SelectionState,
} from 'draft-js';
import { Course, ModalState } from '@/types';
import { uploadToCloudinary } from '@/utils/cloudinary';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AdjustableMediaComponent } from '@/components/AdjustableMediaComponent';

// Media limits aligned with Cloudinary
const MEDIA_LIMITS = {
  image: {
    maxSize: 5 * 1024 * 1024, // 5MB
    accept: 'image/jpeg,image/png,image/webp',
  },
  video: {
    maxSize: 10 * 1024 * 1024, // 10MB
    accept: 'video/mp4,video/webm,video/quicktime,video/x-msvideo',
  },
  gif: {
    maxSize: 5 * 1024 * 1024, // 5MB
    accept: 'image/gif',
  },
  sticker: {
    maxSize: 5 * 1024 * 1024, // 5MB
    accept: 'image/png,image/webp,image/svg+xml',
  },
} as const;

const TEXT_COLORS = [
  '#000000', '#333333', '#666666', '#999999', '#ffffff',
  '#ff0000', '#ff6b6b', '#ffa500', '#ffff00', '#00ff00',
  '#00ffff', '#0080ff', '#8000ff', '#ff00ff',
];

const HIGHLIGHT_COLORS = [
  '#ffff00', '#ffb3ba', '#bae1ff', '#baffc9', '#ffffba',
  '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
];

const TEXT_ALIGN_OPTIONS = ['left', 'center', 'right', 'justify'] as const;

// Font families from FontStylePicker
const FONT_FAMILIES = [
  { name: 'Default', value: '', preview: 'Default font' },
  { name: 'Arial', value: 'Arial, sans-serif', preview: 'Clean and modern' },
  { name: 'Helvetica', value: 'Helvetica, Arial, sans-serif', preview: 'Professional look' },
  { name: 'Georgia', value: 'Georgia, serif', preview: 'Elegant serif' },
  { name: 'Times New Roman', value: 'Times New Roman, serif', preview: 'Classic serif' },
  { name: 'Courier New', value: 'Courier New, monospace', preview: 'Monospace font' },
  { name: 'Verdana', value: 'Verdana, sans-serif', preview: 'High readability' },
  { name: 'Trebuchet MS', value: 'Trebuchet MS, sans-serif', preview: 'Friendly appearance' },
  { name: 'Impact', value: 'Impact, sans-serif', preview: 'Bold and strong' },
  { name: 'Comic Sans MS', value: 'Comic Sans MS, cursive', preview: 'Casual and fun' },
  { name: 'Palatino', value: 'Palatino, serif', preview: 'Refined elegance' },
  { name: 'Garamond', value: 'Garamond, serif', preview: 'Literary classic' },
  { name: 'Roboto', value: 'Roboto, sans-serif', preview: 'Modern Google font' },
  { name: 'Open Sans', value: 'Open Sans, sans-serif', preview: 'Friendly humanist' },
  { name: 'Lato', value: 'Lato, sans-serif', preview: 'Semi-rounded details' },
  { name: 'Montserrat', value: 'Montserrat, sans-serif', preview: 'Urban inspired' },
  { name: 'Playfair Display', value: 'Playfair Display, serif', preview: 'High contrast serif' },
  { name: 'Source Sans Pro', value: 'Source Sans Pro, sans-serif', preview: 'Adobe creation' },
];

interface EditorStatesState {
  states: Map<number, EditorState>;
  uploading: Map<number, boolean>;
}

type EditorStatesAction =
  | { type: 'SET_EDITOR_STATE'; moduleIndex: number; editorState: EditorState }
  | { type: 'SET_UPLOADING'; moduleIndex: number; uploading: boolean }
  | { type: 'INITIALIZE_STATES'; states: Map<number, EditorState> }
  | { type: 'CLEANUP_REMOVED'; validIndices: number[] };

const editorStatesReducer = (
  state: EditorStatesState,
  action: EditorStatesAction
): EditorStatesState => {
  switch (action.type) {
    case 'SET_EDITOR_STATE':
      return {
        ...state,
        states: new Map(state.states).set(action.moduleIndex, action.editorState),
      };
    case 'SET_UPLOADING':
      return {
        ...state,
        uploading: new Map(state.uploading).set(action.moduleIndex, action.uploading),
      };
    case 'INITIALIZE_STATES':
      return {
        ...state,
        states: new Map(action.states),
      };
    case 'CLEANUP_REMOVED':
      const newStates = new Map(state.states);
      const newUploading = new Map(state.uploading);
      newStates.forEach((_, index) => {
        if (!action.validIndices.includes(index)) {
          newStates.delete(index);
          newUploading.delete(index);
        }
      });
      return {
        states: newStates,
        uploading: newUploading,
      };
    default:
      return state;
  }
};

const colorStyleMap: Record<string, React.CSSProperties> = {};
TEXT_COLORS.forEach((color) => {
  const colorKey = color.replace('#', '').toUpperCase();
  colorStyleMap[`TEXT_COLOR_${colorKey}`] = { color };
});

HIGHLIGHT_COLORS.forEach((color) => {
  const colorKey = color.replace('#', '').toUpperCase();
  colorStyleMap[`HIGHLIGHT_${colorKey}`] = {
    backgroundColor: color,
    padding: '2px 4px',
    borderRadius: '3px',
  };
});

// Add font family styles
const fontStyleMap: Record<string, React.CSSProperties> = {};
FONT_FAMILIES.forEach((font) => {
  if (font.value) {
    const fontKey = font.name.replace(/\s+/g, '_').toUpperCase();
    fontStyleMap[`FONT_FAMILY_${fontKey}`] = { fontFamily: font.value };
  }
});

const styleMap = {
  ...colorStyleMap,
  ...fontStyleMap,
  BOLD: { fontWeight: 'bold' },
  ITALIC: { fontStyle: 'italic' },
  UNDERLINE: { textDecoration: 'underline' },
};

const blockStyleFn = (block: ContentBlock): string => {
  const blockData = block.getData();
  const textAlign = blockData.get('textAlign');
  return textAlign ? `text-align-${textAlign}` : '';
};

const createEditorStateFromContent = (content: unknown): EditorState => {
  if (!content) return EditorState.createEmpty();
  try {
    if (isValidRawContent(content)) {
      return EditorState.createWithContent(convertFromRaw(content));
    }
    if (typeof content === 'string' && content.trim()) {
      const blocksFromHTML = convertFromHTML(content);
      const contentState = ContentState.createFromBlockArray(
        blocksFromHTML.contentBlocks,
        blocksFromHTML.entityMap
      );
      return EditorState.createWithContent(contentState);
    }
  } catch (error) {
    console.warn('Failed to convert content:', error);
  }
  return EditorState.createEmpty();
};

const isValidRawContent = (content: unknown): content is RawDraftContentState => {
  return typeof content === 'object' && content !== null && 'blocks' in content && Array.isArray((content as any).blocks);
};

const calculateResponsiveDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number = 800,
  maxHeight: number = 600
): { width: number; height: number } => {
  const aspectRatio = originalWidth / originalHeight;
  let width = originalWidth;
  let height = originalHeight;
  if (width > maxWidth) {
    width = maxWidth;
    height = width / aspectRatio;
  }
  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }
  return { width: Math.round(width), height: Math.round(height) };
};

export const useDraftEditor = (
  formData: Course,
  setFormData: (data: Course | ((prev: Course) => Course)) => void,
  setModal: (modal: ModalState) => void
) => {
  const [{ states: editorStatesMap, uploading: isUploading }, dispatch] = useReducer(
    editorStatesReducer,
    {
      states: new Map(),
      uploading: new Map(),
    }
  );

  const editorRefs = useRef<Map<number, Editor | null>>(new Map());
  const contentHashRef = useRef<Map<number, string>>(new Map());

  const modules = useMemo(() => Array.isArray(formData.modules) ? formData.modules : [], [formData.modules]);

  const hasModuleContentChanged = useCallback(
    (moduleIndex: number, moduleContent: any, currentHash: string | undefined) => {
      const newHash = JSON.stringify(moduleContent);
      return newHash !== currentHash;
    },
    []
  );

  useEffect(() => {
    console.log('useEffect in useDraftEditor running', { modulesLength: modules.length });
    const newStatesMap = new Map<number, EditorState>();
    const validIndices: number[] = [];

    modules.forEach((module, index) => {
      validIndices.push(index);
      const currentHash = contentHashRef.current.get(index);
      const shouldUpdate = !editorStatesMap.has(index) || hasModuleContentChanged(index, module.content, currentHash);

      if (shouldUpdate) {
        newStatesMap.set(index, createEditorStateFromContent(module.content));
        contentHashRef.current.set(index, JSON.stringify(module.content));
      } else {
        newStatesMap.set(index, editorStatesMap.get(index) || EditorState.createEmpty());
      }
    });

    if (
      newStatesMap.size !== editorStatesMap.size ||
      Array.from(newStatesMap.keys()).some(
        (index) => newStatesMap.get(index) !== editorStatesMap.get(index)
      )
    ) {
      dispatch({ type: 'INITIALIZE_STATES', states: newStatesMap });
    }

    dispatch({ type: 'CLEANUP_REMOVED', validIndices });
  }, [modules, hasModuleContentChanged]);

  const getEditorState = useCallback((moduleIndex: number): EditorState => {
    return editorStatesMap.get(moduleIndex) || EditorState.createEmpty();
  }, [editorStatesMap]);

  const handleEditorStateChange = useCallback(
    (moduleIndex: number, newEditorState: EditorState) => {
      console.log('handleEditorStateChange called', { moduleIndex });
      dispatch({ type: 'SET_EDITOR_STATE', moduleIndex, editorState: newEditorState });
      const newRawContent = convertToRaw(newEditorState.getCurrentContent());
      const currentHash = contentHashRef.current.get(moduleIndex);
      const newHash = JSON.stringify(newRawContent);

      if (newHash !== currentHash) {
        contentHashRef.current.set(moduleIndex, newHash);
        setFormData((prevFormData) => {
          if (!Array.isArray(prevFormData.modules)) return prevFormData;
          const updatedModules = [...prevFormData.modules];
          if (updatedModules[moduleIndex]) {
            updatedModules[moduleIndex] = {
              ...updatedModules[moduleIndex],
              content: newRawContent,
            };
          }
          return { ...prevFormData, modules: updatedModules };
        });
      }
    },
    [setFormData]
  );

  const handleMediaUpdate = useCallback(
    (moduleIndex: number, blockKey: string, newEntityData: any) => {
      const editorState = getEditorState(moduleIndex);
      const contentState = editorState.getCurrentContent();
      const block = contentState.getBlockForKey(blockKey);
      
      if (block) {
        const entityKey = block.getEntityAt(0);
        if (entityKey) {
          const updatedEntityData = {
            ...contentState.getEntity(entityKey).getData(),
            ...newEntityData,
          };
          const newContentState = contentState.replaceEntityData(entityKey, updatedEntityData);
          const newEditorState = EditorState.set(editorState, { currentContent: newContentState });
          handleEditorStateChange(moduleIndex, newEditorState);
        }
      }
    },
    [getEditorState, handleEditorStateChange]
  );

  const handleMediaRemove = useCallback(
    (moduleIndex: number, blockKey: string) => {
      const editorState = getEditorState(moduleIndex);
      const contentState = editorState.getCurrentContent();
      const block = contentState.getBlockForKey(blockKey);
      
      if (block) {
        const blockMap = contentState.getBlockMap();
        const newBlockMap = blockMap.remove(blockKey);
        const newContentState = contentState.set('blockMap', newBlockMap) as ContentState;
        const newEditorState = EditorState.push(editorState, newContentState, 'remove-range');
        handleEditorStateChange(moduleIndex, newEditorState);
      }
    },
    [getEditorState, handleEditorStateChange]
  );

  const createMediaBlockRenderer = useCallback(
    (moduleIndex: number) => (block: ContentBlock) => {
      if (block.getType() === 'atomic') {
        return {
          component: (props: any) => (
            <AdjustableMediaComponent
              {...props}
              blockProps={{
                ...props.blockProps,
                onUpdate: (blockKey: string, newEntityData: any) => 
                  handleMediaUpdate(moduleIndex, blockKey, newEntityData),
                onRemove: (blockKey: string) => 
                  handleMediaRemove(moduleIndex, blockKey),
                editorState: getEditorState(moduleIndex),
                onChange: (newState: EditorState) => 
                  handleEditorStateChange(moduleIndex, newState),
              }}
            />
          ),
          editable: false,
        };
      }
      return null;
    },
    [handleMediaUpdate, handleMediaRemove, getEditorState, handleEditorStateChange]
  );

  const createMediaUploadHandler = useCallback(
    (mediaType: 'image' | 'video' | 'gif' | 'sticker') => async (moduleIndex: number, file?: File) => {
      const config = MEDIA_LIMITS[mediaType];
      const entityType = mediaType.toUpperCase();

      if (!file) {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', config.accept);
        input.onchange = async () => {
          const selectedFile = input.files?.[0];
          if (selectedFile) {
            await createMediaUploadHandler(mediaType)(moduleIndex, selectedFile);
          }
        };
        input.click();
        return;
      }

      console.log('File details:', {
        name: file.name,
        type: file.type,
        size: file.size,
        mediaType,
        acceptedTypes: config.accept
      });

      // Size validation
      if (file.size > config.maxSize) {
        setModal({
          isOpen: true,
          status: 'error',
          message: `${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} size must be less than ${config.maxSize / (1024 * 1024)}MB`,
        });
        return;
      }

      // Enhanced file type validation
      const isValidFileType = () => {
        const fileName = file.name.toLowerCase();
        
        // Check by media type category with both MIME type and extension fallback
        if (mediaType === 'image') {
          return file.type.startsWith('image/') && !file.type.includes('gif') || 
                 /\.(jpg|jpeg|png|webp)$/i.test(fileName);
        }
        
        if (mediaType === 'video') {
          return file.type.startsWith('video/') || 
                 /\.(mp4|webm|mov|avi)$/i.test(fileName);
        }
        
        if (mediaType === 'gif') {
          return file.type === 'image/gif' || fileName.endsWith('.gif');
        }
        
        if (mediaType === 'sticker') {
          return ['image/png', 'image/webp', 'image/svg+xml'].includes(file.type) ||
                 /\.(png|webp|svg)$/i.test(fileName);
        }
        
        return false;
      };

      if (!isValidFileType()) {
        console.error('Invalid file type:', file.type, 'for', mediaType);
        setModal({
          isOpen: true,
          status: 'error',
          message: `Invalid file type: ${file.type}. Please select a valid ${mediaType} file.`,
        });
        return;
      }

      try {
        dispatch({ type: 'SET_UPLOADING', moduleIndex, uploading: true });
        setModal({ 
          isOpen: true, 
          status: 'uploading', 
          message: `Uploading ${mediaType}... (${(file.size / (1024 * 1024)).toFixed(1)}MB)` 
        });

        // Correct resource type mapping
        const cloudinaryType = (mediaType === 'gif' || mediaType === 'sticker') ? 'image' : mediaType;
        console.log('Uploading to Cloudinary as:', cloudinaryType);
        
        const url = await uploadToCloudinary(file, cloudinaryType);
        console.log('Upload successful:', url);

        let dimensions = { width: 400, height: 300 };
        
        if (mediaType === 'image' || mediaType === 'gif' || mediaType === 'sticker') {
          dimensions = await new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
              const { width, height } = calculateResponsiveDimensions(img.width, img.height);
              resolve({ width, height });
            };
            img.onerror = () => {
              console.warn('Failed to load image dimensions');
              resolve({ width: 400, height: 300 });
            };
            img.src = url;
          });
        } else if (mediaType === 'video') {
          // Try to get video dimensions, but don't fail if we can't
          try {
            dimensions = await new Promise((resolve, reject) => {
              const video = document.createElement('video');
              const timeout = setTimeout(() => {
                console.warn('Video dimension detection timeout');
                resolve({ width: 400, height: 225 });
              }, 3000);
              
              video.onloadedmetadata = () => {
                clearTimeout(timeout);
                if (video.videoWidth && video.videoHeight) {
                  const { width, height } = calculateResponsiveDimensions(
                    video.videoWidth, 
                    video.videoHeight
                  );
                  resolve({ width, height });
                } else {
                  resolve({ width: 400, height: 225 });
                }
              };
              
              video.onerror = () => {
                clearTimeout(timeout);
                console.warn('Could not load video metadata');
                resolve({ width: 400, height: 225 });
              };
              
              video.src = url;
            });
          } catch (error) {
            console.warn('Error getting video dimensions:', error);
            dimensions = { width: 400, height: 225 };
          }
        }

        const currentState = getEditorState(moduleIndex);
        const contentState = currentState.getCurrentContent();
        const contentStateWithEntity = contentState.createEntity(
          entityType,
          'IMMUTABLE',
          {
            src: url,
            type: entityType,
            title: file.name,
            alt: file.name,
            width: dimensions.width,
            height: dimensions.height,
            resizable: true,
            adjustable: true,
            responsive: true,
            uploadedAt: new Date().toISOString(),
            originalFileSize: file.size,
            mimeType: file.type,
          }
        );

        const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
        const newEditorState = AtomicBlockUtils.insertAtomicBlock(
          EditorState.set(currentState, { currentContent: contentStateWithEntity }),
          entityKey,
          ' '
        );

        handleEditorStateChange(moduleIndex, newEditorState);
        setModal({
          isOpen: true,
          status: 'success',
          message: `${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} uploaded successfully!`,
        });
        setTimeout(() => {
          setModal({ isOpen: false, status: null, message: '' });
        }, 2000);
        
      } catch (error) {
        console.error(`${mediaType} upload error:`, error);
        setModal({
          isOpen: true,
          status: 'error',
          message: `Failed to upload ${mediaType}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      } finally {
        dispatch({ type: 'SET_UPLOADING', moduleIndex, uploading: false });
      }
    },
    [getEditorState, handleEditorStateChange, setModal]
  );
  const handleVideoEmbed = useCallback(
    (moduleIndex: number, embedUrl: string, originalUrl: string) => {
      if (!embedUrl || !originalUrl) return;
      
      const currentState = getEditorState(moduleIndex);
      const contentState = currentState.getCurrentContent();
      const { width, height } = calculateResponsiveDimensions(560, 315);
      
      const contentStateWithEntity = contentState.createEntity(
        'IFRAME_VIDEO',
        'IMMUTABLE',
        {
          src: embedUrl,
          originalUrl,
          title: 'Embedded Video',
          type: 'IFRAME_VIDEO',
          width,
          height,
          resizable: true,
          adjustable: true,
          responsive: true,
        }
      );
      
      const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
      const newEditorState = AtomicBlockUtils.insertAtomicBlock(
        EditorState.set(currentState, { currentContent: contentStateWithEntity }),
        entityKey,
        ' '
      );
      
      handleEditorStateChange(moduleIndex, newEditorState);
    },
    [getEditorState, handleEditorStateChange]
  );

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .text-align-left { text-align: left; }
      .text-align-center { text-align: center; }
      .text-align-right { text-align: right; }
      .text-align-justify { text-align: justify; }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleTextColor = useCallback(
    (moduleIndex: number, color: string) => {
      const currentState = getEditorState(moduleIndex);
      const selection = currentState.getSelection();
      if (selection.isCollapsed()) {
        setModal({
          isOpen: true,
          status: 'error',
          message: 'Please select text to apply color',
        });
        return;
      }

      let newState = currentState;
      const currentInlineStyle = currentState.getCurrentInlineStyle();
      currentInlineStyle.forEach((style) => {
        if (style && style.startsWith('TEXT_COLOR_')) {
          newState = RichUtils.toggleInlineStyle(newState, style);
        }
      });

      if (color) {
        const colorKey = color.replace('#', '').toUpperCase();
        newState = RichUtils.toggleInlineStyle(newState, `TEXT_COLOR_${colorKey}`);
      }

      handleEditorStateChange(moduleIndex, newState);
    },
    [getEditorState, handleEditorStateChange, setModal]
  );

  const handleTextHighlight = useCallback(
    (moduleIndex: number, color: string) => {
      const currentState = getEditorState(moduleIndex);
      const selection = currentState.getSelection();
      if (selection.isCollapsed()) {
        setModal({
          isOpen: true,
          status: 'error',
          message: 'Please select text to apply highlight',
        });
        return;
      }

      let newState = currentState;
      const currentInlineStyle = currentState.getCurrentInlineStyle();
      currentInlineStyle.forEach((style) => {
        if (style && style.startsWith('HIGHLIGHT_')) {
          newState = RichUtils.toggleInlineStyle(newState, style);
        }
      });

      if (color) {
        const colorKey = color.replace('#', '').toUpperCase();
        newState = RichUtils.toggleInlineStyle(newState, `HIGHLIGHT_${colorKey}`);
      }

      handleEditorStateChange(moduleIndex, newState);
    },
    [getEditorState, handleEditorStateChange, setModal]
  );

  const handleFontFamily = useCallback(
    (moduleIndex: number, fontFamily: string) => {
      const currentState = getEditorState(moduleIndex);
      const selection = currentState.getSelection();
      if (selection.isCollapsed()) {
        setModal({
          isOpen: true,
          status: 'error',
          message: 'Please select text to apply font family',
        });
        return;
      }

      let newState = currentState;
      const currentInlineStyle = currentState.getCurrentInlineStyle();
      
      // Remove existing font family styles
      currentInlineStyle.forEach((style) => {
        if (style && style.startsWith('FONT_FAMILY_')) {
          newState = RichUtils.toggleInlineStyle(newState, style);
        }
      });

      // Apply new font family if provided
      if (fontFamily) {
        const font = FONT_FAMILIES.find(f => f.value === fontFamily);
        if (font && font.value) {
          const fontKey = font.name.replace(/\s+/g, '_').toUpperCase();
          newState = RichUtils.toggleInlineStyle(newState, `FONT_FAMILY_${fontKey}`);
        }
      }

      handleEditorStateChange(moduleIndex, newState);
    },
    [getEditorState, handleEditorStateChange, setModal]
  );

  const getCurrentFontFamily = useCallback(
    (moduleIndex: number): string | null => {
      const editorState = getEditorState(moduleIndex);
      const currentStyle = editorState.getCurrentInlineStyle();
      const styleArray = currentStyle.toArray();
      for (const style of styleArray) {
        if (style && style.startsWith('FONT_FAMILY_')) {
          const fontKey = style.replace('FONT_FAMILY_', '');
          const font = FONT_FAMILIES.find(f => 
            f.name.replace(/\s+/g, '_').toUpperCase() === fontKey
          );
          return font ? font.value : null;
        }
      }
      return null;
    },
    [getEditorState]
  );

  const handleImageUpload = useMemo(() => createMediaUploadHandler('image'), [createMediaUploadHandler]);
  const handleVideoUpload = useMemo(() => createMediaUploadHandler('video'), [createMediaUploadHandler]);
  const handleGifUpload = useMemo(() => createMediaUploadHandler('gif'), [createMediaUploadHandler]);
  const handleStickerUpload = useMemo(() => createMediaUploadHandler('sticker'), [createMediaUploadHandler]);

  const handleTextAlignment = useCallback(
    (moduleIndex: number, alignment: string) => {
      const currentState = getEditorState(moduleIndex);
      const selection = currentState.getSelection();
      const contentState = currentState.getCurrentContent();
      const blockMap = contentState.getBlockMap();
      const startKey = selection.getStartKey();
      const endKey = selection.getEndKey();
      let foundStart = false;

      const updatedBlockMap = blockMap.map((block, blockKey) => {
        if (!foundStart) {
          foundStart = blockKey === startKey;
        }
        if (foundStart && block && typeof blockKey === 'string') {
          const newBlockData = block.getData().set('textAlign', alignment);
          const newBlock = block.set('data', newBlockData);
          if (blockKey === endKey) {
            foundStart = false;
          }
          return newBlock;
        }
        return block;
      });

      const newContentState = contentState.set('blockMap', updatedBlockMap) as ContentState;
      const newEditorState = EditorState.push(currentState, newContentState, 'change-block-data');
      handleEditorStateChange(moduleIndex, newEditorState);
    },
    [getEditorState, handleEditorStateChange]
  );

  const handleKeyCommand = useCallback(
    (moduleIndex: number, command: string): DraftHandleValue => {
      const currentState = getEditorState(moduleIndex);
      const newState = RichUtils.handleKeyCommand(currentState, command);
      if (newState) {
        handleEditorStateChange(moduleIndex, newState);
        return 'handled';
      }
      return 'not-handled';
    },
    [getEditorState, handleEditorStateChange]
  );

  const handleEmojiInsert = useCallback(
    (moduleIndex: number, emoji: string) => {
      const currentState = getEditorState(moduleIndex);
      const contentState = currentState.getCurrentContent();
      const selection = currentState.getSelection();
      const newContentState = Modifier.insertText(contentState, selection, emoji);
      const newEditorState = EditorState.push(currentState, newContentState, 'insert-characters');
      handleEditorStateChange(moduleIndex, newEditorState);
    },
    [getEditorState, handleEditorStateChange]
  );

  const handleLinkToggle = useCallback(
    (moduleIndex: number) => {
      const currentState = getEditorState(moduleIndex);
      const selection = currentState.getSelection();
      if (selection.isCollapsed()) {
        setModal({
          isOpen: true,
          status: 'error',
          message: 'Please select text to create a link',
        });
        return;
      }

      const contentState = currentState.getCurrentContent();
      const startKey = selection.getStartKey();
      const startOffset = selection.getStartOffset();
      const blockWithLinkAtBeginning = contentState.getBlockForKey(startKey);
      const linkKey = blockWithLinkAtBeginning.getEntityAt(startOffset);

      let newState: EditorState;
      if (linkKey) {
        newState = RichUtils.toggleLink(currentState, selection, null);
      } else {
        const linkURL = prompt('Enter a URL:');
        if (!linkURL) return;
        try {
          new URL(linkURL);
          const contentStateWithEntity = contentState.createEntity('LINK', 'MUTABLE', { url: linkURL });
          const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
          newState = RichUtils.toggleLink(
            EditorState.set(currentState, { currentContent: contentStateWithEntity }),
            selection,
            entityKey
          );
        } catch {
          setModal({
            isOpen: true,
            status: 'error',
            message: 'Please enter a valid URL (including http:// or https://)',
          });
          return;
        }
      }
      handleEditorStateChange(moduleIndex, newState);
    },
    [getEditorState, handleEditorStateChange, setModal]
  );

  const focusEditor = useCallback((moduleIndex: number) => {
    const editor = editorRefs.current.get(moduleIndex);
    if (editor && typeof editor.focus === 'function') {
      editor.focus();
    }
  }, []);

  const getEditorContent = useCallback(
    (moduleIndex: number): RawDraftContentState | null => {
      const editorState = getEditorState(moduleIndex);
      return convertToRaw(editorState.getCurrentContent());
    },
    [getEditorState]
  );

  const setEditorContent = useCallback(
    (moduleIndex: number, content: RawDraftContentState) => {
      const contentState = convertFromRaw(content);
      const newEditorState = EditorState.createWithContent(contentState);
      handleEditorStateChange(moduleIndex, newEditorState);
    },
    [handleEditorStateChange]
  );

  const getEditorText = useCallback(
    (moduleIndex: number): string => {
      const editorState = getEditorState(moduleIndex);
      return editorState.getCurrentContent().getPlainText();
    },
    [getEditorState]
  );

  const hasInlineStyle = useCallback(
    (moduleIndex: number, style: string): boolean => {
      const editorState = getEditorState(moduleIndex);
      return editorState.getCurrentInlineStyle().has(style);
    },
    [getEditorState]
  );

  const getCurrentBlockType = useCallback(
    (moduleIndex: number): string => {
      const editorState = getEditorState(moduleIndex);
      const selection = editorState.getSelection();
      return editorState.getCurrentContent().getBlockForKey(selection.getStartKey()).getType();
    },
    [getEditorState]
  );

  const getCurrentTextAlignment = useCallback(
    (moduleIndex: number): string => {
      const editorState = getEditorState(moduleIndex);
      const selection = editorState.getSelection();
      const block = editorState.getCurrentContent().getBlockForKey(selection.getStartKey());
      return block.getData().get('textAlign') || 'left';
    },
    [getEditorState]
  );

  const getCurrentTextColor = useCallback(
    (moduleIndex: number): string | null => {
      const editorState = getEditorState(moduleIndex);
      const currentStyle = editorState.getCurrentInlineStyle();
      const styleArray = currentStyle.toArray();
      for (const style of styleArray) {
        if (style && style.startsWith('TEXT_COLOR_')) {
          return `#${style.replace('TEXT_COLOR_', '')}`;
        }
      }
      return null;
    },
    [getEditorState]
  );

  const getCurrentHighlightColor = useCallback(
    (moduleIndex: number): string | null => {
      const editorState = getEditorState(moduleIndex);
      const currentStyle = editorState.getCurrentInlineStyle();
      const styleArray = currentStyle.toArray();
      for (const style of styleArray) {
        if (style && style.startsWith('HIGHLIGHT_')) {
          return `#${style.replace('HIGHLIGHT_', '')}`;
        }
      }
      return null;
    },
    [getEditorState]
  );

  const handleInlineStyleChange = useCallback(
    (moduleIndex: number, inlineStyle: string) => {
      const currentState = getEditorState(moduleIndex);
      const newState = RichUtils.toggleInlineStyle(currentState, inlineStyle);
      handleEditorStateChange(moduleIndex, newState);
    },
    [getEditorState, handleEditorStateChange]
  );

  const handleBlockTypeChange = useCallback(
    (moduleIndex: number, blockType: string) => {
      const currentState = getEditorState(moduleIndex);
      const newState = RichUtils.toggleBlockType(currentState, blockType);
      handleEditorStateChange(moduleIndex, newState);
    },
    [getEditorState, handleEditorStateChange]
  );

  const clearFormatting = useCallback(
    (moduleIndex: number) => {
      const currentState = getEditorState(moduleIndex);
      const selection = currentState.getSelection();
      if (selection.isCollapsed()) {
        setModal({
          isOpen: true,
          status: 'error',
          message: 'Please select text to clear formatting',
        });
        return;
      }

      let newState = currentState;
      const currentInlineStyle = currentState.getCurrentInlineStyle();
      currentInlineStyle.forEach((style) => {
        if (style) {
          newState = RichUtils.toggleInlineStyle(newState, style);
        }
      });
      handleEditorStateChange(moduleIndex, newState);
    },
    [getEditorState, handleEditorStateChange, setModal]
  );

  const formatText = useCallback(
    (moduleIndex: number, format: string) => {
      const currentState = getEditorState(moduleIndex);
      const newState = RichUtils.toggleInlineStyle(currentState, format);
      handleEditorStateChange(moduleIndex, newState);
    },
    [getEditorState, handleEditorStateChange]
  );

  const handleColorPicker = useCallback(
    (moduleIndex: number, type: 'text' | 'highlight') => {
      const currentState = getEditorState(moduleIndex);
      const selection = currentState.getSelection();
      if (selection.isCollapsed()) {
        setModal({
          isOpen: true,
          status: 'error',
          message: `Please select text to apply ${type} color`,
        });
        return;
      }

      const colorInput = document.createElement('input');
      colorInput.type = 'color';
      colorInput.style.position = 'absolute';
      colorInput.style.top = '-9999px';
      document.body.appendChild(colorInput);

      colorInput.onchange = () => {
        const color = colorInput.value;
        if (type === 'text') {
          handleTextColor(moduleIndex, color);
        } else {
          handleTextHighlight(moduleIndex, color);
        }
        document.body.removeChild(colorInput);
      };

      colorInput.click();
    },
    [handleTextColor, handleTextHighlight, setModal, getEditorState]
  );

  const saveToFirebase = useCallback(
    async (courseId: string) => {
      try {
        setModal({ isOpen: true, status: 'uploading', message: 'Saving course to Firebase...' });
        const courseData = {
          ...formData,
          modules: formData.modules.map((module, index) => ({
            ...module,
            content: convertToRaw(getEditorState(index).getCurrentContent()),
          })),
        };
        await setDoc(doc(db, 'courses', courseId), courseData);
        setModal({
          isOpen: true,
          status: 'success',
          message: 'Course saved successfully!',
        });
        setTimeout(() => {
          setModal({ isOpen: false, status: null, message: '' });
        }, 2000);
      } catch (error) {
        setModal({
          isOpen: true,
          status: 'error',
          message: `Failed to save course: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    },
    [formData, getEditorState, setModal]
  );

  return useMemo(
    () => ({
      editorStates: modules.map((_, index) => getEditorState(index)),
      editorRefs,
      getMediaBlockRenderer: createMediaBlockRenderer,
      styleMap,
      blockStyleFn,
      textColors: TEXT_COLORS,
      highlightColors: HIGHLIGHT_COLORS,
      textAlignOptions: TEXT_ALIGN_OPTIONS,
      fontFamilies: FONT_FAMILIES,
      handleEditorStateChange,
      handleKeyCommand,
      getEditorState,
      setEditorRef: (moduleIndex: number, ref: Editor | null) => {
        editorRefs.current.set(moduleIndex, ref);
      },
      handleInlineStyleChange,
      handleBlockTypeChange,
      formatText,
      clearFormatting,
      handleTextColor,
      handleTextHighlight,
      handleFontFamily,
      handleTextAlignment,
      handleColorPicker,
      handleImageUpload,
      handleVideoUpload,
      handleVideoEmbed,
      handleGifUpload,
      handleStickerUpload,
      handleEmojiInsert,
      handleLinkToggle,
      focusEditor,
      getEditorContent,
      setEditorContent,
      getEditorText,
      hasInlineStyle,
      getCurrentBlockType,
      getCurrentTextAlignment,
      getCurrentTextColor,
      getCurrentHighlightColor,
      getCurrentFontFamily,
      isUploading: (moduleIndex: number) => isUploading.get(moduleIndex) || false,
      saveToFirebase,
    }),
    [
      modules,
      getEditorState,
      createMediaBlockRenderer,
      handleEditorStateChange,
      handleKeyCommand,
      handleInlineStyleChange,
      handleBlockTypeChange,
      formatText,
      clearFormatting,
      handleTextColor,
      handleTextHighlight,
      handleFontFamily,
      handleTextAlignment,
      handleColorPicker,
      handleImageUpload,
      handleVideoUpload,
      handleVideoEmbed,
      handleGifUpload,
      handleStickerUpload,
      handleEmojiInsert,
      handleLinkToggle,
      focusEditor,
      getEditorContent,
      setEditorContent,
      getEditorText,
      hasInlineStyle,
      getCurrentBlockType,
      getCurrentTextAlignment,
      getCurrentTextColor,
      getCurrentHighlightColor,
      getCurrentFontFamily,
      isUploading,
      saveToFirebase,
    ]
  );
};