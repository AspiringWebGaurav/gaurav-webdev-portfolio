"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

interface ImageSlideshowProps {
  images: string[];
  alt: string;
  interval?: number; // milliseconds between transitions
  transitionDuration?: number; // milliseconds for fade effect
  className?: string;
  priority?: boolean;
  sizes?: string;
}

/**
 * Automatic image slideshow with smooth fade transitions
 * Perfect for project galleries with multiple images
 * Smooth and slow like SwiperJS
 * Now with error handling for slow-loading images
 */
export default function ImageSlideshow({
  images,
  alt,
  interval = 5000, // 5 seconds between slides
  transitionDuration = 1500, // 1.5 second smooth fade
  className = "",
  priority = false,
  sizes = "(max-width: 640px) 80vw, 570px",
}: ImageSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [imageLoading, setImageLoading] = useState<Set<number>>(new Set());

  // Debug logging
  console.log('ImageSlideshow received:', { images, alt, imagesType: typeof images, isArray: Array.isArray(images) });

  // Handle single or no images
  if (!images || images.length === 0) {
    console.warn('ImageSlideshow: No images provided');
    return null;
  }

  // Handle image load error
  const handleImageError = useCallback((index: number) => {
    console.warn(`Failed to load image at index ${index}: ${images[index]}`);
    setImageErrors(prev => new Set(prev).add(index));
    setImageLoading(prev => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  }, [images]);

  // Handle image load success
  const handleImageLoad = useCallback((index: number) => {
    setImageLoading(prev => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  }, []);

  // If only one image, show it without slideshow
  if (images.length === 1) {
    return (
      <div className="relative w-full h-full">
        <Image
          src={images[0]}
          alt={alt}
          fill
          sizes={sizes}
          className={`z-10 object-contain object-bottom ${className}`}
          loading={priority ? undefined : "lazy"}
          priority={priority}
          onError={() => handleImageError(0)}
          onLoad={() => handleImageLoad(0)}
        />
        {imageErrors.has(0) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 text-white/70">
            <p className="text-sm">Image temporarily unavailable</p>
          </div>
        )}
      </div>
    );
  }

  // Auto-advance slideshow with smooth transitions
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, interval);

    return () => clearInterval(timer);
  }, [images.length, interval]);

  // Manual navigation
  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* All images rendered with stacking */}
      {images.map((image, index) => {
        const isActive = index === currentIndex;
        const hasError = imageErrors.has(index);
        const isLoading = imageLoading.has(index);

        return (
          <div
            key={`${image}-${index}`}
            className={`absolute inset-0 transition-opacity ease-in-out`}
            style={{
              opacity: isActive ? 1 : 0,
              transitionDuration: `${transitionDuration}ms`,
              zIndex: isActive ? 10 : 0,
              pointerEvents: isActive ? "auto" : "none",
            }}
          >
            {!hasError ? (
              <Image
                src={image}
                alt={`${alt} - Image ${index + 1}`}
                fill
                sizes={sizes}
                className={`object-contain object-bottom ${className}`}
                loading={priority && index === 0 ? undefined : "lazy"}
                priority={priority && index === 0}
                onError={() => handleImageError(index)}
                onLoad={() => handleImageLoad(index)}
                unoptimized={false}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 text-white/70">
                <p className="text-sm">Image temporarily unavailable</p>
              </div>
            )}
            
            {/* Loading indicator for active image */}
            {isActive && isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            )}
          </div>
        );
      })}

      {/* Slideshow indicators with smooth animation */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-20 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md shadow-lg">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`rounded-full transition-all duration-500 ease-out ${
              index === currentIndex
                ? "bg-white w-6 h-1.5"
                : "bg-white/50 hover:bg-white/75 w-1.5 h-1.5"
            }`}
            aria-label={`Go to image ${index + 1}`}
            title={`Image ${index + 1} of ${images.length}`}
          />
        ))}
      </div>
    </div>
  );
}
