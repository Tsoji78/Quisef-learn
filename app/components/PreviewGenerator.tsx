import React from 'react';
import { EditorState, convertToRaw, RawDraftContentBlock } from 'draft-js';

interface PreviewGeneratorProps {
  editorState: EditorState;
}

export const generatePreview = (editorState: EditorState): React.ReactNode[] => {
  const contentState = editorState.getCurrentContent();
  const rawContent = convertToRaw(contentState);

  return rawContent.blocks.map((block: RawDraftContentBlock, index: number) => {
    let content = block.text;
    let styles: React.CSSProperties = {};
    let className = '';

    // Handle text alignment
    if (block.data && block.data.textAlign) {
      className += ` text-${block.data.textAlign}`;
    }

    // Process inline styles
    if (block.inlineStyleRanges && block.inlineStyleRanges.length > 0) {
      // For preview, we'll apply the first found style to the entire block
      // In a more sophisticated implementation, you'd handle ranges properly
      block.inlineStyleRanges.forEach((styleRange) => {
        const style = styleRange.style;
        if (style.startsWith('TEXT_COLOR_')) {
          styles.color = `#${style.replace('TEXT_COLOR_', '')}`;
        }
        if (style.startsWith('HIGHLIGHT_')) {
          styles.backgroundColor = `#${style.replace('HIGHLIGHT_', '')}`;
          styles.padding = '2px 4px';
          styles.borderRadius = '3px';
        }
        if (style === 'BOLD') styles.fontWeight = 'bold';
        if (style === 'ITALIC') styles.fontStyle = 'italic';
        if (style === 'UNDERLINE') styles.textDecoration = 'underline';
      });
    }

    // Handle atomic blocks (media)
    if (block.type === 'atomic') {
      const entityKey = block.entityRanges[0]?.key;
      if (entityKey !== undefined) {
        const entity = rawContent.entityMap[entityKey];
        if (entity) {
          const { src, type, width = 400, height = 300, title, alt } = entity.data;
          
          const mediaStyle = {
            width: `${width}px`,
            height: `${height}px`,
            maxWidth: '100%',
            objectFit: 'contain' as const,
          };

          if (type === 'IMAGE' || type === 'GIF' || type === 'STICKER') {
            return (
              <div key={index} className="my-4 text-center">
                <img
                  src={src}
                  alt={alt || title}
                  style={mediaStyle}
                  className="inline-block max-w-full h-auto"
                />
              </div>
            );
          }
          
          if (type === 'VIDEO') {
            return (
              <div key={index} className="my-4 text-center">
                <video
                  src={src}
                  style={mediaStyle}
                  controls
                  className="inline-block max-w-full h-auto"
                />
              </div>
            );
          }
          
          if (type === 'IFRAME_VIDEO') {
            return (
              <div key={index} className="my-4 text-center">
                <iframe
                  src={src}
                  title={title}
                  style={mediaStyle}
                  allowFullScreen
                  className="inline-block border-0 max-w-full"
                />
              </div>
            );
          }
        }
      }
      
      return (
        <div key={index} className="my-4 text-center text-gray-500">
          [Media Content]
        </div>
      );
    }

    // Handle different block types
    switch (block.type) {
      case 'header-one':
        return (
          <h1 key={index} style={styles} className={`text-3xl font-bold mb-4${className}`}>
            {content || <br />}
          </h1>
        );
      case 'header-two':
        return (
          <h2 key={index} style={styles} className={`text-2xl font-bold mb-3${className}`}>
            {content || <br />}
          </h2>
        );
      case 'header-three':
        return (
          <h3 key={index} style={styles} className={`text-xl font-bold mb-2${className}`}>
            {content || <br />}
          </h3>
        );
      case 'blockquote':
        return (
          <blockquote
            key={index}
            style={styles}
            className={`border-l-4 border-gray-300 pl-4 italic mb-4${className}`}
          >
            {content || <br />}
          </blockquote>
        );
      case 'unordered-list-item':
        return (
          <li key={index} style={styles} className={`ml-4 mb-1${className}`}>
            • {content}
          </li>
        );
      case 'ordered-list-item':
        return (
          <li key={index} style={styles} className={`ml-4 mb-1${className}`}>
            {index + 1}. {content}
          </li>
        );
      default:
        return (
          <p key={index} style={styles} className={`mb-2${className}`}>
            {content || <br />}
          </p>
        );
    }
  });
};

export const PreviewGenerator: React.FC<PreviewGeneratorProps> = ({ editorState }) => {
  const previewContent = generatePreview(editorState);
  
  return (
    <div className="prose max-w-none">
      {previewContent}
    </div>
  );
};