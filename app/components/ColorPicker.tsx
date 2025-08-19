import React, { useState, useRef, useEffect } from 'react';

interface ColorPickerProps {
  colors: string[];
  currentColor: string | null;
  onColorSelect: (color: string) => void;
  onColorPickerOpen: () => void;
  label: string;
  type: 'text' | 'highlight';
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  colors,
  currentColor,
  onColorSelect,
  onColorPickerOpen,
  label,
  type,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
        className={`px-3 py-1 rounded text-sm font-medium transition-colors border ${
          currentColor
            ? 'bg-blue-100 text-blue-700 border-blue-300'
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
        }`}
        title={`${label} (current: ${currentColor || 'default'})`}
        type="button"
      >
        <span className="flex items-center gap-2">
          <span
            className="w-4 h-4 rounded border border-gray-300"
            style={{
              backgroundColor: currentColor || (type === 'text' ? '#000000' : 'transparent'),
            }}
          />
          {type === 'text' ? 'Text' : 'Highlight'}
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-50 p-3 min-w-[250px]">
          <div className="grid grid-cols-5 gap-2 mb-3">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => {
                  onColorSelect(color);
                  setIsOpen(false);
                }}
                className={`w-8 h-8 rounded border-2 hover:scale-110 transition-transform ${
                  currentColor === color ? 'border-blue-500' : 'border-gray-300'
                }`}
                style={{ backgroundColor: color }}
                title={color}
                type="button"
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                onColorPickerOpen();
                setIsOpen(false);
              }}
              className="flex-1 px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              type="button"
            >
              Custom Color
            </button>
            {currentColor && (
              <button
                onClick={() => {
                  onColorSelect('');
                  setIsOpen(false);
                }}
                className="flex-1 px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                type="button"
              >
                Remove {type}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};