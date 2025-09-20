import React from 'react';
import { Award } from 'lucide-react';

interface CertificateBannerProps {
  isVisible: boolean;
  onViewCertificate: () => void;
  onClose: () => void;
}

export const CertificateBanner: React.FC<CertificateBannerProps> = ({
  isVisible,
  onViewCertificate,
  onClose
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg max-w-sm">
      <div className="flex items-start space-x-3">
        <Award className="w-6 h-6 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold mb-1">Certificate Available!</h4>
          <p className="text-sm text-green-100 mb-2">
            Download your certificate of completion
          </p>
          <button
            onClick={onViewCertificate}
            className="text-sm bg-green-700 hover:bg-green-800 px-3 py-1 rounded transition-colors"
          >
            View Certificate
          </button>
        </div>
        <button
          onClick={onClose}
          className="text-green-200 hover:text-white"
        >
          ×
        </button>
      </div>
    </div>
  );
};