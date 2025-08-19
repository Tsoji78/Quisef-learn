import React from 'react';
import { EditorState, ContentBlock, RawDraftContentState } from 'draft-js';
import { ModalState } from '@/types';
import { ColorPicker } from './ColorPicker';
import { EmojiPicker } from './EmojiPicker';

interface DraftEditorToolbarProps {
  moduleIndex: number;
  editorHook: {
    editorStates: EditorState[];
    mediaBlockRenderer: (block: ContentBlock) => { component: React.FC<any>; editable: boolean } | null;
    styleMap: { [key: string]: React.CSSProperties };
    blockStyleFn: (block: ContentBlock) => string;
    textColors: string[];
    highlightColors: string[];
    textAlignOptions: readonly string[];
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
    setEditorRef: (moduleIndex: number, ref: any) => void;
    isUploading: (moduleIndex: number) => boolean;
  };
  isUploading: boolean;
  setModal: (modal: ModalState) => void;
}

export const DraftEditorToolbar: React.FC<DraftEditorToolbarProps> = ({
  moduleIndex,
  editorHook,
  isUploading,
  setModal,
}) => {
  const {
    handleBlockTypeChange,
    handleImageUpload,
    handleVideoUpload,
    handleVideoEmbed,
    handleGifUpload,
    handleEmojiInsert,
    handleLinkToggle,
    handleTextColor,
    handleTextHighlight,
    handleTextAlignment,
    handleColorPicker,
    formatText,
    clearFormatting,
    textColors,
    highlightColors,
    textAlignOptions,
    hasInlineStyle,
    getCurrentBlockType,
    getCurrentTextAlignment,
    getCurrentTextColor,
    getCurrentHighlightColor,
  } = editorHook;

  // Enhanced video embed handler
  const handleVideoEmbedClick = () => {
    const originalUrl = prompt('Enter video URL (YouTube, Vimeo, etc.):');
    if (originalUrl) {
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
      handleVideoEmbed(moduleIndex, embedUrl, originalUrl);
    } else if (originalUrl !== null) {
      setModal({
        isOpen: true,
        status: 'error',
        message: 'Please enter a valid URL (including http:// or https://)',
      });
    }
  };

  return (
    <div className="draft-toolbar bg-white border-b border-gray-200 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 bg-gray-50 rounded p-1">
          <button
            onClick={() => formatText(moduleIndex, 'BOLD')}
            className={`px-2 py-1 rounded text-sm font-bold ${
              hasInlineStyle(moduleIndex, 'BOLD') ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'
            }`}
            disabled={isUploading}
            title="Bold (Ctrl+B)"
            type="button"
          >
            B
          </button>
          <button
            onClick={() => formatText(moduleIndex, 'ITALIC')}
            className={`px-2 py-1 rounded text-sm italic ${
              hasInlineStyle(moduleIndex, 'ITALIC') ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'
            }`}
            disabled={isUploading}
            title="Italic (Ctrl+I)"
            type="button"
          >
            I
          </button>
          <button
            onClick={() => formatText(moduleIndex, 'UNDERLINE')}
            className={`px-2 py-1 rounded text-sm underline ${
              hasInlineStyle(moduleIndex, 'UNDERLINE') ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'
            }`}
            disabled={isUploading}
            title="Underline (Ctrl+U)"
            type="button"
          >
            U
          </button>
        </div>

        <div className="w-px h-6 bg-gray-300" />

        <div className="flex items-center gap-1 bg-gray-50 rounded p-1">
          <button
            onClick={() => handleBlockTypeChange(moduleIndex, 'header-one')}
            className={`px-2 py-1 rounded text-sm font-bold ${
              getCurrentBlockType(moduleIndex) === 'header-one'
                ? 'bg-blue-500 text-white'
                : 'hover:bg-gray-200'
            }`}
            disabled={isUploading}
            title="Header 1"
            type="button"
          >
            H1
          </button>
          <button
            onClick={() => handleBlockTypeChange(moduleIndex, 'header-two')}
            className={`px-2 py-1 rounded text-sm font-bold ${
              getCurrentBlockType(moduleIndex) === 'header-two'
                ? 'bg-blue-500 text-white'
                : 'hover:bg-gray-200'
            }`}
            disabled={isUploading}
            title="Header 2"
            type="button"
          >
            H2
          </button>
          <button
            onClick={() => handleBlockTypeChange(moduleIndex, 'unordered-list-item')}
            className={`px-2 py-1 rounded text-sm ${
              getCurrentBlockType(moduleIndex) === 'unordered-list-item'
                ? 'bg-blue-500 text-white'
                : 'hover:bg-gray-200'
            }`}
            disabled={isUploading}
            title="Bullet List"
            type="button"
          >
            • List
          </button>
        </div>

        <div className="w-px h-6 bg-gray-300" />

        <select
          value={getCurrentTextAlignment(moduleIndex)}
          onChange={(e) => handleTextAlignment(moduleIndex, e.target.value)}
          className="px-2 py-1 rounded text-sm bg-white border border-gray-300 hover:bg-gray-50"
          disabled={isUploading}
          title="Text alignment"
        >
          {textAlignOptions.map((align) => (
            <option key={align} value={align}>
              {align.charAt(0).toUpperCase() + align.slice(1)}
            </option>
          ))}
        </select>

        <div className="w-px h-6 bg-gray-300" />

        <ColorPicker
          colors={textColors}
          currentColor={getCurrentTextColor(moduleIndex)}
          onColorSelect={(color) => handleTextColor(moduleIndex, color)}
          onColorPickerOpen={() => handleColorPicker(moduleIndex, 'text')}
          label="Text Color"
          type="text"
        />

        <ColorPicker
          colors={highlightColors}
          currentColor={getCurrentHighlightColor(moduleIndex)}
          onColorSelect={(color) => handleTextHighlight(moduleIndex, color)}
          onColorPickerOpen={() => handleColorPicker(moduleIndex, 'highlight')}
          label="Highlight Color"
          type="highlight"
        />

        <button
          onClick={() => clearFormatting(moduleIndex)}
          className="px-2 py-1 rounded text-sm bg-red-100 text-red-700 hover:bg-red-200"
          disabled={isUploading}
          title="Clear all formatting"
          type="button"
        >
          ✗ Clear
        </button>

        <div className="w-px h-6 bg-gray-300" />

        <div className="flex items-center gap-1 bg-gray-50 rounded p-1">
          <button
            onClick={() => handleImageUpload(moduleIndex)}
            className="px-2 py-1 rounded text-sm bg-green-100 text-green-700 hover:bg-green-200"
            disabled={isUploading}
            title="Upload image"
            type="button"
          >
            🖼️ Image
          </button>
          <button
            onClick={() => handleVideoUpload(moduleIndex)}
            className="px-2 py-1 rounded text-sm bg-purple-100 text-purple-700 hover:bg-purple-200"
            disabled={isUploading}
            title="Upload video"
            type="button"
          >
            🎥 Video
          </button>
          <button
            onClick={handleVideoEmbedClick}
            className="px-2 py-1 rounded text-sm bg-blue-100 text-blue-700 hover:bg-blue-200"
            disabled={isUploading}
            title="Embed video"
            type="button"
          >
            🔗 Embed
          </button>
          <button
            onClick={() => handleGifUpload(moduleIndex)}
            className="px-2 py-1 rounded text-sm bg-orange-100 text-orange-700 hover:bg-orange-200"
            disabled={isUploading}
            title="Upload GIF"
            type="button"
          >
            🎞️ GIF
          </button>
        </div>

        <div className="w-px h-6 bg-gray-300" />

        <div className="flex items-center gap-1 bg-gray-50 rounded p-1">
          <button
            onClick={() => handleLinkToggle(moduleIndex)}
            className="px-2 py-1 rounded text-sm bg-cyan-100 text-cyan-700 hover:bg-cyan-200"
            disabled={isUploading}
            title="Add/remove link"
            type="button"
          >
            🔗 Link
          </button>
          <EmojiPicker onEmojiSelect={(emoji) => handleEmojiInsert(moduleIndex, emoji)} />
        </div>

        {isUploading && (
          <div className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
            Uploading...
          </div>
        )}
      </div>
    </div>
  );
};

export default DraftEditorToolbar;