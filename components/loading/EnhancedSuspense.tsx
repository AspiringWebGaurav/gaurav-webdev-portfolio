"use client";

import React, { Suspense } from 'react';
import { EnhancedSpinners } from './EnhancedSpinners';

interface SuspenseFallbackProps {
  type?: 'component' | 'page' | 'minimal' | 'card';
  message?: string;
  className?: string;
}

// Different fallback components for different contexts
const SuspenseFallback: React.FC<SuspenseFallbackProps> = ({
  type = 'component',
  message = 'Loading...',
  className = ''
}) => {
  switch (type) {
    case 'page':
      return (
        <div className={`min-h-screen bg-black-100 flex items-center justify-center ${className}`}>
          <div className="text-center">
            <EnhancedSpinners.DualRing size="lg" color="gradient" className="mb-4" />
            <p className="text-white text-lg">{message}</p>
            <div className="mt-3">
              <EnhancedSpinners.Dots size="sm" color="gradient" />
            </div>
          </div>
        </div>
      );

    case 'card':
      return (
        <div className={`bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 flex flex-col items-center justify-center min-h-[200px] ${className}`}>
          <EnhancedSpinners.Wave size="md" color="gradient" className="mb-3" />
          <p className="text-slate-300 text-sm">{message}</p>
        </div>
      );

    case 'minimal':
      return (
        <div className={`flex items-center justify-center p-4 ${className}`}>
          <EnhancedSpinners.Circle size="sm" color="cyan" className="mr-2" />
          <span className="text-slate-400 text-sm">{message}</span>
        </div>
      );

    case 'component':
    default:
      return (
        <div className={`flex items-center justify-center p-6 ${className}`}>
          <div className="text-center">
            <EnhancedSpinners.DualRing size="md" color="gradient" className="mb-2" />
            <p className="text-slate-300 text-sm">{message}</p>
          </div>
        </div>
      );
  }
};

// Enhanced Suspense component with contextual fallbacks
interface EnhancedSuspenseProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  type?: SuspenseFallbackProps['type'];
  message?: string;
  className?: string;
}

export const EnhancedSuspense: React.FC<EnhancedSuspenseProps> = ({
  children,
  fallback,
  type = 'component',
  message,
  className
}) => {
  const defaultFallback = (
    <SuspenseFallback 
      type={type} 
      message={message} 
      className={className} 
    />
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  );
};

// Specialized Suspense components for common use cases
export const PageSuspense: React.FC<{ children: React.ReactNode; message?: string }> = ({
  children,
  message = 'Loading page...'
}) => (
  <EnhancedSuspense type="page" message={message}>
    {children}
  </EnhancedSuspense>
);

export const ComponentSuspense: React.FC<{ 
  children: React.ReactNode; 
  message?: string;
  className?: string;
}> = ({
  children,
  message = 'Loading component...',
  className
}) => (
  <EnhancedSuspense type="component" message={message} className={className}>
    {children}
  </EnhancedSuspense>
);

export const CardSuspense: React.FC<{ 
  children: React.ReactNode; 
  message?: string;
  className?: string;
}> = ({
  children,
  message = 'Loading content...',
  className
}) => (
  <EnhancedSuspense type="card" message={message} className={className}>
    {children}
  </EnhancedSuspense>
);

export const MinimalSuspense: React.FC<{ 
  children: React.ReactNode; 
  message?: string;
  className?: string;
}> = ({
  children,
  message = 'Loading...',
  className
}) => (
  <EnhancedSuspense type="minimal" message={message} className={className}>
    {children}
  </EnhancedSuspense>
);

export default EnhancedSuspense;