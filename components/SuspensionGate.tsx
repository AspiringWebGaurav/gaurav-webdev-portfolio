/**
 * Suspension Gate Component
 * 
 * Blocks ALL routes when suspension is enabled and redirects to /suspended
 * Prevents URL manipulation and bypassing
 * Only allows access to: /suspended, /admin, /banned, /maintenance
 * Acts as a hard lock during suspension mode
 */

"use client";

import { useEffect, useRef, ReactNode, useState } from 'react';
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
  const [isChecking, setIsChecking] = useState(true);
  const [hasChecked, setHasChecked] = useState(false);

  // Allowed paths during suspension (case-insensitive)
  const isAllowedPath = 
    pathname?.toLowerCase().startsWith('/suspnd_srv_temp_0x8f2_auth_v5_mnt_0xb3a7_svc_verify_suspnd_0x4e1_session_temp_chk_0xd9c2_lock_validate_0x7f3_access_suspnd_monitor_0xa6b_gate_srv_0x2e8_render_temp_state_0x5c1_final') ||
    pathname?.toLowerCase().startsWith('/admin') ||
    pathname?.toLowerCase().startsWith('/banned') ||
    pathname?.toLowerCase().startsWith('/maintenance') ||
    pathname === '/_error' ||
    pathname === '/_not-found';

  useEffect(() => {
    // Update checking state based on loading
    if (isLoading) {
      setIsChecking(true);
      return;
    }

    setIsChecking(false);
    setHasChecked(true);

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

  // Show loading state while checking suspension status (prevents flash)
  if ((isChecking || !hasChecked) && !isAllowedPath) {
    return (
      <div className="fixed inset-0 bg-black-100 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70 text-sm">Verifying access...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
