"use client";

interface AnalyticsCardsSkeletonProps {
  count?: number;
}

export function AnalyticsCardsSkeleton({ count = 8 }: AnalyticsCardsSkeletonProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white border border-slate-200 rounded-xl p-6 animate-pulse"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-slate-200 rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-24 bg-slate-200 rounded" />
            <div className="h-8 w-16 bg-slate-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}