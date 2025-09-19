// components/SafeImage.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';

interface SafeImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallbackInitials?: string;
  onClick?: () => void;
}

const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  width = 40,
  height = 40,
  className = '',
  fallbackInitials = 'U',
  onClick
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if it's a Google profile image or other external URL
  const isExternalUrl = src.startsWith('http') && !src.startsWith(window.location.origin);

  if (imageError || !src) {
    return (
      <div 
        className={`bg-indigo-600 flex items-center justify-center text-white font-medium rounded-full ${className}`}
        style={{ width, height }}
        onClick={onClick}
      >
        {fallbackInitials}
      </div>
    );
  }

  if (isExternalUrl) {
    // Use regular img tag for external URLs to avoid Next.js config issues
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        onClick={onClick}
        onError={() => setImageError(true)}
        onLoad={() => setIsLoading(false)}
        style={{ 
          width, 
          height, 
          objectFit: 'cover',
          display: isLoading ? 'none' : 'block'
        }}
      />
    );
  }

  // Use Next.js Image for local images
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onClick={onClick}
      onError={() => setImageError(true)}
    />
  );
};

export default SafeImage;