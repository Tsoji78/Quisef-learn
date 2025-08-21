"use client"
import { useState, useRef, ChangeEvent, useEffect } from 'react';
import Head from 'next/head';
import { FiUpload, FiCopy, FiCheckCircle, FiX, FiImage, FiVideo, FiFileText, FiLink, FiCode, FiDownload } from 'react-icons/fi';
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
  fileSize: number;
  publicId: string;
}

// Enhanced Cloudinary upload function
export const uploadToCloudinary = async (file: File, resourceType: 'image' | 'video', customName?: string): Promise<{url: string, publicId: string}> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '');
  
  if (customName) {
    formData.append('public_id', customName);
  }

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Cloudinary upload failed: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    return {
      url: data.secure_url,
      publicId: data.public_id
    };
  } catch (error) {
    throw new Error(`Cloudinary upload error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

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

// Client-side storage utilities
const STORAGE_KEY = 'stream_media_items';

const saveToClientStorage = (items: MediaItem[]) => {
  try {
    const itemsToStore = items.map(item => ({
      ...item,
      timestamp: item.timestamp.toISOString()
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(itemsToStore));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

const loadFromClientStorage = (): MediaItem[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const items = JSON.parse(stored);
      return items.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      }));
    }
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
  }
  return [];
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

  // Load saved media items on component mount
  useEffect(() => {
    const savedItems = loadFromClientStorage();
    setMediaItems(savedItems);
  }, []);

  // Save media items whenever the list changes
  useEffect(() => {
    if (mediaItems.length > 0) {
      saveToClientStorage(mediaItems);
    }
  }, [mediaItems]);

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
    
    // If only one file is selected, use its name as the default custom name
    if (fileArray.length === 1 && !customName) {
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
      uploadFile(file);
    });
    
    // Clear selected files after upload starts
    setSelectedFiles([]);
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);

    // Determine resource type and file type
    let resourceType: 'image' | 'video' = 'image';
    let fileType: 'image' | 'video' | 'gif' = 'image';
    
    if (file.type.includes('video')) {
      resourceType = 'video';
      fileType = 'video';
    } else if (file.name.toLowerCase().endsWith('.gif')) {
      fileType = 'gif';
    }

    // Progress simulation
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        const newProgress = prev + 10;
        return newProgress >= 90 ? 90 : newProgress;
      });
    }, 500);

    try {
      const result = await uploadToCloudinary(file, resourceType, customName);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Generate embed code based on file type
      let embedCode = '';
      if (fileType === 'image' || fileType === 'gif') {
        embedCode = `<img src="${result.url}" alt="${customName || file.name}" style="max-width: 100%; height: auto;" />`;
      } else if (fileType === 'video') {
        embedCode = `<video controls style="max-width: 100%; height: auto;"><source src="${result.url}" type="${file.type}">Your browser does not support the video tag.</video>`;
      }

      const newItem: MediaItem = {
        id: result.publicId || Date.now().toString(),
        name: customName || file.name,
        url: result.url,
        type: fileType,
        timestamp: new Date(),
        embedCode: embedCode,
        fileSize: file.size,
        publicId: result.publicId
      };

      setMediaItems(prev => [newItem, ...prev]);
      setCustomName('');
      toast.success(`"${newItem.name}" uploaded successfully!`);
    } catch (error) {
      clearInterval(progressInterval);
      console.error('Error uploading file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed. Please check your Cloudinary credentials.';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const removeItem = (id: string) => {
    setMediaItems(prev => {
      const updated = prev.filter(item => item.id !== id);
      // Update localStorage
      if (updated.length === 0) {
        localStorage.removeItem(STORAGE_KEY);
      }
      return updated;
    });
    toast.info('Media item removed');
  };

  const clearAllItems = () => {
    if (window.confirm('Are you sure you want to clear all media items? This cannot be undone.')) {
      setMediaItems([]);
      localStorage.removeItem(STORAGE_KEY);
      toast.info('All media items cleared');
    }
  };

  const exportMediaList = () => {
    const dataStr = JSON.stringify(mediaItems, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `media-list-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Media list exported successfully!');
  };

  // Get file type icon
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <FiImage className="text-blue-500" />;
      case 'video':
        return <FiVideo className="text-red-500" />;
      case 'gif':
        return <FiImage className="text-green-500" />;
      default:
        return <FiFileText className="text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Stream Media Upload Hub</h1>
          <div className="flex gap-2">
            {mediaItems.length > 0 && (
              <>
                <button
                  onClick={exportMediaList}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center text-sm"
                >
                  <FiDownload className="mr-2" />
                  Export List
                </button>
                <button
                  onClick={clearAllItems}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm"
                >
                  Clear All
                </button>
              </>
            )}
          </div>
        </div>
        
        {/* Upload section */}
        <div className="mb-8">
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
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
                  className="border border-gray-300 rounded-md px-4 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                />
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md flex items-center transition-colors"
                  disabled={uploading}
                >
                  <FiUpload className="mr-2" />
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
                <div className="mt-6 w-full max-w-2xl">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    {selectedFiles.length} file(s) selected:
                  </p>
                  <ul className="bg-white rounded-md border border-gray-200 divide-y divide-gray-200 text-left max-h-40 overflow-y-auto">
                    {selectedFiles.map((file, index) => (
                      <li key={index} className="px-4 py-2 flex items-center justify-between">
                        <div className="flex items-center min-w-0 flex-1">
                          {file.type.includes('image') ? <FiImage className="text-blue-500 mr-2 flex-shrink-0" /> : 
                           file.type.includes('video') ? <FiVideo className="text-red-500 mr-2 flex-shrink-0" /> : 
                           <FiFileText className="text-green-500 mr-2 flex-shrink-0" />}
                          <span className="text-sm truncate" title={file.name}>{file.name}</span>
                        </div>
                        <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                          {formatFileSize(file.size)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  
                  <button
                    type="button"
                    onClick={startUpload}
                    className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md flex items-center justify-center w-full transition-colors"
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
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Your Stream Media ({mediaItems.length})
          </h2>
          
          {mediaItems.length === 0 ? (
            <div className="text-center py-12 bg-gray-100 rounded-lg">
              <p className="text-gray-500">No media items yet. Upload something to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {mediaItems.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-48 bg-gray-200 relative">
                    {item.type === 'image' || item.type === 'gif' ? (
                      <img
                        src={item.url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : item.type === 'video' ? (
                      <video
                        src={item.url}
                        className="w-full h-full object-cover"
                        controls
                        preload="metadata"
                      />
                    ) : null}
                    
                    <button
                      onClick={() => removeItem(item.id)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                      title="Remove"
                    >
                      <FiX />
                    </button>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        {getFileIcon(item.type)}
                        <span className="ml-2 text-sm text-gray-600 capitalize">{item.type}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatFileSize(item.fileSize)}
                        </div>
                      </div>
                    </div>
                    
                    <h3 className="font-medium text-gray-900 truncate mb-3" title={item.name}>
                      {item.name}
                    </h3>
                    
                    {/* URL Copy Section */}
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">Direct URL:</p>
                      <div className="flex items-center">
                        <div className="flex-1 overflow-hidden bg-gray-100 rounded px-2 py-1">
                          <p className="text-xs text-gray-600 truncate" title={item.url}>
                            {item.url}
                          </p>
                        </div>
                        
                        <button
                          onClick={() => copyToClipboard(item.url)}
                          className="ml-2 text-blue-600 hover:text-blue-800 transition-colors"
                          title="Copy URL"
                        >
                          {copied === item.url ? (
                            <FiCheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <FiLink className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    {/* Embed Code Section */}
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Embed Code:</p>
                      <div className="flex items-center">
                        <div className="flex-1 overflow-hidden bg-gray-100 rounded px-2 py-1">
                          <p className="text-xs text-gray-600 truncate" title={item.embedCode}>
                            {item.embedCode}
                          </p>
                        </div>
                        
                        <button
                          onClick={() => copyToClipboard(item.embedCode)}
                          className="ml-2 text-blue-600 hover:text-blue-800 transition-colors"
                          title="Copy Embed Code"
                        >
                          {copied === item.embedCode ? (
                            <FiCheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <FiCode className="w-4 h-4" />
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