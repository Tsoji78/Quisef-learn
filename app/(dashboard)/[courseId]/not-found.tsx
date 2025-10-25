'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center p-8 max-w-lg">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
          Course Not Found
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The course you're looking for doesn't exist or has been removed.
        </p>
        <Link
          href="/courses"
          className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft size={18} className="mr-2" />
          Back to Courses
        </Link>
      </div>
    </div>
  );
}