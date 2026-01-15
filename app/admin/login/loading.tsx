/**
 * ADMIN LOGIN PAGE LOADING STATE
 * 
 * Shown while the login page is loading
 * Provides smooth UX transition when navigating to /admin/login
 */

export default function LoginLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-black">
      <div className="text-center space-y-6">
        {/* Animated Logo/Shield */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-500/20 rounded-full animate-ping absolute"></div>
            <div className="w-20 h-20 border-4 border-t-blue-500 border-r-blue-400 border-b-blue-300 border-l-blue-200 rounded-full animate-spin"></div>
          </div>
        </div>
        
        {/* Loading Text */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Loading Admin Portal
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Preparing secure authentication...
          </p>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
}
