/**
 * Safe Image Component
 * Handles Firebase Storage 403 errors gracefully with fallback images
 */

'use client';

import NextImage, { ImageProps } from 'next/image';
import { useState } from 'react';

interface SafeImageProps extends Omit<ImageProps, 'onError'> {
  fallbackSrc?: string;
}

const DEFAULT_FALLBACK = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="14" dy="10" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EImage%3C/text%3E%3C/svg%3E';

export default function SafeImage({ 
  src, 
  fallbackSrc = DEFAULT_FALLBACK,
  alt,
  ...props 
}: SafeImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallbackSrc);
      // Suppress console error for Firebase Storage 403s
      if (typeof src === 'string' && src.includes('storage.googleapis.com')) {
        console.debug('[SafeImage] Firebase Storage image failed, using fallback:', src);
      }
    }
  };

  return (
    <NextImage
      {...props}
      src={imgSrc}
      alt={alt}
      onError={handleError}
    />
  );
}
