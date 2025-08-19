import React, { useState, useRef, useEffect } from 'react';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const emojiCategories = {
    Faces: ['😊', '😂', '😍', '😢', '😮', '😡', '🤔', '😎', '🤗', '😴'],
    Gestures: ['👍', '👎', '👏', '🙌', '👋', '🤝', '✌️', '🤞', '👌', '💪'],
    Hearts: ['❤️', '💕', '💖', '💗', '💓', '💝', '💘', '💟', '💙', '💚'],
    Symbols: ['🎉', '🔥', '💯', '⭐', '✨', '⚡', '💥', '💫', '🌟', '🎊'],
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1 rounded text-sm font-medium bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition-colors"
        type="button"
      >
        😊 Emoji
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-50 p-3 max-w-sm">
          {Object.entries(emojiCategories).map(([category, emojis]) => (
            <div key={category} className="mb-3">
              <div className="text-xs font-semibold text-gray-500 mb-1">{category}</div>
              <div className="grid grid-cols-10 gap-1">
                {emojis.map((emoji, index) => (
                  <button
                    key={`${category}-${index}`}
                    onClick={() => {
                      onEmojiSelect(emoji);
                      setIsOpen(false);
                    }}
                    className="w-6 h-6 text-lg hover:bg-gray-100 rounded transition-colors flex items-center justify-center"
                    type="button"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};