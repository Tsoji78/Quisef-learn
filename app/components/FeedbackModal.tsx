import { Loader } from 'lucide-react';
import { ModalState } from '@/types';

interface FeedbackModalProps {
  modal: ModalState;
  onClose: () => void;
  isEditing: boolean;
}

export default function FeedbackModal({ modal, onClose, isEditing }: FeedbackModalProps) {
  if (!modal.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={modal.status === 'error' ? onClose : undefined}>
          <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
        </div>
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6">
            <div className="sm:flex sm:items-start">
              <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10 ${modal.status === 'success' ? 'bg-green-100' : modal.status === 'uploading' ? 'bg-blue-100' : 'bg-red-100'}`}>
                {modal.status === 'success' ? (
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                ) : modal.status === 'uploading' ? (
                  <Loader className="h-6 w-6 text-blue-600 animate-spin" />
                ) : (
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                  {modal.status === 'success' ? (isEditing ? 'Course Updated' : 'Course Created') : modal.status === 'uploading' ? 'Uploading' : 'Operation Failed'}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{modal.message}</p>
                </div>
              </div>
            </div>
          </div>
          {(modal.status === 'error' || modal.status === 'uploading') && (
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                onClick={onClose}
                className="w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                {modal.status === 'uploading' ? 'Cancel' : 'Close'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}