"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import {
  showUnbanToast,
  showProcessingToast,
  showErrorToast
} from '@/components/ToastSystem';
import AppealModal from '@/components/AppealModal';
import { silentLogger, prodLogger } from '@/utils/secureLogger';
import { formatPolicyReferenceForDisplay } from '@/utils/policyReference';

export default function EnhancedBanPage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const [uuid, setUuid] = useState<string>("");
  const [banReason, setBanReason] = useState<string>("");
  const [policyReference, setPolicyReference] = useState<string>("");
  const [isListening, setIsListening] = useState(false);
  const [isAppealModalOpen, setIsAppealModalOpen] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Get UUID from URL params
    const urlUUID = params.uuid as string;
    const reasonParam = searchParams.get("reason") || "Policy violation";
    const policyRefParam = searchParams.get("policyRef") || "";
    
    setUuid(urlUUID);
    setBanReason(decodeURIComponent(reasonParam));
    setPolicyReference(policyRefParam);
    
    silentLogger.silent("Enhanced ban page loaded for visitor");
    silentLogger.silent("Ban reason and policy reference received");

    // Start Firebase real-time listener for status changes
    if (urlUUID) {
      startFirebaseListener(urlUUID);
    }

    // Cleanup listener on unmount
    return () => {
      if (unsubscribeRef.current) {
        silentLogger.silent("Cleaning up Firebase listener on enhanced ban page");
        unsubscribeRef.current();
      }
    };
  }, [searchParams, params.uuid]);

  const startFirebaseListener = (userUUID: string) => {
    if (isListening) return;

    try {
      const docRef = doc(db as any, "visitors", userUUID);
      
      silentLogger.silent("Starting Firebase listener on enhanced ban page");
      
      const unsubscribe = onSnapshot(
        docRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            const currentStatus = data.status;
            
            silentLogger.silent("Status update received on enhanced ban page");
            
            // If user is unbanned, redirect to portfolio
            if (currentStatus === 'active') {
              silentLogger.silent("User unbanned! Redirecting to portfolio");
              handleUnbanRedirect(userUUID);
            }
          }
        },
        (error) => {
          prodLogger.error("Firebase listener error on enhanced ban page", { error: error.message });
          showErrorToast("Connection lost. Please refresh the page.");
        }
      );

      unsubscribeRef.current = unsubscribe;
      setIsListening(true);
    } catch (error) {
      prodLogger.error("Failed to start Firebase listener", { error: error instanceof Error ? error.message : "Unknown error" });
      showErrorToast("Failed to monitor status changes.");
    }
  };

  const handleUnbanRedirect = (userUUID: string) => {
    showUnbanToast(() => {
      showProcessingToast("🔄 Redirecting to your portfolio...", 2000);
      
      setTimeout(() => {
        // Clear any ban-related session data
        sessionStorage.setItem('banCheckDone', 'true');
        sessionStorage.setItem('justUnbanned', 'true');
        
        // Use Next.js router for dynamic redirection (works in both dev and production)
        router.push(`/${userUUID}`);
      }, 2000);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]"></div>
      
      <div className="w-full max-w-4xl relative z-10">
        {/* Real-time status indicator */}
        {isListening && (
          <div className="mb-6 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-center space-x-3">
              <div className="relative">
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-3 h-3 bg-blue-400 rounded-full animate-ping opacity-75"></div>
              </div>
              <span className="text-blue-300 text-sm font-medium">
                Real-time monitoring active • You'll be redirected automatically if access is restored
              </span>
            </div>
          </div>
        )}

        {/* Main ban notice */}
        <div className="bg-gradient-to-br from-slate-900/90 to-gray-900/90 backdrop-blur-xl border border-red-500/20 rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-red-500/20 via-red-600/20 to-red-700/20 p-8 border-b border-red-500/20">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent"></div>
            <div className="relative flex items-center space-x-6">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500/30 to-red-600/30 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-red-500/20">
                <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Access Restricted</h1>
                <p className="text-red-300 text-lg">Your access to this portfolio has been temporarily suspended</p>
                <div className="flex items-center mt-2 space-x-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <span className="text-red-400 text-sm font-medium">Enterprise Security Policy Enforcement</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 space-y-8">
            {/* Policy Reference - Prominent Display */}
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <svg className="w-6 h-6 text-blue-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Policy Reference
                </h3>
                <div className="px-3 py-1 bg-blue-500/20 rounded-full">
                  <span className="text-blue-300 text-xs font-medium">TRACKING ID</span>
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="font-mono text-2xl text-blue-300 font-bold tracking-wider text-center">
                  {policyReference ? formatPolicyReferenceForDisplay(policyReference) : 'Loading...'}
                </div>
                <p className="text-slate-400 text-sm text-center mt-2">
                  Use this reference number when contacting support or submitting appeals
                </p>
              </div>
            </div>

            {/* Ban Reason - Enhanced Display */}
            <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <svg className="w-6 h-6 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Restriction Reason
              </h3>
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <p className="text-red-200 text-lg font-medium">{banReason}</p>
              </div>
            </div>

            {/* Status Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm">
                <h4 className="text-white font-semibold mb-3 flex items-center">
                  <svg className="w-5 h-5 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Current Status
                </h4>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                  <span className="text-red-300 font-medium">Temporarily Suspended</span>
                </div>
              </div>

              <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm">
                <h4 className="text-white font-semibold mb-3 flex items-center">
                  <svg className="w-5 h-5 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Review Timeline
                </h4>
                <p className="text-slate-300">24-48 hours</p>
                <p className="text-slate-400 text-sm mt-1">Standard processing time</p>
              </div>
            </div>

            {/* Information Panel */}
            <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-6 backdrop-blur-sm">
              <h4 className="text-white font-bold mb-4 flex items-center">
                <svg className="w-6 h-6 text-blue-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                What happens next?
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-blue-200 text-sm">Your appeal will be reviewed within 24-48 hours</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-blue-200 text-sm">You'll receive an email response if contact information is provided</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-blue-200 text-sm">Access will be restored automatically if the restriction is lifted</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-blue-200 text-sm">Use the policy reference number for all communications</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action button */}
            <div className="flex justify-center pt-4">
              <button
                onClick={() => setIsAppealModalOpen(true)}
                className="group bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-4 px-8 rounded-xl transition-all duration-300 font-semibold flex items-center justify-center space-x-3 shadow-lg hover:shadow-blue-500/25 transform hover:scale-105"
              >
                <svg className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Submit Appeal</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Appeal Modal */}
      <AppealModal
        isOpen={isAppealModalOpen}
        onClose={() => setIsAppealModalOpen(false)}
        uuid={uuid}
        banReason={banReason}
        policyReference={policyReference}
      />
    </div>
  );
}