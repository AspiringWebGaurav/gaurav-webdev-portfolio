"use client";

interface VisitorTableSkeletonProps {
  rows?: number;
  showHeader?: boolean;
}

export function VisitorTableSkeleton({ rows = 5, showHeader = true }: VisitorTableSkeletonProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {showHeader && (
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="h-6 bg-slate-200 rounded w-32 animate-pulse"></div>
            <div className="flex space-x-2">
              <div className="h-8 bg-slate-200 rounded w-20 animate-pulse"></div>
              <div className="h-8 bg-slate-200 rounded w-24 animate-pulse"></div>
            </div>
          </div>
        </div>
      )}
      
      <div className="divide-y divide-slate-200">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-6 animate-pulse">
            {/* Checkbox */}
            <div className="w-4 h-4 bg-slate-200 rounded"></div>
            
            {/* Status indicator */}
            <div className="w-3 h-3 bg-slate-200 rounded-full"></div>
            
            {/* Visitor info */}
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-24"></div>
              <div className="h-3 bg-slate-200 rounded w-32"></div>
            </div>
            
            {/* Status badge */}
            <div className="w-16 h-6 bg-slate-200 rounded-full"></div>
            
            {/* Location */}
            <div className="space-y-1">
              <div className="h-4 bg-slate-200 rounded w-20"></div>
              <div className="h-3 bg-slate-200 rounded w-16"></div>
            </div>
            
            {/* Device info */}
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-slate-200 rounded"></div>
              <div className="space-y-1">
                <div className="h-4 bg-slate-200 rounded w-16"></div>
                <div className="h-3 bg-slate-200 rounded w-20"></div>
              </div>
            </div>
            
            {/* Session info */}
            <div className="space-y-1">
              <div className="h-4 bg-slate-200 rounded w-12"></div>
              <div className="h-3 bg-slate-200 rounded w-16"></div>
            </div>
            
            {/* Source */}
            <div className="space-y-1">
              <div className="h-4 bg-slate-200 rounded w-14"></div>
              <div className="h-3 bg-slate-200 rounded w-8"></div>
            </div>
            
            {/* Actions */}
            <div className="flex space-x-2">
              <div className="w-12 h-6 bg-slate-200 rounded"></div>
              <div className="w-14 h-6 bg-slate-200 rounded"></div>
              <div className="w-16 h-6 bg-slate-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}