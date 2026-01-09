/**
 * Suspension Gate Component
 * 
 * Blocks ALL routes when suspension is enabled and redirects to /suspended
 * Prevents URL manipulation and bypassing
 * Only allows access to: /suspended, /admin, /banned, /maintenance
 * Acts as a hard lock during suspension mode
 */

"use client";

import { useEffect, useRef, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSuspensionStatus } from '@/contexts/SuspensionStatusContext';

interface SuspensionGateProps {
  children: ReactNode;
}

export default function SuspensionGate({ children }: SuspensionGateProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { status, isLoading } = useSuspensionStatus();
  const hasRedirected = useRef(false);

  // Allowed paths during suspension (case-insensitive)
  const isAllowedPath = 
    pathname?.toLowerCase().startsWith('/suspnd_srv_temp_0x8f2_auth_v5_mnt_0xb3a7_svc_verify_suspnd_0x4e1_session_temp_chk_0xd9c2_lock_validate_0x7f3_access_suspnd_monitor_0xa6b_gate_srv_0x2e8_render_temp_state_0x5c1_final') ||
    pathname?.toLowerCase().startsWith('/admin') ||
    pathname?.toLowerCase().startsWith('/banned') ||
    pathname?.toLowerCase().startsWith('/maintenance') ||
    pathname === '/_error' ||
    pathname === '/_not-found';

  useEffect(() => {
    // Skip check while loading status
    if (isLoading) return;

    // If suspension is enabled and user is not on an allowed path
    if (status.enabled && !isAllowedPath && !hasRedirected.current) {
      console.log('[SuspensionGate] 🔒 URL locked - Suspension active, redirecting to encrypted endpoint');
      console.log('[SuspensionGate] Attempted path:', pathname);
      hasRedirected.current = true;
      
      // Hard redirect to suspension page
      router.replace('/suspnd_srv_temp_0x8f2_auth_v5_mnt_0xb3a7_svc_verify_suspnd_0x4e1_session_temp_chk_0xd9c2_lock_validate_0x7f3_access_suspnd_monitor_0xa6b_gate_srv_0x2e8_render_temp_state_0x5c1_final');
    }

    // Reset redirect flag when suspension is disabled
    if (!status.enabled) {
      hasRedirected.current = false;
    }
  }, [status.enabled, isLoading, isAllowedPath, pathname, router]);

  // Show children normally - redirection happens in useEffect
  return <>{children}</>;
}
