/**
 * Abuse Policy Gate Component
 * 
 * Blocks access to login and admin routes when Abuse Policy is active.
 * Redirects to /abuse-policy-active page.
 * 
 * Follows existing gate pattern from BanGate, MaintenanceGate, SuspensionGate.
 */

"use client";

import { useEffect, useRef, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAbusePolicyStatus } from '@/contexts/AbusePolicyContext';

interface AbusePolicyGateProps {
  children: ReactNode;
}

export default function AbusePolicyGate({ children }: AbusePolicyGateProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isActive } = useAbusePolicyStatus();
  const hasRedirected = useRef(false);

  // Paths that bypass the gate (fast routing - no verification)
  const isBypassPath = 
    pathname?.startsWith('/abuse-policy-active') ||
    pathname?.startsWith('/abuse-policy') ||
    pathname?.startsWith('/admin/abuse-policy') ||
    pathname?.startsWith('/banned') ||
    pathname?.startsWith('/maintenance') ||
    pathname?.startsWith('/suspnd_srv_temp_') ||
    pathname?.startsWith('/privacy') ||
    pathname?.startsWith('/terms') ||
    pathname?.startsWith('/cookies') ||
    pathname?.startsWith('/contact') ||
    pathname === '/_error' ||
    pathname === '/_not-found';

  // Paths that should be blocked when abuse policy is active
  const isProtectedPath = 
    pathname?.startsWith('/admin/login') ||
    pathname?.startsWith('/admin/dashboard');

  useEffect(() => {
    // Reset redirect flag when abuse policy becomes inactive
    if (!isActive) {
      hasRedirected.current = false;
    }

    // If abuse policy is active and user is on a protected path
    if (isActive && isProtectedPath && !isBypassPath && !hasRedirected.current) {
      console.log('[Abuse Policy Gate] 🔒 Blocking access - Abuse Policy active');
      hasRedirected.current = true;
      router.replace('/abuse-policy-active');
    }
  }, [isActive, isProtectedPath, isBypassPath, pathname, router]);

  return <>{children}</>;
}
