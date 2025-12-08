/**
 * Curtain Transition Component
 * 
 * Dramatic "theater curtain" closing animation for maintenance mode entry.
 * Two panels slide from edges to center, meet with impact effect,
 * display transition message, then redirect to maintenance page.
 * 
 * Designed to blend seamlessly with existing maintenance page theme.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import { Wrench, Settings, Code, Sparkles, Zap, Shield, Cpu, Rocket } from "lucide-react";

// Rotating icons for the center animation
const CURTAIN_ICONS = [
  { Icon: Wrench, color: "text-purple" },
  { Icon: Settings, color: "text-blue-400" },
  { Icon: Code, color: "text-cyan-400" },
  { Icon: Sparkles, color: "text-pink-400" },
  { Icon: Zap, color: "text-yellow-400" },
  { Icon: Shield, color: "text-green-400" },
  { Icon: Cpu, color: "text-blue-400" },
  { Icon: Rocket, color: "text-orange-400" },
];

// Animation phases
type AnimationPhase = 
  | "idle"
  | "curtains-closing"
  | "curtains-closed"
  | "impact"
  | "content-reveal"
  | "loading"
  | "redirecting";

interface CurtainTransitionProps {
  isActive: boolean;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export default function CurtainTransition({ 
  isActive, 
  onComplete,
  onError 
}: CurtainTransitionProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<AnimationPhase>("idle");
  const [iconIndex, setIconIndex] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [hasError, setHasError] = useState(false);

  // Icon rotation during animation (slower rotation)
  useEffect(() => {
    if (phase === "content-reveal" || phase === "loading") {
      const timer = setInterval(() => {
        setIconIndex((prev) => (prev + 1) % CURTAIN_ICONS.length);
      }, 800);
      return () => clearInterval(timer);
    }
  }, [phase]);

  // Loading progress animation (slower fill)
  useEffect(() => {
    if (phase === "loading") {
      const timer = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            return 100;
          }
          return prev + 2; // Slower increment
        });
      }, 35); // Slightly faster interval but smaller increments = smoother
      return () => clearInterval(timer);
    }
  }, [phase]);

  // Handle redirect with error handling
  const handleRedirect = useCallback(async () => {
    try {
      setPhase("redirecting");
      
      // Small delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Attempt redirect
      router.replace("/maintenance");
      
      // Call completion callback
      onComplete?.();
    } catch (error) {
      console.error("[CurtainTransition] Redirect error:", error);
      setHasError(true);
      onError?.(error instanceof Error ? error : new Error("Redirect failed"));
      
      // Fallback: force navigation
      setTimeout(() => {
        window.location.href = "/maintenance";
      }, 500);
    }
  }, [router, onComplete, onError]);

  // Main animation sequence
  useEffect(() => {
    if (!isActive || phase !== "idle") return;

    const runAnimation = async () => {
      try {
        // Phase 1: Start curtains closing (slower for dramatic effect)
        setPhase("curtains-closing");
        await new Promise(resolve => setTimeout(resolve, 1200));

        // Phase 2: Curtains fully closed
        setPhase("curtains-closed");
        await new Promise(resolve => setTimeout(resolve, 400));

        // Phase 3: Impact effect
        setPhase("impact");
        await new Promise(resolve => setTimeout(resolve, 500));

        // Phase 4: Content reveal (longer to read the message)
        setPhase("content-reveal");
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Phase 5: Loading bar (slower fill)
        setPhase("loading");
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Phase 6: Redirect
        await handleRedirect();

      } catch (error) {
        console.error("[CurtainTransition] Animation error:", error);
        setHasError(true);
        onError?.(error instanceof Error ? error : new Error("Animation failed"));
        
        // Failsafe: redirect anyway after error
        setTimeout(() => {
          router.replace("/maintenance");
        }, 1000);
      }
    };

    runAnimation();
  }, [isActive, phase, handleRedirect, router, onError]);

  // Reset when deactivated
  useEffect(() => {
    if (!isActive) {
      setPhase("idle");
      setLoadingProgress(0);
      setHasError(false);
    }
  }, [isActive]);

  // Don't render if not active and idle
  if (!isActive && phase === "idle") return null;

  const CurrentIcon = CURTAIN_ICONS[iconIndex];

  return (
    <AnimatePresence>
      {(isActive || phase !== "idle") && (
        <motion.div
          className="fixed inset-0 z-[9999] overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Background overlay with blur */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === "curtains-closing" ? 0.5 : 1 }}
            transition={{ duration: 0.3 }}
          />

          {/* Left Curtain Panel */}
          <motion.div
            className="absolute top-0 left-0 h-full bg-black-100 overflow-hidden"
            style={{ width: "50%" }}
            initial={{ x: "-100%" }}
            animate={{
              x: phase === "idle" ? "-100%" : "0%",
            }}
            transition={{
              duration: 1.2,
              ease: [0.65, 0, 0.35, 1], // Custom easing for smooth close
            }}
          >
            {/* Grid pattern */}
            <div className="absolute inset-0 bg-grid-white/[0.03]">
              <div className="absolute inset-0 [mask-image:linear-gradient(to_right,black_80%,transparent)]" />
            </div>
            
            {/* Purple spotlight glow on right edge */}
            <motion.div
              className="absolute top-0 right-0 w-32 h-full"
              style={{
                background: "linear-gradient(to left, rgba(139,92,246,0.3), transparent)",
              }}
              animate={{
                opacity: phase === "impact" ? [0.3, 0.8, 0.3] : 0.3,
              }}
              transition={{ duration: 0.3 }}
            />
            
            {/* Particles on left panel */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(10)].map((_, i) => (
                <motion.div
                  key={`left-particle-${i}`}
                  className="absolute w-1 h-1 rounded-full bg-purple/60"
                  style={{
                    top: `${Math.random() * 100}%`,
                    right: `${Math.random() * 30}%`,
                  }}
                  animate={{
                    x: [0, 20, 0],
                    opacity: [0, 0.8, 0],
                    scale: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
          </motion.div>

          {/* Right Curtain Panel */}
          <motion.div
            className="absolute top-0 right-0 h-full bg-black-100 overflow-hidden"
            style={{ width: "50%" }}
            initial={{ x: "100%" }}
            animate={{
              x: phase === "idle" ? "100%" : "0%",
            }}
            transition={{
              duration: 1.2,
              ease: [0.65, 0, 0.35, 1],
            }}
          >
            {/* Grid pattern */}
            <div className="absolute inset-0 bg-grid-white/[0.03]">
              <div className="absolute inset-0 [mask-image:linear-gradient(to_left,black_80%,transparent)]" />
            </div>
            
            {/* Purple spotlight glow on left edge */}
            <motion.div
              className="absolute top-0 left-0 w-32 h-full"
              style={{
                background: "linear-gradient(to right, rgba(139,92,246,0.3), transparent)",
              }}
              animate={{
                opacity: phase === "impact" ? [0.3, 0.8, 0.3] : 0.3,
              }}
              transition={{ duration: 0.3 }}
            />
            
            {/* Particles on right panel */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(10)].map((_, i) => (
                <motion.div
                  key={`right-particle-${i}`}
                  className="absolute w-1 h-1 rounded-full bg-blue-500/60"
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 30}%`,
                  }}
                  animate={{
                    x: [0, -20, 0],
                    opacity: [0, 0.8, 0],
                    scale: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
          </motion.div>

          {/* Center Line - Appears when curtains meet */}
          <AnimatePresence>
            {(phase === "curtains-closed" || phase === "impact" || phase === "content-reveal" || phase === "loading" || phase === "redirecting") && (
              <motion.div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-full"
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ 
                  opacity: phase === "impact" ? 1 : 0.6,
                  scaleY: 1,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* Spinning gradient line (like contact button) */}
                <div className="relative w-full h-full overflow-hidden">
                  <motion.div
                    className="absolute inset-0"
                    style={{
                      background: "linear-gradient(180deg, transparent, #E2CBFF, #393BB2, #E2CBFF, transparent)",
                    }}
                    animate={{
                      y: ["-100%", "100%"],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Impact Flash Effect */}
          <AnimatePresence>
            {phase === "impact" && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.4, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-full bg-purple/40 blur-2xl sm:blur-3xl" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Impact Ripple Effect */}
          <AnimatePresence>
            {phase === "impact" && (
              <>
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={`ripple-${i}`}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-purple/50"
                    initial={{ width: 0, height: 0, opacity: 0.8 }}
                    animate={{
                      width: `min(${250 + i * 60}px, ${70 + i * 10}vw)`,
                      height: `min(${250 + i * 60}px, ${70 + i * 10}vw)`,
                      opacity: 0,
                    }}
                    transition={{
                      duration: 0.8,
                      delay: i * 0.1,
                      ease: "easeOut",
                    }}
                  />
                ))}
              </>
            )}
          </AnimatePresence>

          {/* Center Content - Appears after impact */}
          <AnimatePresence>
            {(phase === "content-reveal" || phase === "loading" || phase === "redirecting") && (
              <motion.div
                className="fixed inset-0 flex items-center justify-center z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="flex flex-col items-center gap-5 sm:gap-6 md:gap-8"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  {/* Rotating Icon */}
                  <motion.div
                    className="relative"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  >
                    {/* Outer glow rings */}
                    <motion.div
                      className="absolute -inset-4 sm:-inset-5 md:-inset-6 rounded-full border border-purple/30"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute -inset-8 sm:-inset-10 md:-inset-12 rounded-full border border-purple/20"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                    />
                    
                    {/* Icon container - Responsive */}
                    <motion.div
                      className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-purple/30 to-blue-600/20 flex items-center justify-center border-2 border-purple/50 shadow-2xl shadow-purple/40"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    >
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={iconIndex}
                          initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
                          animate={{ opacity: 1, scale: 1, rotate: 0 }}
                          exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
                          transition={{ duration: 0.3 }}
                        >
                          <CurrentIcon.Icon className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 ${CurrentIcon.color}`} />
                        </motion.div>
                      </AnimatePresence>
                    </motion.div>
                  </motion.div>

                  {/* Text - Responsive */}
                  <motion.div
                    className="text-center px-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent mb-2 sm:mb-3">
                      Entering Maintenance Mode
                    </h2>
                    <motion.p 
                      className="text-white/50 text-sm sm:text-base"
                      animate={{ opacity: [0.5, 0.8, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {hasError ? "Redirecting..." : "Preparing maintenance view..."}
                    </motion.p>
                  </motion.div>

                  {/* Loading Bar - Responsive */}
                  <motion.div
                    className="w-48 sm:w-64 md:w-80 h-1.5 sm:h-2 bg-white/10 rounded-full overflow-hidden"
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: "linear-gradient(90deg, #8b5cf6, #3b82f6, #8b5cf6)",
                        backgroundSize: "200% 100%",
                      }}
                      initial={{ width: "0%" }}
                      animate={{ 
                        width: `${loadingProgress}%`,
                        backgroundPosition: ["0% 0%", "100% 0%"],
                      }}
                      transition={{
                        width: { duration: 0.1 },
                        backgroundPosition: { duration: 1, repeat: Infinity, ease: "linear" },
                      }}
                    />
                  </motion.div>

                  {/* Status indicators */}
                  <motion.div
                    className="flex items-center gap-2 text-xs sm:text-sm text-white/40"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <motion.div
                      className="w-2 h-2 rounded-full bg-purple"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                    <span>{phase === "redirecting" ? "Redirecting..." : "Initializing..."}</span>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error state fallback UI */}
          {hasError && (
            <motion.div
              className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 px-3 sm:px-4 py-2 bg-amber-500/20 border border-amber-500/40 rounded-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-amber-400 text-xs sm:text-sm">Taking a bit longer... Please wait.</p>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
