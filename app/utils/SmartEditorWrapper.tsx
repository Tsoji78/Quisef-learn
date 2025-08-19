// ===== OPTIMIZED SMART EDITOR WRAPPER =====
import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { EditorState, ContentState, convertFromRaw, convertToRaw } from 'draft-js';
import { throttle, debounce } from 'lodash';

interface SmartEditorWrapperProps {
  children: React.ReactElement;
  onContentChange?: (content: any, hasRealChanges: boolean) => void;
  onSave?: () => void;
  throttleMs?: number;
  debounceMs?: number;
  autoSaveThreshold?: number;
}

// Stable content comparison using content hash
const generateContentHash = (content: string): string => {
  // Simple but effective hash function
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
};

export const SmartEditorWrapper: React.FC<SmartEditorWrapperProps> = ({
  children,
  onContentChange,
  onSave,
  throttleMs = 500,
  debounceMs = 2000,
  autoSaveThreshold = 5,
}) => {
  const [isTyping, setIsTyping] = useState(false);
  const [changesSinceLastSave, setChangesSinceLastSave] = useState(0);
  
  // Use refs for values that don't need to trigger re-renders
  const lastContentHashRef = useRef<string>('');
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Memoized handlers to prevent recreation on every render
  const throttledContentChange = useMemo(
    () => throttle((content: any, hasRealChanges: boolean) => {
      if (!mountedRef.current) return;
      
      if (hasRealChanges) {
        setChangesSinceLastSave(prev => prev + 1);
      }
      onContentChange?.(content, hasRealChanges);
    }, throttleMs),
    [onContentChange, throttleMs]
  );

  const debouncedSave = useMemo(
    () => debounce(() => {
      if (!mountedRef.current) return;
      
      if (changesSinceLastSave >= autoSaveThreshold) {
        onSave?.();
        setChangesSinceLastSave(0);
      }
    }, debounceMs),
    [onSave, debounceMs, autoSaveThreshold, changesSinceLastSave]
  );

  // Optimized change detection
  const detectRealChanges = useCallback((newContent: string): boolean => {
    const newHash = generateContentHash(newContent.trim());
    const oldHash = lastContentHashRef.current;
    
    if (newHash === oldHash) return false;
    
    lastContentHashRef.current = newHash;
    return true;
  }, []);

  const handleTypingStart = useCallback(() => {
    if (!mountedRef.current) return;
    
    setIsTyping(true);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setIsTyping(false);
        debouncedSave();
      }
    }, debounceMs);
  }, [debouncedSave, debounceMs]);

  // Stabilized enhanced props
  const enhancedProps = useMemo(() => {
    const originalProps = (children.props as Record<string, any>) || {};
    
    return {
      ...originalProps,
      onChange: (newEditorState: EditorState) => {
        // Always call original onChange first
        originalProps.onChange?.(newEditorState);
        
        const content = newEditorState.getCurrentContent();
        const plainText = content.getPlainText();
        const hasRealChanges = detectRealChanges(plainText);

        if (hasRealChanges) {
          handleTypingStart();
          throttledContentChange(convertToRaw(content), true);
        } else {
          throttledContentChange(convertToRaw(content), false);
        }
      },
    };
  }, [children.props, detectRealChanges, handleTypingStart, throttledContentChange]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      throttledContentChange.cancel();
      debouncedSave.cancel();
    };
  }, [throttledContentChange, debouncedSave]);

  return (
    <div className="smart-editor-wrapper relative">
      {React.cloneElement(children, enhancedProps)}
      
      {/* Typing indicator */}
      {isTyping && (
        <div className="absolute top-2 right-2 flex items-center text-xs text-blue-400 bg-gray-800 px-2 py-1 rounded">
          <div className="flex space-x-1 mr-2">
            <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
            <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
            <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
          </div>
          Typing...
        </div>
      )}

      {/* Changes counter */}
      {changesSinceLastSave > 0 && (
        <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
          {changesSinceLastSave} unsaved changes
        </div>
      )}
    </div>
  );
};
