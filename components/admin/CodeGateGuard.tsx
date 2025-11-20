"use client";

import { useCodeGateAccess } from '@/hooks/useCodeGateAccess';
import { usePathname } from 'next/navigation';

/**
 * Code Gate Guard Component
 * Wraps protected admin routes to enforce code gate access
 */
export default function CodeGateGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Exclude certain paths from code gate protection
  const excludedPaths = [
    '/admin/code-gate',
    '/banned',
    '/admin/login'
  ];

  const isExcluded = excludedPaths.some(path => pathname?.startsWith(path));

  const { hasAccess, loading } = useCodeGateAccess({
    enabled: !isExcluded,
    redirectOnFail: true
  });

  // Show loading state while checking access
  if (loading && !isExcluded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block p-4 bg-blue-500/20 rounded-full mb-4">
            <div className="animate-spin h-8 w-8 border-4 border-blue-400 border-t-transparent rounded-full"></div>
          </div>
          <p className="text-blue-300 text-sm">Verifying access permissions...</p>
        </div>
      </div>
    );
  }

  // Only render children if access is granted or path is excluded
  if (!hasAccess && !isExcluded) {
    return null;
  }

  return <>{children}</>;
}
