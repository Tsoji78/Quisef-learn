import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Type } from 'lucide-react';

interface FontStylePickerProps {
  currentFont?: string | null;
  onFontSelect: (fontFamily: string) => void;
  disabled?: boolean;
}

// Common web-safe and Google Fonts
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

export const FontStylePicker: React.FC<FontStylePickerProps> = ({
  currentFont,
  onFontSelect,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Find current font display name
  const getCurrentFontName = () => {
    if (!currentFont) return 'Default';
    const font = FONT_FAMILIES.find(f => f.value === currentFont);
    return font ? font.name : 'Custom';
  };

  const handleFontSelect = (fontValue: string) => {
    onFontSelect(fontValue);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center gap-2 px-3 py-2 rounded text-sm border transition-colors
          ${disabled 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
          }
        `}
        type="button"
        title="Font Family"
      >
        <Type size={14} />
        <span className="min-w-0 truncate">{getCurrentFontName()}</span>
        <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs text-gray-500 mb-2 px-2 py-1">Choose Font Family</div>
            {FONT_FAMILIES.map((font) => (
              <button
                key={font.value || 'default'}
                onClick={() => handleFontSelect(font.value)}
                className={`
                  w-full text-left px-3 py-2 rounded hover:bg-gray-100 transition-colors
                  flex flex-col gap-1
                  ${currentFont === font.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}
                `}
                type="button"
              >
                <span 
                  className="font-medium text-sm"
                  style={{ fontFamily: font.value || 'inherit' }}
                >
                  {font.name}
                </span>
                <span 
                  className="text-xs text-gray-500"
                  style={{ fontFamily: font.value || 'inherit' }}
                >
                  {font.preview}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FontStylePicker;