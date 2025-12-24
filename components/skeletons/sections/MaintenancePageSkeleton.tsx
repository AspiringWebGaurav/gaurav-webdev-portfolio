/**
 * MaintenancePageSkeleton Component
 * 
 * Full-page skeleton for maintenance screen
 * Adapts to Desktop/Tablet/Mobile layouts
 */

'use client';

import { useState, useEffect } from 'react';
import { Skeleton } from '../core/Skeleton';

export default function MaintenancePageSkeleton() {
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setScreenSize('mobile');
      } else if (width < 1024) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Desktop layout
  if (screenSize === 'desktop') {
    return (
      <div className="fixed inset-0 bg-black-100 overflow-hidden">
        {/* Spotlight effects */}
        <div className="absolute inset-0">
          <Skeleton className="absolute top-10 left-10 w-96 h-96 rounded-full opacity-20" />
          <Skeleton className="absolute top-10 right-10 w-96 h-96 rounded-full opacity-20" />
        </div>

        {/* Main content - horizontal layout */}
        <div className="relative h-full flex items-center justify-center px-12 gap-16">
          {/* Left section - Status info */}
          <div className="flex-1 max-w-2xl space-y-8">
            {/* Header badge */}
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="h-6 w-40" rounded="md" />
            </div>

            {/* Main title */}
            <div className="space-y-3">
              <Skeleton className="h-16 w-full max-w-lg" rounded="lg" />
              <Skeleton className="h-12 w-4/5" rounded="lg" />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Skeleton className="h-5 w-full" rounded="md" />
              <Skeleton className="h-5 w-11/12" rounded="md" />
              <Skeleton className="h-5 w-4/5" rounded="md" />
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <Skeleton className="h-12 w-40" rounded="lg" />
              <Skeleton className="h-12 w-32" rounded="lg" />
            </div>

            {/* Status cards */}
            <div className="grid grid-cols-2 gap-4 pt-6">
              <Skeleton className="h-24 w-full" rounded="xl" />
              <Skeleton className="h-24 w-full" rounded="xl" />
            </div>
          </div>

          {/* Right section - Countdown */}
          <div className="flex-1 max-w-xl flex flex-col items-center space-y-8">
            {/* Countdown timer */}
            <div className="relative">
              <Skeleton className="w-80 h-80 rounded-3xl" />
            </div>

            {/* Progress info */}
            <div className="w-full space-y-3">
              <Skeleton className="h-6 w-48 mx-auto" rounded="md" />
              <Skeleton className="h-4 w-64 mx-auto" rounded="md" />
            </div>

            {/* Fun facts rotating */}
            <div className="w-full bg-black-200/30 rounded-xl p-6 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="w-6 h-6 rounded-md" />
                <Skeleton className="h-5 w-32" rounded="md" />
              </div>
              <Skeleton className="h-4 w-full" rounded="md" />
              <Skeleton className="h-4 w-5/6" rounded="md" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="w-10 h-10 rounded-full" />
          ))}
        </div>

        {/* Menu button */}
        <div className="absolute top-6 right-6">
          <Skeleton className="w-10 h-10 rounded-lg" />
        </div>
      </div>
    );
  }

  // Tablet layout
  if (screenSize === 'tablet') {
    return (
      <div className="fixed inset-0 bg-black-100 overflow-hidden">
        {/* Spotlight */}
        <div className="absolute inset-0">
          <Skeleton className="absolute top-10 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full opacity-20" />
        </div>

        {/* Content */}
        <div className="relative h-full flex flex-col items-center justify-center px-8 py-12 space-y-8">
          {/* Header */}
          <div className="text-center space-y-4 max-w-xl">
            <div className="flex items-center justify-center gap-3">
              <Skeleton className="w-7 h-7 rounded-full" />
              <Skeleton className="h-5 w-36" rounded="md" />
            </div>
            <Skeleton className="h-12 w-full" rounded="lg" />
            <Skeleton className="h-10 w-4/5 mx-auto" rounded="lg" />
          </div>

          {/* Countdown */}
          <Skeleton className="w-64 h-64 rounded-2xl" />

          {/* Message */}
          <div className="max-w-lg space-y-2 text-center">
            <Skeleton className="h-4 w-full" rounded="md" />
            <Skeleton className="h-4 w-5/6 mx-auto" rounded="md" />
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <Skeleton className="h-11 w-36" rounded="lg" />
            <Skeleton className="h-11 w-28" rounded="lg" />
          </div>

          {/* Cards */}
          <div className="grid grid-cols-2 gap-4 max-w-lg w-full">
            <Skeleton className="h-20 w-full" rounded="xl" />
            <Skeleton className="h-20 w-full" rounded="xl" />
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="w-9 h-9 rounded-full" />
          ))}
        </div>
      </div>
    );
  }

  // Mobile layout
  return (
    <div className="fixed inset-0 bg-black-100 overflow-y-auto">
      <div className="min-h-full flex flex-col items-center justify-center px-4 py-8 space-y-6">
        {/* Header badge */}
        <div className="flex items-center gap-2">
          <Skeleton className="w-6 h-6 rounded-full" />
          <Skeleton className="h-4 w-32" rounded="md" />
        </div>

        {/* Title */}
        <div className="space-y-2 text-center w-full">
          <Skeleton className="h-10 w-full max-w-xs mx-auto" rounded="lg" />
          <Skeleton className="h-8 w-4/5 mx-auto" rounded="lg" />
        </div>

        {/* Countdown */}
        <Skeleton className="w-48 h-48 rounded-xl" />

        {/* Message */}
        <div className="space-y-2 text-center w-full max-w-sm">
          <Skeleton className="h-4 w-full" rounded="md" />
          <Skeleton className="h-4 w-11/12 mx-auto" rounded="md" />
          <Skeleton className="h-4 w-4/5 mx-auto" rounded="md" />
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Skeleton className="h-11 w-full" rounded="lg" />
          <Skeleton className="h-10 w-full" rounded="lg" />
        </div>

        {/* Status cards */}
        <div className="grid grid-cols-1 gap-3 w-full max-w-xs pt-4">
          <Skeleton className="h-20 w-full" rounded="xl" />
          <Skeleton className="h-20 w-full" rounded="xl" />
        </div>

        {/* Fun fact */}
        <div className="bg-black-200/30 rounded-lg p-4 w-full max-w-xs space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="w-5 h-5 rounded-md" />
            <Skeleton className="h-4 w-24" rounded="md" />
          </div>
          <Skeleton className="h-3 w-full" rounded="md" />
          <Skeleton className="h-3 w-4/5" rounded="md" />
        </div>

        {/* Social links */}
        <div className="flex justify-center gap-3 pt-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="w-8 h-8 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
