/**
 * Suspension Page Skeleton Loader
 * 
 * Loading state for suspension page
 * Shows while fetching suspension data
 * Matches suspension page layout
 */

"use client";

import React from 'react';

export default function SuspensionPageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-pink-50 flex items-center justify-center p-4 animate-pulse">
      <div className="max-w-2xl w-full">
        {/* Icon Skeleton */}
        <div className="flex justify-center mb-8">
          <div className="w-24 h-24 bg-red-200 rounded-full" />
        </div>

        {/* Title Skeleton */}
        <div className="flex justify-center mb-4">
          <div className="h-10 w-80 bg-red-200 rounded-lg" />
        </div>

        {/* Subtitle Skeleton */}
        <div className="flex justify-center mb-12">
          <div className="h-4 w-48 bg-red-200 rounded" />
        </div>

        {/* Main Card Skeleton */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 mb-6 border-2 border-red-200">
          <div className="space-y-4">
            <div className="h-6 w-64 bg-red-200 rounded" />
            <div className="h-4 w-full bg-red-100 rounded" />
            <div className="h-4 w-5/6 bg-red-100 rounded" />
            <div className="h-4 w-4/6 bg-red-100 rounded" />
          </div>
        </div>

        {/* Info Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-red-200">
            <div className="h-5 w-32 bg-red-200 rounded mb-3" />
            <div className="h-8 w-24 bg-red-100 rounded" />
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-red-200">
            <div className="h-5 w-32 bg-red-200 rounded mb-3" />
            <div className="h-8 w-20 bg-red-100 rounded" />
          </div>
        </div>

        {/* Contact Section Skeleton */}
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-red-200 text-center">
          <div className="h-6 w-48 bg-red-200 rounded mx-auto mb-4" />
          <div className="h-12 w-40 bg-red-300 rounded-lg mx-auto" />
        </div>

        {/* Footer Skeleton */}
        <div className="mt-8 text-center">
          <div className="h-4 w-56 bg-red-200 rounded mx-auto" />
        </div>
      </div>
    </div>
  );
}
