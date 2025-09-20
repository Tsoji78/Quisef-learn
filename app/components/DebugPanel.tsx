import { memo, useState } from 'react';

interface DebugPanelProps {
  debugInfo?: Record<string, any>;
}

const DebugPanel = memo(({ debugInfo = {} }: DebugPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);

  console.log('DebugPanel rendered');

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-90 text-white p-4 rounded-lg text-xs max-w-sm max-h-60 overflow-auto z-50">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-bold">🐛 Debug Info</h4>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-gray-400 hover:text-white"
        >
          {isOpen ? 'Hide' : 'Show'}
        </button>
      </div>
      {isOpen && (
        <div className="space-y-1">
          {Object.entries(debugInfo).map(([key, value]) => (
            <div key={key}>
              <strong>{key}:</strong>{' '}
              {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
            </div>
          ))}
          <div>
            <strong>Environment:</strong> {process.env.NODE_ENV}
          </div>
          <div>
            <strong>URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'SSR'}
          </div>
        </div>
      )}
    </div>
  );
});

export default DebugPanel;