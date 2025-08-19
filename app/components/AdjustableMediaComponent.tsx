import React, { useState, useRef, useEffect } from 'react';
import { EditorState, ContentBlock, ContentState, SelectionState } from 'draft-js';

interface AdjustableMediaComponentProps {
  block: ContentBlock;
  contentState: ContentState;
  blockProps: {
    onUpdate?: (blockKey: string, newEntityData: any) => void;
    onRemove?: (blockKey: string) => void;
    editorState: EditorState;
    onChange: (editorState: EditorState) => void;
  };
}

export const AdjustableMediaComponent: React.FC<AdjustableMediaComponentProps> = ({
  block,
  contentState,
  blockProps,
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const mediaRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);

  const entityKey = block.getEntityAt(0);
  if (!entityKey) return null;

  const entity = contentState.getEntity(entityKey);
  const { src, type, width = 400, height = 300, title, alt } = entity.getData();

  useEffect(() => {
    setDimensions({ width: parseInt(width) || 400, height: parseInt(height) || 300 });
  }, [width, height]);

  const handleResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = dimensions.width;
    const startHeight = dimensions.height;
    const aspectRatio = startWidth / startHeight;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const newWidth = Math.max(100, startWidth + deltaX);
      const newHeight = newWidth / aspectRatio;

      setDimensions({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      if (blockProps.onUpdate) {
        blockProps.onUpdate(block.getKey(), {
          width: dimensions.width,
          height: dimensions.height,
        });
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleRemove = () => {
    if (blockProps.onRemove) {
      blockProps.onRemove(block.getKey());
    } else {
      // Fallback removal method
      const { editorState, onChange } = blockProps;
      const selection = SelectionState.createEmpty(block.getKey());
      // Use Modifier.removeRange to remove the block's range
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Modifier } = require('draft-js');
      const newContentState = Modifier.removeRange(contentState, selection, 'forward');
      const newEditorState = EditorState.push(editorState, newContentState, 'remove-range');
      onChange(newEditorState);
    }
  };

  const renderMedia = () => {
    const style = {
      width: `${dimensions.width}px`,
      height: `${dimensions.height}px`,
      maxWidth: '100%',
      objectFit: 'contain' as const,
    };

    if (type === 'IMAGE' || type === 'GIF' || type === 'STICKER') {
      return (
        <img
          src={src}
          alt={alt || title}
          style={style}
          className="block"
          onLoad={() => {
            // Ensure dimensions are set after image loads
            if (!width || !height) {
              const img = new Image();
              img.onload = () => {
                const aspectRatio = img.width / img.height;
                const newWidth = Math.min(400, img.width);
                const newHeight = newWidth / aspectRatio;
                setDimensions({ width: newWidth, height: newHeight });
                if (blockProps.onUpdate) {
                  blockProps.onUpdate(block.getKey(), {
                    width: newWidth,
                    height: newHeight,
                    originalWidth: img.width,
                    originalHeight: img.height,
                  });
                }
              };
              img.src = src;
            }
          }}
        />
      );
    }

    if (type === 'VIDEO') {
      return (
        <video
          src={src}
          style={style}
          controls
          className="block"
          onLoadedMetadata={(e) => {
            const video = e.currentTarget;
            if (!width || !height) {
              const aspectRatio = video.videoWidth / video.videoHeight;
              const newWidth = Math.min(400, video.videoWidth);
              const newHeight = newWidth / aspectRatio;
              setDimensions({ width: newWidth, height: newHeight });
              if (blockProps.onUpdate) {
                blockProps.onUpdate(block.getKey(), {
                  width: newWidth,
                  height: newHeight,
                  originalWidth: video.videoWidth,
                  originalHeight: video.videoHeight,
                });
              }
            }
          }}
        />
      );
    }

    if (type === 'IFRAME_VIDEO') {
      return (
        <iframe
          src={src}
          title={title}
          style={style}
          allowFullScreen
          className="block border-0"
        />
      );
    }

    return null;
  };

  return (
    <div
      ref={mediaRef}
      className={`relative inline-block my-4 ${isResizing ? 'cursor-nw-resize' : ''}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => !isResizing && setShowControls(false)}
      style={{ maxWidth: '100%' }}
    >
      {renderMedia()}
      
      {/* Control Overlay */}
      {showControls && (
        <div className="absolute top-2 right-2 flex gap-1 bg-black bg-opacity-70 rounded p-1">
          <button
            onClick={handleRemove}
            className="text-white hover:text-red-400 p-1 text-sm"
            title="Remove media"
            type="button"
          >
            🗑️
          </button>
          <span className="text-white text-xs px-1">
            {dimensions.width}×{dimensions.height}
          </span>
        </div>
      )}

      {/* Resize Handle */}
      {showControls && (
        <div
          ref={resizeRef}
          className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-nw-resize opacity-70 hover:opacity-100"
          onMouseDown={handleResize}
          title="Resize media"
        />
      )}

      {isResizing && (
        <div className="absolute top-0 left-0 w-full h-full border-2 border-blue-500 pointer-events-none" />
      )}
    </div>
  );
};