import React from 'react';
import { Award, Share2 } from 'lucide-react';
import { Course } from '@/types';

interface CertificateModalProps {
  course: Course;
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
  onShare: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  course,
  isOpen,
  onClose,
  onDownload,
  onShare
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
            Congratulations! 🎉
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You have successfully completed <strong>{course.title}</strong> and earned your certificate!
          </p>
          
          <div className="space-y-3">
            <button
              onClick={onDownload}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              <Award size={16} className="mr-2" />
              Download Certificate
            </button>
            
            <button
              onClick={onShare}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              <Share2 size={16} className="mr-2" />
              Share Certificate
            </button>
            
            <button
              onClick={onClose}
              className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};