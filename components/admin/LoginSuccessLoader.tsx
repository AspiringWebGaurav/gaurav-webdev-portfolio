"use client";

import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface LoginSuccessLoaderProps {
  show: boolean;
}

export default function LoginSuccessLoader({ show }: LoginSuccessLoaderProps) {
  const [stage, setStage] = useState<"validating" | "success" | "loading">("validating");

  useEffect(() => {
    if (show) {
      // Stage 1: Validating (0-500ms)
      setStage("validating");
      
      // Stage 2: Success (500-1000ms)
      setTimeout(() => {
        setStage("success");
      }, 500);
      
      // Stage 3: Loading dashboard (1000-1500ms)
      setTimeout(() => {
        setStage("loading");
      }, 1000);
    }
  }, [show]);

  if (!show) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
      >
        <div className="flex flex-col items-center gap-6 px-6">
          {/* Icon Animation */}
          <AnimatePresence mode="wait">
            {stage === "validating" && (
              <motion.div
                key="validating"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ duration: 0.3 }}
              >
                <Loader2 className="w-16 h-16 text-purple-500 animate-spin" />
              </motion.div>
            )}
            
            {stage === "success" && (
              <motion.div
                key="success"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.4 }}
              >
                <CheckCircle2 className="w-16 h-16 text-green-500" />
              </motion.div>
            )}
            
            {stage === "loading" && (
              <motion.div
                key="loading"
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: 360 }}
                transition={{ duration: 0.4 }}
              >
                <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Text Animation */}
          <AnimatePresence mode="wait">
            {stage === "validating" && (
              <motion.div
                key="validating-text"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center"
              >
                <h2 className="text-2xl font-bold text-white mb-2">
                  Validating Credentials
                </h2>
                <p className="text-gray-400 text-sm">
                  Verifying your password...
                </p>
              </motion.div>
            )}
            
            {stage === "success" && (
              <motion.div
                key="success-text"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center"
              >
                <h2 className="text-2xl font-bold text-green-400 mb-2">
                  Login Successful!
                </h2>
                <p className="text-gray-400 text-sm">
                  Welcome back, Admin
                </p>
              </motion.div>
            )}
            
            {stage === "loading" && (
              <motion.div
                key="loading-text"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <h2 className="text-2xl font-bold text-blue-400 mb-2">
                  Loading Dashboard
                </h2>
                <p className="text-gray-400 text-sm">
                  Preparing your workspace...
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress Bar */}
          <div className="w-64 h-1 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-green-500"
              initial={{ width: "0%" }}
              animate={{ 
                width: stage === "validating" ? "33%" : stage === "success" ? "66%" : "100%" 
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
