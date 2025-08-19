import { Trash } from 'lucide-react';
import { Course } from '@/types';

interface ThumbnailUploaderProps {
  formData: Course;
  errors: Record<string, string>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  clearThumbnail: () => void;
  thumbnailFile: File | null;
}

export default function ThumbnailUploader({
  formData,
  errors,
  handleFileChange,
  clearThumbnail,
  thumbnailFile,
}: ThumbnailUploaderProps) {
  return (
    <div>
      <label htmlFor="thumbnail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Thumbnail Image
      </label>
      <div className="mt-1 flex items-center gap-2">
        <input
          type="file"
          id="thumbnail"
          accept="image/jpeg,image/png,image/gif"
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-700 dark:file:text-gray-300 dark:hover:file:bg-gray-600"
          onChange={handleFileChange}
        />
        {thumbnailFile && (
          <button
            onClick={clearThumbnail}
            className="flex items-center space-x-1 text-red-500 hover:text-red-700"
          >
            <Trash size={16} />
            <span>Clear</span>
          </button>
        )}
      </div>
      {errors.thumbnail && <p className="mt-1 text-sm text-red-500">{errors.thumbnail}</p>}
      {formData.thumbnail && (
        <div className="mt-2 h-32 w-48 border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
          <img
            src={formData.thumbnail}
            alt="Thumbnail preview"
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </div>
  );
}