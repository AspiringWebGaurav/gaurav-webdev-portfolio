/**
 * Custom image loader for Next.js with timeout handling
 * Handles slow-loading images from Firebase Storage
 * 
 * IMPORTANT: Must implement width parameter to avoid Next.js warnings
 */

interface ImageLoaderProps {
  src: string;
  width: number;
  quality?: number;
}

/**
 * Custom image loader for Next.js
 * Portfolio images load directly from Firebase Storage (public read)
 * Admin panel operations use signed URLs for secure write/delete
 * 
 * Width is implemented via query params for proper Next.js integration
 */
export default function imageLoader({ src, width, quality }: ImageLoaderProps): string {
  const q = quality || 75;
  
  // For Firebase Storage URLs, return direct URL (public read access)
  // Firebase doesn't support resize params, so we return as-is
  if (src.includes('storage.googleapis.com') || src.includes('firebasestorage.app')) {
    return src;
  }
  
  // For external URLs, return as-is (can't resize)
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }
  
  // For local SVG files, return as-is (SVGs scale infinitely)
  if (src.endsWith('.svg')) {
    return src;
  }
  
  // For local images, use Next.js image optimization
  // This creates proper width-based URLs that Next.js expects
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${q}`;
}

/**
 * Preload critical images with timeout
 */
export async function preloadImage(src: string, timeout: number = 10000): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    const timer = setTimeout(() => {
      img.src = ''; // Cancel loading
      console.warn(`Image preload timeout: ${src}`);
      resolve(false);
    }, timeout);

    img.onload = () => {
      clearTimeout(timer);
      resolve(true);
    };

    img.onerror = () => {
      clearTimeout(timer);
      console.error(`Image preload error: ${src}`);
      resolve(false);
    };

    img.src = src;
  });
}
