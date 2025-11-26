/**
 * Custom image loader for Next.js with timeout handling
 * Handles slow-loading images from Firebase Storage
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
 */
export default function imageLoader({ src, width, quality }: ImageLoaderProps): string {
  // For Firebase Storage URLs, return direct URL (public read access)
  if (src.includes('storage.googleapis.com') || src.includes('firebasestorage.app')) {
    return src;
  }
  
  // For other URLs, return as-is
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }
  
  // For local/relative paths
  return src;
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
