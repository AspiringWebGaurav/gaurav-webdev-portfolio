"use client";

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import { BanPageDesign, BanCategory } from '@/types/banSystem';
import { BanPageDesignService } from '@/utils/banPageDesigns';
import { BanPageRenderer } from './BanPageRenderer';
import { CategoryTransition } from './CategoryTransition';
import { LoadingSkeleton } from './LoadingSkeleton';
import AppealModal from '@/components/AppealModal';
import { showUnbanToast, showProcessingToast, showErrorToast } from '@/components/ToastSystem';
import { silentLogger, prodLogger } from '@/utils/secureLogger';
import { PolicyReferenceSync } from '@/utils/policyReferenceSync';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { enterpriseRedirect, RedirectStrategy } from '@/utils/enterpriseRedirect';
import { getSessionManager, setBanState } from '@/utils/enterpriseSessionManager';
import { createBanStatusListener, removeBanStatusListener } from '@/utils/enterpriseFirebaseManager';

interface DynamicBanPageProps {
  uuid?: string;
  banReason?: string;
  policyReference?: string;
  initialCategory?: BanCategory;
}

export default function DynamicBanPage({
  uuid: propUuid,
  banReason: propBanReason,
  policyReference: propPolicyReference,
  initialCategory
}: DynamicBanPageProps) {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();

  // State management
  const [uuid, setUuid] = useState<string>("");
  const [banReason, setBanReason] = useState<string>("");
  const [policyReference, setPolicyReference] = useState<string>("");
  const [currentCategory, setCurrentCategory] = useState<BanCategory>('normal');
  const [design, setDesign] = useState<BanPageDesign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isAppealModalOpen, setIsAppealModalOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isLoadingPolicyRef, setIsLoadingPolicyRef] = useState(false);

  // Refs for cleanup
  const categoryListenerIdRef = useRef<string | null>(null);
  const designUnsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    initializePage();
    
    return () => {
      cleanup();
    };
  }, [searchParams, params.uuid]);

  const initializePage = async () => {
    try {
      // Get UUID from props or URL params
      const pageUuid = propUuid || (params.uuid as string);
      const reasonParam = propBanReason || searchParams.get("reason") || "Policy violation";
      const policyRefParam = propPolicyReference || searchParams.get("policyRef") || "";
      const categoryParam = initialCategory || (searchParams.get("category") as BanCategory) || 'normal';

      setUuid(pageUuid);
      setBanReason(decodeURIComponent(reasonParam));
      setPolicyReference(policyRefParam);
      setCurrentCategory(categoryParam);

      silentLogger.silent("Dynamic ban page initialized", { uuid: pageUuid, category: categoryParam });

      // Load initial design
      await loadDesign(categoryParam);

      // Start real-time listeners
      if (pageUuid) {
        startCategoryListener(pageUuid);
        startDesignListener(categoryParam);
      }

    } catch (error) {
      prodLogger.error("Error initializing dynamic ban page", { error });
      showErrorToast("Failed to load ban page. Please refresh.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadDesign = async (category: BanCategory) => {
    try {
      const designConfig = await BanPageDesignService.getDesign(category);
      if (designConfig) {
        setDesign(designConfig);
        silentLogger.silent("Design loaded for category", { category });
      } else {
        // Fallback to normal category if design not found
        if (category !== 'normal') {
          const fallbackDesign = await BanPageDesignService.getDesign('normal');
          setDesign(fallbackDesign);
          silentLogger.silent("Fallback to normal design", { requestedCategory: category });
        }
      }
    } catch (error) {
      prodLogger.error("Error loading design", { category, error });
    }
  };

  const startCategoryListener = (visitorUuid: string) => {
    // Clean up existing listener
    if (categoryListenerIdRef.current) {
      removeBanStatusListener(categoryListenerIdRef.current);
      categoryListenerIdRef.current = null;
    }

    try {
      silentLogger.silent("Starting enterprise category listener for visitor", { uuid: visitorUuid });
      
      // Create enterprise Firebase listener with automatic reconnection
      const listenerId = createBanStatusListener(
        visitorUuid,
        async (status: string, data: any) => {
          silentLogger.silent("Enterprise listener received status update", { status });
          
          if (data) {
            const newCategory = data.banCategory as BanCategory;
            const visitorStatus = data.status;
            const newPolicyReference = data.policyReference;
            
            // Check if user was unbanned
            if (visitorStatus === 'active') {
              silentLogger.silent("User unbanned! Redirecting to portfolio");
              await handleUnbanRedirect(visitorUuid);
              return;
            }
            
            // Handle policy reference update
            if (newPolicyReference && newPolicyReference !== policyReference) {
              silentLogger.silent("Policy reference updated", {
                from: policyReference,
                to: newPolicyReference
              });
              setPolicyReference(newPolicyReference);
            }
            
            // Handle category change
            if (newCategory && newCategory !== currentCategory) {
              silentLogger.silent("Category change detected", {
                from: currentCategory,
                to: newCategory
              });
              
              await handleCategoryChange(newCategory);
            }
            
            // If policy reference is missing, try to fetch it
            if (!newPolicyReference && !policyReference && !isLoadingPolicyRef) {
              await fetchMissingPolicyReference(visitorUuid);
            }
          } else {
            // Visitor document doesn't exist, might be unbanned
            silentLogger.silent("Visitor document not found, redirecting to portfolio");
            await handleUnbanRedirect(visitorUuid);
          }
        },
        (error: Error) => {
          prodLogger.error("Enterprise category listener error", { error: error.message });
          showErrorToast("Connection lost. Attempting to reconnect...");
        }
      );

      categoryListenerIdRef.current = listenerId;
      setIsListening(true);
      
      silentLogger.silent("Enterprise category listener started", { listenerId });
    } catch (error) {
      prodLogger.error("Failed to start enterprise category listener", { error });
      showErrorToast("Failed to start real-time monitoring. Please refresh the page.");
    }
  };

  const startDesignListener = (category: BanCategory) => {
    if (designUnsubscribeRef.current) {
      designUnsubscribeRef.current();
    }

    const unsubscribe = BanPageDesignService.subscribeToDesign(
      category,
      (updatedDesign) => {
        if (updatedDesign) {
          setDesign(updatedDesign);
          silentLogger.silent("Design updated via real-time sync", { category });
        }
      }
    );

    designUnsubscribeRef.current = unsubscribe;
  };

  const handleCategoryChange = async (newCategory: BanCategory) => {
    setIsTransitioning(true);
    
    try {
      // Load new design
      await loadDesign(newCategory);
      
      // Update category state
      setCurrentCategory(newCategory);
      
      // Update design listener
      startDesignListener(newCategory);
      
      silentLogger.silent("Category transition completed", { 
        from: currentCategory, 
        to: newCategory 
      });
      
    } catch (error) {
      prodLogger.error("Error during category transition", { 
        from: currentCategory, 
        to: newCategory, 
        error 
      });
    } finally {
      // Add delay to ensure smooth transition
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    }
  };

  const handleUnbanRedirect = async (userUUID: string) => {
    const sessionManager = getSessionManager();
    
    // Store unban completion state first
    await sessionManager.setUnbanCompletionState(userUUID);
    await setBanState(userUUID, 'unbanned');
    
    showUnbanToast(() => {
      showProcessingToast("🔄 Redirecting to your portfolio...", 3000);
      
      setTimeout(async () => {
        try {
          // Set legacy session storage for backward compatibility
          sessionStorage.setItem('banCheckDone', 'true');
          sessionStorage.setItem('justUnbanned', 'true');
          
          // Store redirect state for mobile reliability
          await sessionManager.setRedirectState(userUUID, `/${userUUID}`, 'unban');
          
          // Use enterprise redirect with mobile-optimized fallbacks
          const redirectResult = await enterpriseRedirect(`/${userUUID}`, {
            maxRetries: 5,
            retryDelay: 1000,
            timeout: 15000,
            preserveHistory: false,
            validateRedirect: true,
            fallbackStrategies: [
              RedirectStrategy.WINDOW_LOCATION,
              RedirectStrategy.META_REFRESH,
              RedirectStrategy.FORM_SUBMIT,
              RedirectStrategy.NEXT_ROUTER,
              RedirectStrategy.WINDOW_REPLACE,
              RedirectStrategy.FORCE_RELOAD
            ]
          }, router, userUUID);
          
          if (!redirectResult.success) {
            prodLogger.error("Enterprise redirect failed for unban", {
              uuid: userUUID,
              method: redirectResult.method,
              attempts: redirectResult.attempts,
              error: redirectResult.error
            });
            
            // Last resort: show manual redirect instruction
            showErrorToast("Please manually refresh the page or click your browser's back button to return to the portfolio.");
          } else {
            silentLogger.silent("Unban redirect successful", {
              method: redirectResult.method,
              attempts: redirectResult.attempts,
              duration: redirectResult.duration
            });
          }
        } catch (error) {
          prodLogger.error("Error during unban redirect process", {
            uuid: userUUID,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          
          // Fallback: try simple window location
          try {
            window.location.href = `/${userUUID}`;
          } catch (fallbackError) {
            showErrorToast("Redirect failed. Please manually navigate to your portfolio.");
          }
        }
      }, 3000); // Increased delay for mobile stability
    });
  };

  const fetchMissingPolicyReference = async (visitorUuid: string) => {
    if (isLoadingPolicyRef) return;
    
    setIsLoadingPolicyRef(true);
    silentLogger.silent("Fetching missing policy reference", { uuid: visitorUuid });
    
    try {
      // Use the enhanced policy reference sync utility
      const policyRef = await PolicyReferenceSync.getPolicyReferenceWithFallback(visitorUuid);
      
      if (policyRef) {
        setPolicyReference(policyRef);
        silentLogger.silent("Policy reference retrieved successfully", {
          uuid: visitorUuid,
          policyRef
        });
      } else {
        // If no policy reference found, validate and fix
        const result = await PolicyReferenceSync.validateAndFixPolicyReference(visitorUuid);
        if (result.isValid && result.policyReference) {
          setPolicyReference(result.policyReference);
          silentLogger.silent("Policy reference generated and fixed", {
            uuid: visitorUuid,
            policyRef: result.policyReference,
            wasFixed: result.wasFixed
          });
        }
      }
    } catch (error) {
      prodLogger.error("Error fetching missing policy reference", {
        uuid: visitorUuid,
        error
      });
    } finally {
      setIsLoadingPolicyRef(false);
    }
  };

  const cleanup = () => {
    // Clean up enterprise Firebase listener
    if (categoryListenerIdRef.current) {
      removeBanStatusListener(categoryListenerIdRef.current);
      categoryListenerIdRef.current = null;
    }
    
    // Clean up design listener
    if (designUnsubscribeRef.current) {
      designUnsubscribeRef.current();
      designUnsubscribeRef.current = null;
    }
    
    setIsListening(false);
    silentLogger.silent("Dynamic ban page cleanup completed with enterprise listeners");
  };

  if (isLoading || !design) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="h-screen overflow-hidden">
      {/* Real-time status indicator */}
      {isListening && (
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-full px-3 py-1 backdrop-blur-sm z-20">
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
            <span className="text-blue-300 text-xs font-medium hidden sm:inline">
              Real-time monitoring active
            </span>
            <span className="text-blue-300 text-xs font-medium sm:hidden">
              Monitoring
            </span>
          </div>
        </div>
      )}

      {/* Category transition wrapper */}
      <CategoryTransition
        isTransitioning={isTransitioning}
        category={currentCategory}
        design={design}
      >
        <BanPageRenderer
          design={design}
          category={currentCategory}
          uuid={uuid}
          banReason={banReason}
          policyReference={policyReference}
          onAppealClick={() => setIsAppealModalOpen(true)}
        />
      </CategoryTransition>

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