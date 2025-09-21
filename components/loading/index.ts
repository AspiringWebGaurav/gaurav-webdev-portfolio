// Enhanced Loading System - Complete Export Index
// Comprehensive loading solution with route transitions, beautiful spinners, and UX optimizations

// Core Spinner Components
export { 
  EnhancedSpinners,
  SpinnerCircle,
  SpinnerDots, 
  SpinnerDualRing,
  SpinnerProgress,
  SpinnerBalls,
  SpinnerWave
} from './EnhancedSpinners';

// Suspense Components
export {
  EnhancedSuspense,
  PageSuspense,
  ComponentSuspense,
  CardSuspense,
  MinimalSuspense
} from './EnhancedSuspense';

// Loading Provider and Context
export {
  LoadingProvider,
  useLoading,
  useGlobalLoading,
  useComponentLoading,
  useRouteNavigation
} from './LoadingProvider';

// Route Loading Overlay
export { default as RouteLoadingOverlay } from './RouteLoadingOverlay';

// Loading Hook
export { useRouteLoading, usePortfolioNavigation } from '../../hooks/useRouteLoading';

// Enhanced UI Components
export { default as EnhancedMagicButton } from '../ui/EnhancedMagicButton';

// Legacy Components (for backward compatibility)
export { default as GlobalLoader } from '../GlobalLoader';

/**
 * USAGE EXAMPLES:
 * 
 * // 1. Basic Spinners
 * import { EnhancedSpinners } from '@/components/loading';
 * <EnhancedSpinners.Circle size="lg" color="gradient" />
 * 
 * // 2. Route Navigation with Loading
 * import { useRouteNavigation } from '@/components/loading';
 * const nav = useRouteNavigation();
 * nav.navigateWithLoading('/target-page', { message: 'Loading...' });
 * 
 * // 3. Enhanced Suspense
 * import { ComponentSuspense } from '@/components/loading';
 * <ComponentSuspense message="Loading component...">
 *   <LazyComponent />
 * </ComponentSuspense>
 * 
 * // 4. Global Loading Control
 * import { useGlobalLoading } from '@/components/loading';
 * const { show, hide } = useGlobalLoading();
 * show('Processing...');
 * 
 * // 5. Enhanced Button with Loading
 * import { EnhancedMagicButton } from '@/components/loading';
 * <EnhancedMagicButton 
 *   title="Submit"
 *   isLoading={isSubmitting}
 *   loadingText="Submitting..."
 * />
 */

/**
 * ACCESSIBILITY FEATURES:
 * - All spinners include proper ARIA labels and roles
 * - Loading states announced to screen readers
 * - Focus management during transitions  
 * - High contrast support
 * - Reduced motion support via CSS
 */

/**
 * PERFORMANCE FEATURES:
 * - Minimum loading time enforcement for smooth UX
 * - Intelligent progress simulation
 * - Route transition detection
 * - Memory efficient component loading states
 * - Background preloading support
 */

/**
 * UX FEATURES:
 * - Contextual loading messages
 * - Progressive loading indicators
 * - Beautiful gradient animations
 * - Smooth enter/exit transitions
 * - Multiple spinner variants for different contexts
 */