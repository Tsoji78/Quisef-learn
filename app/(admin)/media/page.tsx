"use client";
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter for navigation
import { 
  Upload, 
  Plus, 
  Edit3, 
  Trash2, 
  Link, 
  Image, 
  Video, 
  FileText,
  Check,
  X,
  Play,
  ExternalLink,
  Youtube,
  Copy,
  CheckCircle,
  Code,
  Download,
  Globe,
  ArrowLeft // Added ArrowLeft icon for the back button
} from 'lucide-react';

// Types
interface MediaItem {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video' | 'gif' | 'youtube' | 'vimeo' | 'external';
  timestamp: Date;
  embedCode: string;
  fileSize: number;
  publicId: string;
  thumbnailUrl?: string;
  isExternal?: boolean;
}

// Utility functions
const getYouTubeVideoId = (url: string): string | null => {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

const getVimeoVideoId = (url: string): string | null => {
  const regex = /vimeo\.com\/(\d+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

const detectMediaType = (url: string) => {
  const youtubeId = getYouTubeVideoId(url);
  if (youtubeId) {
    return {
      type: 'youtube' as const,
      embedCode: `<iframe width="560" height="315" src="https://www.youtube.com/embed/${youtubeId}" frameborder="0" allowfullscreen></iframe>`,
      thumbnailUrl: `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
    };
  }

  const vimeoId = getVimeoVideoId(url);
  if (vimeoId) {
    return {
      type: 'vimeo' as const,
      embedCode: `<iframe src="https://player.vimeo.com/video/${vimeoId}" width="560" height="315" frameborder="0" allowfullscreen></iframe>`,
      thumbnailUrl: `https://vumbnail.com/${vimeoId}.jpg`
    };
  }

  const extension = url.split('.').pop()?.toLowerCase();
  if (['mp4', 'webm', 'ogg', 'mov'].includes(extension || '')) {
    return {
      type: 'video' as const,
      embedCode: `<video controls style="max-width: 100%; height: auto;"><source src="${url}" type="video/${extension}">Your browser does not support the video tag.</video>`
    };
  }

  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) {
    const type = extension === 'gif' ? 'gif' : 'image';
    return {
      type: type as 'image' | 'gif',
      embedCode: `<img src="${url}" alt="External image" style="max-width: 100%; height: auto;" />`
    };
  }

  return {
    type: 'external' as const,
    embedCode: `<a href="${url}" target="_blank">${url}</a>`
  };
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Cloudinary upload function
const uploadToCloudinary = async (file: File): Promise<{url: string, publicId: string, thumbnailUrl?: string}> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'your_upload_preset'); // Replace with your Cloudinary upload preset
  
  const isVideo = file.type.startsWith('video/');
  const endpoint = isVideo 
    ? `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload`
    : `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`;

  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  const result = await response.json();
  
  return {
    url: result.secure_url,
    publicId: result.public_id,
    thumbnailUrl: isVideo ? result.secure_url.replace(/\.[^/.]+$/, ".jpg") : undefined
  };
};

// Components
const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) => (
  <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white ${
    type === 'success' ? 'bg-green-500' : 
    type === 'error' ? 'bg-red-500' : 'bg-blue-500'
  }`}>
    <div className="flex items-center justify-between">
      <span>{message}</span>
      <button onClick={onClose} className="ml-4">
        <X className="w-4 h-4" />
      </button>
    </div>
  </div>
);

const UploadDropZone = ({ 
  onUpload, 
  onAddUrl, 
  uploading, 
  fileInputRef 
}: { 
  onUpload: (files: File[]) => void;
  onAddUrl: (url: string, name?: string) => void;
  uploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [url, setUrl] = useState('');
  const [urlName, setUrlName] = useState('');

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onUpload(files);
    }
  }, [onUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onUpload(files);
    }
    e.target.value = '';
  }, [onUpload]);

  const handleAddUrl = () => {
    if (url.trim()) {
      onAddUrl(url.trim(), urlName.trim() || undefined);
      setUrl('');
      setUrlName('');
      setShowUrlInput(false);
    }
  };

  return (
    <div className="mb-8">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
          dragOver 
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800/70'
        }`}
      >
        {uploading ? (
          <div className="space-y-4">
            <div className="animate-spin mx-auto w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full"></div>
            <p className="text-gray-600 dark:text-gray-300">Uploading to Cloudinary...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto" />
            <div>
              <p className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-2">
                Drop files here or click to browse
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Support for images, videos, and GIFs
              </p>
            </div>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center transition-colors"
              >
                <Plus className="mr-2 w-4 h-4" />
                Choose Files
              </button>
              <button
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="bg-gray-600 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 text-gray-100 dark:text-gray-200 px-6 py-2 rounded-lg flex items-center transition-colors"
              >
                <Globe className="mr-2 w-4 h-4" />
                Add URL
              </button>
            </div>
          </div>
        )}
      </div>

      {showUrlInput && (
        <div className="mt-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3">
          <input
            type="url"
            placeholder="Enter URL (YouTube, Vimeo, or direct media link)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="text"
            placeholder="Custom name (optional)"
            value={urlName}
            onChange={(e) => setUrlName(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddUrl}
              disabled={!url.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
            >
              Add Media
            </button>
            <button
              onClick={() => setShowUrlInput(false)}
              className="bg-gray-500 dark:bg-gray-600 hover:bg-gray-600 dark:hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

const MediaCard = ({ 
  item, 
  onDelete, 
  onEdit, 
  onShowEmbed, 
  editingItem, 
  setEditingItem 
}: {
  item: MediaItem;
  onDelete: (id: string) => void;
  onEdit: (id: string, name: string) => void;
  onShowEmbed: (item: MediaItem) => void;
  editingItem: string | null;
  setEditingItem: (id: string | null) => void;
}) => {
  const [editName, setEditName] = useState('');

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="text-blue-400 w-3 h-3" />;
      case 'video': return <Video className="text-red-400 w-3 h-3" />;
      case 'gif': return <Image className="text-green-400 w-3 h-3" />;
      case 'youtube': return <Youtube className="text-red-500 w-3 h-3" />;
      case 'vimeo': return <Video className="text-blue-500 w-3 h-3" />;
      case 'external': return <ExternalLink className="text-purple-400 w-3 h-3" />;
      default: return <FileText className="text-gray-400 w-3 h-3" />;
    }
  };

  const handleStartEdit = () => {
    setEditName(item.name);
    setEditingItem(item.id);
  };

  const handleSaveEdit = () => {
    if (editName.trim()) {
      onEdit(item.id, editName.trim());
    }
    setEditingItem(null);
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditName('');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 dark:border-gray-700">
      {/* Media Preview */}
      <div className="relative h-48 bg-gray-100 dark:bg-gray-700 rounded-t-lg overflow-hidden">
        {item.type === 'youtube' && item.thumbnailUrl ? (
          <div className="relative w-full h-full">
            <img
              src={item.thumbnailUrl}
              alt={item.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
              <div className="bg-red-600 rounded-full p-3">
                <Play className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        ) : item.type === 'vimeo' && item.thumbnailUrl ? (
          <div className="relative w-full h-full">
            <img
              src={item.thumbnailUrl}
              alt={item.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
              <div className="bg-blue-600 rounded-full p-3">
                <Play className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        ) : item.type === 'video' ? (
          <div className="relative w-full h-full">
            <video
              src={item.url}
              className="w-full h-full object-cover"
              preload="metadata"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
              <Play className="w-12 h-12 text-white opacity-80" />
            </div>
          </div>
        ) : item.type === 'external' ? (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/50 dark:to-purple-800/50">
            <div className="text-center">
              <ExternalLink className="w-16 h-16 text-purple-500 dark:text-purple-400 mx-auto mb-2" />
              <p className="text-sm text-purple-600 dark:text-purple-300 font-medium">External Link</p>
            </div>
          </div>
        ) : (
          <img
            src={item.url}
            alt={item.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        )}
        
        {/* Type Badge */}
        <div className="absolute top-2 left-2 bg-black bg-opacity-80 text-white px-2 py-1 rounded text-xs flex items-center">
          {getFileIcon(item.type)}
          <span className="ml-1 capitalize">{item.type}</span>
        </div>
        
        {/* Cloudinary Badge */}
        {!item.isExternal && (
          <div className="absolute top-2 right-2 bg-orange-600 text-white px-2 py-1 rounded text-xs font-medium">
            Cloudinary
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title and Edit */}
        <div className="mb-3">
          {editingItem === item.id ? (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="flex-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleSaveEdit();
                  if (e.key === 'Escape') handleCancelEdit();
                }}
                autoFocus
              />
              <button
                onClick={handleSaveEdit}
                className="text-green-500 hover:text-green-400 p-1"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={handleCancelEdit}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <h3 className="font-medium text-gray-800 dark:text-gray-200 truncate" title={item.name}>
              {item.name}
            </h3>
          )}
        </div>

        {/* Metadata */}
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
          <span>{item.isExternal ? 'External' : formatFileSize(item.fileSize)}</span>
          <span>{new Date(item.timestamp).toLocaleDateString()}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              onClick={handleStartEdit}
              className="text-blue-500 hover:text-blue-400 p-1 rounded transition-colors"
              title="Edit name"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="text-red-500 hover:text-red-400 p-1 rounded transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          
          <button
            onClick={() => onShowEmbed(item)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs flex items-center transition-colors"
          >
            <Link className="w-3 h-3 mr-1" />
            Embed
          </button>
        </div>
      </div>
    </div>
  );
};

const EmbedPanel = ({ item, onClose }: { item: MediaItem; onClose: () => void }) => {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const generateMarkdown = () => {
    if (item.type === 'video' || item.type === 'youtube' || item.type === 'vimeo') {
      return `[![${item.name}](${item.thumbnailUrl || item.url})](${item.url})`;
    }
    return `![${item.name}](${item.url})`;
  };

  const getEmbedUrl = (item: MediaItem) => {
    if (item.type === 'youtube') {
      const youtubeId = getYouTubeVideoId(item.url);
      return youtubeId ? `https://www.youtube.com/embed/${youtubeId}` : item.url;
    }
    if (item.type === 'vimeo') {
      const vimeoId = getVimeoVideoId(item.url);
      return vimeoId ? `https://player.vimeo.com/video/${vimeoId}` : item.url;
    }
    return item.url;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 h-fit sticky top-8">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Embed & Share</h3>
        <button
          onClick={onClose}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Media Preview */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative w-full h-32 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden mb-3">
          {item.type === 'youtube' && item.thumbnailUrl ? (
            <div className="relative w-full h-full">
              <img src={item.thumbnailUrl} alt={item.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                <div className="bg-red-600 rounded-full p-2">
                  <Play className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ) : item.type === 'external' ? (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/50 dark:to-purple-800/50">
              <ExternalLink className="w-12 h-12 text-purple-500 dark:text-purple-400" />
            </div>
          ) : (
            <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
          )}
        </div>
        
        <h4 className="font-medium text-gray-800 dark:text-gray-200 truncate">{item.name}</h4>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span className="capitalize">{item.type}</span>
          {!item.isExternal && <span className="ml-2">{formatFileSize(item.fileSize)}</span>}
          {item.publicId && (
            <span className="ml-2 text-orange-500">• Cloudinary</span>
          )}
        </div>
      </div>

      {/* Links */}
      <div className="p-4 space-y-4">
        {/* Direct URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Link className="w-4 h-4 inline mr-1" />
            Direct URL
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={item.url}
              readOnly
              className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm text-gray-700 dark:text-gray-300"
            />
            <button
              onClick={() => copyToClipboard(item.url, 'URL')}
              className="text-blue-500 hover:text-blue-400 transition-colors p-2"
            >
              {copied === item.url ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* HTML Embed */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Code className="w-4 h-4 inline mr-1" />
            Embed URL
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={getEmbedUrl(item)}
              readOnly
              className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm text-gray-700 dark:text-gray-300 font-mono"
            />
            <button
              onClick={() => copyToClipboard(getEmbedUrl(item), 'Embed URL')}
              className="text-blue-500 hover:text-blue-400 transition-colors p-2"
            >
              {copied === getEmbedUrl(item) ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Full HTML Embed */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Code className="w-4 h-4 inline mr-1" />
            Full HTML Embed
          </label>
          <div className="flex items-start space-x-2">
            <textarea
              value={item.embedCode}
              readOnly
              className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm text-gray-700 dark:text-gray-300 font-mono"
              rows={3}
            />
            <button
              onClick={() => copyToClipboard(item.embedCode, 'HTML')}
              className="text-blue-500 hover:text-blue-400 transition-colors p-2"
            >
              {copied === item.embedCode ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Markdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Markdown</label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={generateMarkdown()}
              readOnly
              className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm text-gray-700 dark:text-gray-300 font-mono"
            />
            <button
              onClick={() => copyToClipboard(generateMarkdown(), 'Markdown')}
              className="text-blue-500 hover:text-blue-400 transition-colors p-2"
            >
              {copied === generateMarkdown() ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-b-lg">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Uploaded {new Date(item.timestamp).toLocaleDateString()}
          {item.publicId && <span className="text-orange-500"> • Via Cloudinary</span>}
        </p>
      </div>
    </div>
  );
};

// Main MediaManager Component
const MediaManager = () => {
  const router = useRouter(); // Initialize useRouter for navigation
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null) as React.RefObject<HTMLInputElement>;

  // Generate unique ID
  const generateId = () => {
    return Math.random().toString(36).substr(2, 9);
  };

  // Handle file upload
  const handleUpload = async (files: File[]) => {
    setUploading(true);
    try {
      const uploadedItems: MediaItem[] = [];
      for (const file of files) {
        const { url, publicId, thumbnailUrl } = await uploadToCloudinary(file);
        const extension = file.name.split('.').pop()?.toLowerCase();
        const type = ['mp4', 'webm', 'ogg', 'mov'].includes(extension || '')
          ? 'video'
          : extension === 'gif'
          ? 'gif'
          : 'image';
        const embedCode = type === 'video'
          ? `<video controls style="max-width: 100%; height: auto;"><source src="${url}" type="video/${extension}">Your browser does not support the video tag.</video>`
          : `<img src="${url}" alt="${file.name}" style="max-width: 100%; height: auto;" />`;

        uploadedItems.push({
          id: generateId(),
          name: file.name,
          url,
          type,
          timestamp: new Date(),
          embedCode,
          fileSize: file.size,
          publicId,
          thumbnailUrl,
        });
      }
      setMediaItems((prev) => [...uploadedItems, ...prev]);
      setToast({ message: `${files.length} file(s) uploaded successfully`, type: 'success' });
    } catch (error) {
      setToast({ message: 'Failed to upload files', type: 'error' });
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  // Handle URL addition
  const handleAddUrl = (url: string, name?: string) => {
    try {
      const { type, embedCode, thumbnailUrl } = detectMediaType(url);
      const mediaItem: MediaItem = {
        id: generateId(),
        name: name || url.split('/').pop() || 'External Media',
        url,
        type,
        timestamp: new Date(),
        embedCode,
        fileSize: 0,
        publicId: '',
        thumbnailUrl,
        isExternal: true,
      };
      setMediaItems((prev) => [mediaItem, ...prev]);
      setToast({ message: 'URL added successfully', type: 'success' });
    } catch (error) {
      setToast({ message: 'Failed to add URL', type: 'error' });
      console.error('Add URL error:', error);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    const item = mediaItems.find((item) => item.id === id);
    if (!item) return;

    if (!item.isExternal && item.publicId) {
      try {
        // Optional: Add Cloudinary deletion API call
        // await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/resources/image/upload/${item.publicId}`, {
        //   method: 'DELETE',
        //   headers: {
        //     Authorization: `Basic ${btoa(`${process.env.CLOUDINARY_API_KEY}:${process.env.CLOUDINARY_API_SECRET}`)}`
        //   }
        // });
        setMediaItems((prev) => prev.filter((item) => item.id !== id));
        setToast({ message: 'Media deleted successfully', type: 'success' });
      } catch (error) {
        setToast({ message: 'Failed to delete media', type: 'error' });
        console.error('Delete error:', error);
      }
    } else {
      setMediaItems((prev) => prev.filter((item) => item.id !== id));
      setToast({ message: 'Media deleted successfully', type: 'success' });
    }
    if (selectedItem?.id === id) {
      setSelectedItem(null);
    }
  };

  // Handle edit
  const handleEdit = (id: string, name: string) => {
    setMediaItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, name } : item
      )
    );
    setToast({ message: 'Media name updated', type: 'success' });
  };

  // Handle show embed
  const handleShowEmbed = (item: MediaItem) => {
    setSelectedItem(item);
  };

  // Close toast
  const closeToast = () => {
    setToast(null);
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
          Media Manager
        </h1>
        <button
          onClick={() => router.push('/')}
          className="bg-gray-600 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 text-gray-100 dark:text-gray-200 px-4 py-2 rounded-lg flex items-center transition-colors"
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back to Homepage
        </button>
      </div>

      {/* Upload Drop Zone */}
      <UploadDropZone
        onUpload={handleUpload}
        onAddUrl={handleAddUrl}
        uploading={uploading}
        fileInputRef={fileInputRef}
      />

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}

      {/* Media Grid */}
      <div className="flex gap-6">
        <div className="flex-1">
          {mediaItems.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              <p>No media items yet. Upload files or add URLs to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {mediaItems.map((item) => (
                <MediaCard
                  key={item.id}
                  item={item}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  onShowEmbed={handleShowEmbed}
                  editingItem={editingItem}
                  setEditingItem={setEditingItem}
                />
              ))}
            </div>
          )}
        </div>

        {/* Embed Panel */}
        {selectedItem && (
          <div className="w-96">
            <EmbedPanel
              item={selectedItem}
              onClose={() => setSelectedItem(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaManager;