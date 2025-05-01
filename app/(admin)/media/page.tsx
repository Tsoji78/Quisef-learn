// media/page.tsx
"use client"
import { useState, useRef, ChangeEvent } from 'react';
import Head from 'next/head';
import { FiUpload, FiCopy, FiCheckCircle, FiX, FiImage, FiVideo, FiFileText, FiLink, FiCode } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Define types for our media items
interface MediaItem {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video' | 'gif';
  timestamp: Date;
  embedCode: string;
}

// Environment variables for Cloudinary (store these securely in your .env file)
const cloud_name = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

// Custom hook for clipboard functionality
const useCopyToClipboard = () => {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      setTimeout(() => setCopied(null), 2000);
      toast.success('Copied to clipboard!');
      return true;
    } catch (error) {
      console.error('Failed to copy text: ', error);
      toast.error('Failed to copy. Try again.');
      return false;
    }
  };

  return { copied, copyToClipboard };
};

export default function MediaUploadHub() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [customName, setCustomName] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { copied, copyToClipboard } = useCopyToClipboard();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files: FileList) => {
    const fileArray = Array.from(files);
    setSelectedFiles(fileArray);
    
    // If only one file is selected, we can use its name as the default custom name
    if (fileArray.length === 1 && !customName) {
      // Remove extension from filename
      const fileName = fileArray[0].name.split('.').slice(0, -1).join('.');
      setCustomName(fileName);
    }
  };

  const startUpload = () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select files to upload first');
      return;
    }
    
    selectedFiles.forEach(file => {
      uploadToCloudinary(file);
    });
    
    // Clear selected files after upload starts
    setSelectedFiles([]);
  };

  const uploadToCloudinary = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);
  
    if (!cloud_name || !CLOUDINARY_UPLOAD_PRESET) {
      toast.error('Cloudinary configuration is missing.');
      setUploading(false);
      return;
    }
  
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  
    if (customName) {
      formData.append('public_id', customName);
    }
  
    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + 10;
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 500);
  
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloud_name}/auto/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );
  
      clearInterval(progressInterval);
      setUploadProgress(100);
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Cloudinary error response:', errorData);
        throw new Error(`Upload failed: ${errorData.message || 'Unknown error'}`);
      }
  
      const data = await response.json();
      let fileType: 'image' | 'video' | 'gif' = 'image';
      if (file.type.includes('video')) {
        fileType = 'video';
      } else if (file.name.endsWith('.gif')) {
        fileType = 'gif';
      }
  
      let embedCode = '';
      if (fileType === 'image' || fileType === 'gif') {
        embedCode = `<img src="${data.secure_url}" alt="${customName || file.name}" />`;
      } else if (fileType === 'video') {
        embedCode = `<video controls src="${data.secure_url}"></video>`;
      }
  
      const newItem: MediaItem = {
        id: data.public_id,
        name: customName || file.name,
        url: data.secure_url,
        type: fileType,
        timestamp: new Date(),
        embedCode: embedCode,
      };
  
      setMediaItems(prev => [newItem, ...prev]);
      setCustomName('');
      toast.success(`"${newItem.name}" uploaded successfully!`);
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      const errorMessage = error instanceof Error ? error.message : 'Please check your Cloudinary credentials.';
      toast.error(`Upload failed: ${errorMessage}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const removeItem = (id: string) => {
    setMediaItems(prev => prev.filter(item => item.id !== id));
    toast.info('Media item removed');
  };

  // Get file type icon
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <FiImage className="text-blue-500" />;
      case 'video':
        return <FiVideo className="text-red-500" />;
      case 'gif':
        return <FiFileText className="text-green-500" />;
      default:
        return <FiFileText className="text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Stream Media Upload Hub</title>
        <meta name="description" content="Upload and manage your stream media files" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <ToastContainer position="top-right" autoClose={3000} />

      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Stream Media Upload Hub</h1>
        
        {/* Upload section */}
        <div className="mb-8">
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center">
              <div className="mb-4">
                <FiUpload size={48} className="text-gray-400" />
              </div>
              <p className="text-xl font-medium text-gray-700 mb-2">
                Drag and drop your files here
              </p>
              <p className="text-sm text-gray-500 mb-6">
                or click to browse (Images, Videos, GIFs)
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 items-center w-full max-w-md">
                <input
                  type="text"
                  placeholder="Custom name (optional)"
                  className="border border-gray-300 rounded-md px-4 py-2 w-full"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                />
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md flex items-center"
                  disabled={uploading}
                >
                  <span className="mr-2">
                    <FiUpload />
                  </span>
                  Select Files
                </button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*,.gif"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
              
              {/* Selected files preview */}
              {selectedFiles.length > 0 && (
                <div className="mt-6 w-full max-w-md">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    {selectedFiles.length} file(s) selected:
                  </p>
                  <ul className="bg-white rounded-md border border-gray-200 divide-y divide-gray-200 text-left">
                    {selectedFiles.map((file, index) => (
                      <li key={index} className="px-4 py-2 flex items-center justify-between">
                        <div className="flex items-center">
                          {file.type.includes('image') ? <FiImage className="text-blue-500 mr-2" /> : 
                           file.type.includes('video') ? <FiVideo className="text-red-500 mr-2" /> : 
                           <FiFileText className="text-green-500 mr-2" />}
                          <span className="text-sm truncate max-w-xs" title={file.name}>{file.name}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      </li>
                    ))}
                  </ul>
                  
                  <button
                    type="button"
                    onClick={startUpload}
                    className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md flex items-center justify-center w-full"
                    disabled={uploading}
                  >
                    {uploading ? (
                      'Uploading...'
                    ) : (
                      <>
                        <span className="mr-2">Upload to Cloudinary</span>
                        <FiUpload />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Upload progress */}
          {uploading && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2 text-center">
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}
        </div>
        
        {/* Media gallery */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Stream Media ({mediaItems.length})</h2>
          
          {mediaItems.length === 0 ? (
            <div className="text-center py-12 bg-gray-100 rounded-lg">
              <p className="text-gray-500">No media items yet. Upload something to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {mediaItems.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="h-48 bg-gray-200 relative">
                    {item.type === 'image' || item.type === 'gif' ? (
                      <img
                        src={item.url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : item.type === 'video' ? (
                      <video
                        src={item.url}
                        className="w-full h-full object-cover"
                        controls
                      />
                    ) : null}
                    
                    <button
                      onClick={() => removeItem(item.id)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      title="Remove"
                    >
                      <FiX />
                    </button>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        {getFileIcon(item.type)}
                        <span className="ml-2 text-sm text-gray-600">{item.type}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <h3 className="font-medium text-gray-900 truncate" title={item.name}>
                      {item.name}
                    </h3>
                    
                    {/* URL Copy Section */}
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-1">Direct URL:</p>
                      <div className="flex items-center">
                        <div className="flex-1 overflow-hidden bg-gray-100 rounded px-2 py-1">
                          <p className="text-xs text-gray-600 truncate" title={item.url}>
                            {item.url}
                          </p>
                        </div>
                        
                        <button
                          onClick={() => copyToClipboard(item.url)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                          title="Copy URL"
                        >
                          {copied === item.url ? (
                            <FiCheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <FiLink className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    {/* Embed Code Section */}
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-1">Embed Code:</p>
                      <div className="flex items-center">
                        <div className="flex-1 overflow-hidden bg-gray-100 rounded px-2 py-1">
                          <p className="text-xs text-gray-600 truncate" title={item.embedCode}>
                            {item.embedCode}
                          </p>
                        </div>
                        
                        <button
                          onClick={() => copyToClipboard(item.embedCode)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                          title="Copy Embed Code"
                        >
                          {copied === item.embedCode ? (
                            <FiCheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <FiCode className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}