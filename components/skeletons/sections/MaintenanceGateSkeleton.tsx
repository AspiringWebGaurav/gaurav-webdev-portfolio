/**
 * MaintenanceGateSkeleton Component
 * 
 * Displays skeleton loading state while checking maintenance status
 * Shows centered loader with shimmer effect
 */

import { Skeleton } from '../core/Skeleton';

export default function MaintenanceGateSkeleton() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black-100">
      {/* Spotlight effect */}
      <div className="absolute inset-0">
        <Skeleton className="w-full h-full" />
      </div>
      
      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-6">
        {/* Spinner circle */}
        <div className="relative">
          <Skeleton 
            className="w-16 h-16 rounded-full animate-spin" 
            rounded="full"
          />
        </div>
        
        {/* Loading text */}
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="h-6 w-32" rounded="md" />
          <Skeleton className="h-4 w-48" rounded="md" />
        </div>
      </div>
    </div>
  );
}
