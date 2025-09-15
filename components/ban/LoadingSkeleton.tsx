"use client";

export function LoadingSkeleton() {
  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black flex items-center justify-center p-2 sm:p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:30px_30px] sm:bg-[size:50px_50px]"></div>
      
      {/* Loading indicator */}
      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-full px-3 py-1 backdrop-blur-sm z-20">
        <div className="flex items-center space-x-2">
          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
          <span className="text-blue-300 text-xs font-medium hidden sm:inline">Loading ban page...</span>
          <span className="text-blue-300 text-xs font-medium sm:hidden">Loading...</span>
        </div>
      </div>
      
      <div className="w-full max-w-7xl h-full flex items-center relative z-10">
        {/* Main skeleton */}
        <div className="w-full bg-gradient-to-br from-slate-900/90 to-gray-900/90 backdrop-blur-xl border border-slate-500/20 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden">
          
          {/* Header Skeleton */}
          <div className="relative bg-gradient-to-r from-slate-500/20 via-slate-600/20 to-slate-700/20 p-3 sm:p-6 border-b border-slate-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-700/50 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-sm border border-slate-500/20 animate-pulse">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-slate-600/50 rounded"></div>
                </div>
                <div>
                  <div className="h-4 sm:h-6 bg-slate-600/50 rounded w-48 sm:w-64 animate-pulse mb-1 sm:mb-2"></div>
                  <div className="h-3 sm:h-4 bg-slate-700/50 rounded w-32 sm:w-48 animate-pulse hidden sm:block"></div>
                  <div className="h-2 bg-slate-700/50 rounded w-24 animate-pulse sm:hidden"></div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-1 sm:space-x-2 mb-1">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-slate-600/50 rounded-full animate-pulse"></div>
                  <div className="h-3 bg-slate-600/50 rounded w-16 sm:w-20 animate-pulse"></div>
                </div>
                <div className="h-2 bg-slate-700/50 rounded w-12 sm:w-16 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="p-3 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 h-full">
              
              {/* Policy Reference Skeleton */}
              <div className="space-y-3 sm:space-y-4">
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="h-4 sm:h-5 bg-slate-600/50 rounded w-24 sm:w-32 animate-pulse"></div>
                    <div className="h-4 bg-slate-600/50 rounded w-8 animate-pulse"></div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-2 sm:p-3 border border-slate-700/50">
                    <div className="h-4 sm:h-6 bg-slate-600/50 rounded w-full animate-pulse mb-1"></div>
                    <div className="h-2 bg-slate-700/50 rounded w-3/4 animate-pulse"></div>
                  </div>
                </div>

                {/* Ban Reason Skeleton */}
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4 backdrop-blur-sm">
                  <div className="h-4 sm:h-5 bg-slate-600/50 rounded w-20 sm:w-28 animate-pulse mb-2 sm:mb-3"></div>
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-2 sm:p-3">
                    <div className="h-4 bg-slate-600/50 rounded w-full animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Information Skeleton */}
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4 backdrop-blur-sm">
                <div className="h-4 bg-slate-600/50 rounded w-24 sm:w-32 animate-pulse mb-3 sm:mb-4"></div>
                <div className="space-y-2 sm:space-y-3">
                  {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="flex items-start space-x-2 sm:space-x-3">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-slate-600/50 rounded-full mt-1.5 sm:mt-2 flex-shrink-0 animate-pulse"></div>
                      <div className="h-3 bg-slate-600/50 rounded w-full animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Skeleton */}
              <div className="flex flex-col justify-center items-center space-y-3 sm:space-y-4 sm:col-span-2 lg:col-span-1">
                <div className="text-center mb-2 sm:mb-4">
                  <div className="h-5 sm:h-6 bg-slate-600/50 rounded w-20 sm:w-24 animate-pulse mb-1 sm:mb-2 mx-auto"></div>
                  <div className="h-3 bg-slate-700/50 rounded w-32 sm:w-48 animate-pulse mx-auto"></div>
                </div>
                
                <div className="h-12 sm:h-16 bg-slate-600/50 rounded-lg sm:rounded-xl w-full max-w-xs animate-pulse"></div>

                <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-2 sm:p-3 w-full max-w-xs">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 sm:space-x-2 mb-1">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-slate-600/50 rounded animate-pulse"></div>
                      <div className="h-3 bg-slate-600/50 rounded w-16 sm:w-20 animate-pulse"></div>
                    </div>
                    <div className="h-2 bg-slate-700/50 rounded w-20 sm:w-24 animate-pulse mx-auto"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Animated loading dots */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>

      {/* Custom CSS for enhanced animations */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -200px 0;
          }
          100% {
            background-position: calc(200px + 100%) 0;
          }
        }

        .animate-pulse {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          background-size: 200px 100%;
          animation: shimmer 1.5s infinite;
        }

        .animate-bounce {
          animation: bounce 1s infinite;
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
}