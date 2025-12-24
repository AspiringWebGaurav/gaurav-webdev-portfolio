"use client";

import React, { useState, useEffect, useRef } from "react";
import { useComponentLoading } from "@/hooks/useComponentLoading";

interface WithSkeletonProps {
  children: React.ReactNode;
  skeleton: React.ReactNode;
  loading?: boolean; // Manual loading control
  minLoadTime?: number;
  maxLoadTime?: number;
  fallback?: React.ReactNode; // Error fallback
  className?: string;
  transitionDuration?: number; // Fade transition in ms
  preserveFixed?: boolean; // Don't interfere with fixed positioning (for navbar, modals, etc)
}

/**
 * Pure Dynamic Skeleton Wrapper
 * Shows skeleton ONLY during actual loading
 * Transitions immediately when content ready (no blank screen)
 * 
 * Usage:
 * <WithSkeleton skeleton={<HeroSkeleton />}>
 *   <Hero />
 * </WithSkeleton>
 */
export function WithSkeleton({
  children,
  skeleton,
  loading: manualLoading,
  minLoadTime = 0, // Pure dynamic - no forced minimum
  maxLoadTime = 10000,
  fallback,
  className = "",
  transitionDuration = 200,
  preserveFixed = false,
}: WithSkeletonProps) {
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [contentMounted, setContentMounted] = useState(false);
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const childRef = useRef<HTMLDivElement>(null);
  const skeletonRef = useRef<HTMLDivElement>(null);

  const {
    isLoading: autoLoading,
    setLoaded,
  } = useComponentLoading({
    minLoadTime,
    maxLoadTime,
    initialLoading: true,
    skipMinTime: true, // Pure dynamic mode
  });

  // Determine loading state (manual override or auto)
  const isLoading = manualLoading !== undefined ? manualLoading : autoLoading;

  // Track mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Pre-render content invisibly to load images
  useEffect(() => {
    if (!mounted) return;
    setContentMounted(true);
  }, [mounted]);

  // Measure content height to prevent scroll jump
  useEffect(() => {
    if (!contentMounted || !childRef.current) return;
    
    const measureHeight = () => {
      if (childRef.current) {
        const height = childRef.current.offsetHeight;
        setContentHeight(height);
      }
    };

    // Measure after a short delay to ensure content is rendered
    const timer = setTimeout(measureHeight, 50);
    
    return () => clearTimeout(timer);
  }, [contentMounted]);

  // Detect when ALL images are loaded
  useEffect(() => {
    if (!contentMounted || !childRef.current) return;

    const checkImagesLoaded = () => {
      if (!childRef.current) return;

      const images = childRef.current.querySelectorAll("img");
      
      if (images.length === 0) {
        // No images, content is ready
        setImagesLoaded(true);
        setLoaded();
        return;
      }

      // Check if all images are loaded
      const allLoaded = Array.from(images).every((img) => {
        return img.complete && img.naturalHeight !== 0;
      });

      if (allLoaded) {
        setImagesLoaded(true);
        setLoaded();
      }
    };

    // Initial check
    checkImagesLoaded();

    // Listen for all image load events
    const images = childRef.current.querySelectorAll("img");
    const loadHandler = () => {
      checkImagesLoaded();
    };

    images.forEach((img) => {
      if (!img.complete) {
        img.addEventListener("load", loadHandler);
        img.addEventListener("error", loadHandler); // Treat errors as "loaded" to not block
      }
    });

    // Backup timeout - if images take too long, show content anyway
    const timeout = setTimeout(() => {
      setImagesLoaded(true);
      setLoaded();
    }, 3000);

    return () => {
      clearTimeout(timeout);
      images.forEach((img) => {
        img.removeEventListener("load", loadHandler);
        img.removeEventListener("error", loadHandler);
      });
    };
  }, [contentMounted, setLoaded]);

  // Error boundary
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setError(event.error);
    };
    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);

  // Show error fallback
  if (error && fallback) {
    return <>{fallback}</>;
  }

  const showSkeleton = isLoading && !imagesLoaded;
  const showContent = !isLoading || imagesLoaded;

  // For fixed-position elements (navbar, modals), use minimal wrapper
  // Both skeleton and content appear in exact same position
  if (preserveFixed) {
    return (
      <div style={{ position: "relative" }}>
        {/* Skeleton - positioned exactly like the real fixed element */}
        {showSkeleton && (
          <div
            ref={skeletonRef}
            style={{
              transition: `opacity ${transitionDuration}ms ease-in-out`,
            }}
            aria-busy="true"
            aria-label="Loading content"
          >
            {skeleton}
          </div>
        )}
        {/* Content - pre-loaded invisibly, then revealed */}
        <div
          ref={childRef}
          style={{
            opacity: showContent ? 1 : 0,
            visibility: showContent ? "visible" : "hidden",
            pointerEvents: showContent ? "auto" : "none",
            transition: `opacity ${transitionDuration}ms ease-in-out`,
            // Position absolutely over skeleton during transition to prevent double navbar
            ...(showSkeleton && {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
            }),
          }}
          aria-busy={!showContent}
        >
          {children}
        </div>
      </div>
    );
  }

  // Regular flow for non-fixed elements
  // Skeleton and content occupy the EXACT same space - no position shift
  // Preserve height to prevent scroll position jumps
  return (
    <div 
      className="skeleton-wrapper-container" 
      style={{ 
        position: "relative",
        // Lock container height to actual content height to prevent scroll jumps
        minHeight: contentHeight ? `${contentHeight}px` : undefined,
      }}
    >
      {/* Skeleton - visible during loading */}
      {showSkeleton && (
        <div
          ref={skeletonRef}
          className={`skeleton-container ${className}`}
          style={{
            opacity: 1,
            transition: `opacity ${transitionDuration}ms ease-in-out`,
          }}
          aria-busy="true"
          aria-label="Loading content"
        >
          {skeleton}
        </div>
      )}

      {/* Content - overlays skeleton in exact same position */}
      <div
        ref={childRef}
        className={`content-container ${className}`}
        style={{
          opacity: showContent ? 1 : 0,
          visibility: showContent ? "visible" : "hidden",
          pointerEvents: showContent ? "auto" : "none",
          transition: `opacity ${transitionDuration}ms ease-in-out, visibility ${transitionDuration}ms ease-in-out`,
          // Position absolutely over skeleton during loading to prevent layout shift
          ...(showSkeleton && {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            width: "100%",
          }),
        }}
        aria-busy={!showContent}
      >
        {children}
      </div>
    </div>
  );
}
