import React, { useState, useCallback } from 'react';
import { Editor, EditorState, RichUtils } from 'draft-js';
import { Course, ModalState, Module } from '@/types';
import { ColorPicker } from './ColorPicker';
import { EmojiPicker } from './EmojiPicker';
import { PreviewGenerator } from './PreviewGenerator';
import { FontStylePicker } from './FontStylePicker';
import 'draft-js/dist/Draft.css';
import '@/DraftEditor.module.css';

interface DraftEditorComponentProps {
  moduleIndex: number;
  module: Module;
  editorHook: {
    editorStates: EditorState[];
    getMediaBlockRenderer: (moduleIndex: number) => (block: any) => any;
    styleMap: { [key: string]: React.CSSProperties };
    blockStyleFn: (block: any) => string;
    textColors: string[];
    highlightColors: string[];
    textAlignOptions: readonly string[];
    fontFamilies: Array<{ name: string; value: string; preview: string }>;
    handleEditorStateChange: (moduleIndex: number, newEditorState: EditorState) => void;
    getEditorState: (moduleIndex: number) => EditorState;
    setEditorRef: (moduleIndex: number, ref: Editor | null) => void;
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
    hasInlineStyle: (moduleIndex: number, style: string) => boolean;
    getCurrentBlockType: (moduleIndex: number) => string;
    getCurrentTextAlignment: (moduleIndex: number) => string;
    getCurrentTextColor: (moduleIndex: number) => string | null;
    getCurrentHighlightColor: (moduleIndex: number) => string | null;
    getCurrentFontFamily: (moduleIndex: number) => string | null;
    isUploading: (moduleIndex: number) => boolean;
  };
  formData: Course;
  setFormData: (data: Course | ((prev: Course) => Course)) => void;
  setModal: (modal: ModalState) => void;
}

export const DraftEditorComponent: React.FC<DraftEditorComponentProps> = ({
  moduleIndex,
  module,
  editorHook,
  formData,
  setFormData,
  setModal,
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const editorState = editorHook.getEditorState(moduleIndex);

  // Enhanced media upload with file type validation
  const handleEnhancedMediaUpload = useCallback(
    async (mediaType: 'image' | 'video' | 'gif') => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept =
        mediaType === 'image'
          ? 'image/jpeg,image/png,image/webp'
          : mediaType === 'video'
          ? 'video/mp4,video/webm,video/mov'
          : 'image/gif';

      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;

        try {
          setModal({
            isOpen: true,
            status: 'uploading',
            message: `Uploading ${mediaType}...`,
          });

          switch (mediaType) {
            case 'image':
              await editorHook.handleImageUpload(moduleIndex, file);
              break;
            case 'video':
              await editorHook.handleVideoUpload(moduleIndex, file);
              break;
            case 'gif':
              await editorHook.handleGifUpload(moduleIndex, file);
              break;
          }
        } catch (error) {
          console.error(`Upload error for ${mediaType}:`, error);
          setModal({
            isOpen: true,
            status: 'error',
            message: `Failed to upload ${mediaType}`,
          });
        }
      };

      input.click();
    },
    [moduleIndex, editorHook, setModal]
  );

  // Enhanced video embed handler
  const handleVideoEmbedClick = useCallback(() => {
    const originalUrl = prompt('Enter video URL (YouTube, Vimeo, etc.):');
    if (!originalUrl) return;

    let embedUrl = originalUrl;
    if (originalUrl.includes('youtube.com/watch?v=')) {
      const videoId = originalUrl.split('v=')[1]?.split('&')[0];
      if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (originalUrl.includes('youtu.be/')) {
      const videoId = originalUrl.split('youtu.be/')[1]?.split('?')[0];
      if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (originalUrl.includes('vimeo.com/')) {
      const videoId = originalUrl.split('vimeo.com/')[1]?.split('/')[0];
      if (videoId) embedUrl = `https://player.vimeo.com/video/${videoId}`;
    }

    editorHook.handleVideoEmbed(moduleIndex, embedUrl, originalUrl);
  }, [moduleIndex, editorHook]);

  // Enhanced text color handler with validation
  const handleEnhancedTextColor = useCallback(
    (color: string) => {
      const selection = editorState.getSelection();
      if (selection.isCollapsed()) {
        setModal({
          isOpen: true,
          status: 'error',
          message: 'Please select text to apply color',
        });
        return;
      }
      editorHook.handleTextColor(moduleIndex, color);
    },
    [editorState, moduleIndex, editorHook, setModal]
  );

  // Enhanced highlight handler with validation
  const handleEnhancedHighlight = useCallback(
    (color: string) => {
      const selection = editorState.getSelection();
      if (selection.isCollapsed()) {
        setModal({
          isOpen: true,
          status: 'error',
          message: 'Please select text to apply highlight',
        });
        return;
      }
      editorHook.handleTextHighlight(moduleIndex, color);
    },
    [editorState, moduleIndex, editorHook, setModal]
  );

  // Enhanced font family handler with validation
  const handleEnhancedFontFamily = useCallback(
    (fontFamily: string) => {
      const selection = editorState.getSelection();
      if (selection.isCollapsed()) {
        setModal({
          isOpen: true,
          status: 'error',
          message: 'Please select text to apply font family',
        });
        return;
      }
      editorHook.handleFontFamily(moduleIndex, fontFamily);
    },
    [editorState, moduleIndex, editorHook, setModal]
  );

  // Enhanced clear formatting with validation
  const handleEnhancedClearFormatting = useCallback(() => {
    const selection = editorState.getSelection();
    if (selection.isCollapsed()) {
      setModal({
        isOpen: true,
        status: 'error',
        message: 'Please select text to clear formatting',
      });
      return;
    }
    editorHook.clearFormatting(moduleIndex);
  }, [editorState, moduleIndex, editorHook, setModal]);

  return (
    <div className="draft-editor-wrapper bg-gray-800 rounded-lg shadow-lg overflow-hidden border">
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-50">
            {module.title || `Module ${moduleIndex + 1}`}
          </h3>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            type="button"
          >
            {showPreview ? 'Edit' : 'Preview'}
          </button>
        </div>

        {!showPreview && (
          <div className="draft-toolbar flex flex-wrap items-center gap-3 p-3 bg-gray-800 rounded border">
            {/* Text Formatting */}
            <div className="flex items-center gap-1 bg-gray-800 rounded p-1 border">
              <button
                onClick={() => editorHook.formatText(moduleIndex, 'BOLD')}
                className={`px-3 py-1 rounded text-sm font-bold transition-colors ${
                  editorHook.hasInlineStyle(moduleIndex, 'BOLD')
                    ? 'bg-blue-500 text-white'
                    : 'hover:bg-gray-100'
                }`}
                type="button"
                title="Bold (Ctrl+B)"
              >
                B
              </button>
              <button
                onClick={() => editorHook.formatText(moduleIndex, 'ITALIC')}
                className={`px-3 py-1 rounded text-sm italic transition-colors ${
                  editorHook.hasInlineStyle(moduleIndex, 'ITALIC')
                    ? 'bg-blue-500 text-white'
                    : 'hover:bg-gray-100'
                }`}
                type="button"
                title="Italic (Ctrl+I)"
              >
                I
              </button>
              <button
                onClick={() => editorHook.formatText(moduleIndex, 'UNDERLINE')}
                className={`px-3 py-1 rounded text-sm underline transition-colors ${
                  editorHook.hasInlineStyle(moduleIndex, 'UNDERLINE')
                    ? 'bg-blue-500 text-white'
                    : 'hover:bg-gray-100'
                }`}
                type="button"
                title="Underline (Ctrl+U)"
              >
                U
              </button>
            </div>

            {/* Block Types */}
            <div className="flex items-center gap-1 bg-gray-800 rounded p-1 border">
              <button
                onClick={() => {
                  const newState = RichUtils.toggleBlockType(editorState, 'header-one');
                  editorHook.handleEditorStateChange(moduleIndex, newState);
                }}
                className={`px-3 py-1 rounded text-sm font-bold transition-colors ${
                  editorHook.getCurrentBlockType(moduleIndex) === 'header-one'
                    ? 'bg-blue-500 text-white'
                    : 'hover:bg-gray-100'
                }`}
                type="button"
                title="Header 1"
              >
                H1
              </button>
              <button
                onClick={() => {
                  const newState = RichUtils.toggleBlockType(editorState, 'header-two');
                  editorHook.handleEditorStateChange(moduleIndex, newState);
                }}
                className={`px-3 py-1 rounded text-sm font-bold transition-colors ${
                  editorHook.getCurrentBlockType(moduleIndex) === 'header-two'
                    ? 'bg-blue-500 text-white'
                    : 'hover:bg-gray-100'
                }`}
                type="button"
                title="Header 2"
              >
                H2
              </button>
              <button
                onClick={() => {
                  const newState = RichUtils.toggleBlockType(editorState, 'unordered-list-item');
                  editorHook.handleEditorStateChange(moduleIndex, newState);
                }}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  editorHook.getCurrentBlockType(moduleIndex) === 'unordered-list-item'
                    ? 'bg-blue-500 text-white'
                    : 'hover:bg-gray-100'
                }`}
                type="button"
                title="Bullet List"
              >
                • List
              </button>
            </div>

            {/* Font Family Picker */}
            <FontStylePicker
              currentFont={editorHook.getCurrentFontFamily(moduleIndex)}
              onFontSelect={handleEnhancedFontFamily}
              disabled={editorHook.isUploading(moduleIndex)}
            />

            {/* Text Alignment */}
            <select
              value={editorHook.getCurrentTextAlignment(moduleIndex)}
              onChange={(e) => editorHook.handleTextAlignment(moduleIndex, e.target.value)}
              className="px-3 py-1 rounded text-sm bg-gray-800 text-gray-50 border border-gray-600 hover:bg-gray-700"
              disabled={editorHook.isUploading(moduleIndex)}
              title="Text alignment"
            >
              {editorHook.textAlignOptions.map((align) => (
                <option key={align} value={align}>
                  {align.charAt(0).toUpperCase() + align.slice(1)}
                </option>
              ))}
            </select>

            {/* Colors */}
            <ColorPicker
              colors={editorHook.textColors}
              currentColor={editorHook.getCurrentTextColor(moduleIndex)}
              onColorSelect={handleEnhancedTextColor}
              onColorPickerOpen={() => editorHook.handleColorPicker(moduleIndex, 'text')}
              label="Text Color"
              type="text"
            />

            <ColorPicker
              colors={editorHook.highlightColors}
              currentColor={editorHook.getCurrentHighlightColor(moduleIndex)}
              onColorSelect={handleEnhancedHighlight}
              onColorPickerOpen={() => editorHook.handleColorPicker(moduleIndex, 'highlight')}
              label="Highlight"
              type="highlight"
            />

            {/* Clear Formatting */}
            <button
              onClick={handleEnhancedClearFormatting}
              className="px-3 py-1 rounded text-sm bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
              type="button"
              title="Clear formatting"
            >
              Clear
            </button>

            {/* Media Upload */}
            <div className="flex items-center gap-1 bg-gray-800 rounded p-1 border">
              <button
                onClick={() => handleEnhancedMediaUpload('image')}
                className="px-3 py-1 rounded text-sm bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                disabled={editorHook.isUploading(moduleIndex)}
                type="button"
                title="Upload Image"
              >
                🖼️ Image
              </button>
              <button
                onClick={() => handleEnhancedMediaUpload('video')}
                className="px-3 py-1 rounded text-sm bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                disabled={editorHook.isUploading(moduleIndex)}
                type="button"
                title="Upload Video"
              >
                🎥 Video
              </button>
              <button
                onClick={() => handleEnhancedMediaUpload('gif')}
                className="px-3 py-1 rounded text-sm bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors"
                disabled={editorHook.isUploading(moduleIndex)}
                type="button"
                title="Upload GIF"
              >
                🎞️ GIF
              </button>
              <button
                onClick={handleVideoEmbedClick}
                className="px-3 py-1 rounded text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                disabled={editorHook.isUploading(moduleIndex)}
                type="button"
                title="Embed Video"
              >
                🔗 Embed
              </button>
            </div>

            {/* Additional Tools */}
            <EmojiPicker
              onEmojiSelect={(emoji) => editorHook.handleEmojiInsert(moduleIndex, emoji)}
            />

            {editorHook.isUploading(moduleIndex) && (
              <div className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                Uploading...
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-6">
        {showPreview ? (
          <div className="prose max-w-none">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Preview</h2>
            <div className="border rounded-lg p-6 bg-gray-800 min-h-96">
              <PreviewGenerator editorState={editorState} />
            </div>
          </div>
        ) : (
          <div className="border rounded-lg bg-gray-800 min-h-96">
            <div className="p-4 relative">
              <Editor
                ref={(ref) => editorHook.setEditorRef(moduleIndex, ref)}
                editorState={editorState}
                onChange={(newState) => editorHook.handleEditorStateChange(moduleIndex, newState)}
                blockRendererFn={editorHook.getMediaBlockRenderer(moduleIndex)}
                customStyleMap={editorHook.styleMap}
                blockStyleFn={editorHook.blockStyleFn}
                placeholder={`Start writing module ${moduleIndex + 1} content...`}
                spellCheck={true}
              />

              {editorHook.isUploading(moduleIndex) && (
                <div className="absolute inset-0 bg-gray-800 bg-opacity-90 flex items-center justify-center">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-gray-50 mt-2">Uploading...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DraftEditorComponent;