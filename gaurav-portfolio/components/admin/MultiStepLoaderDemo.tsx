"use client";
import React, { useEffect, useState } from "react";
import { MultiStepLoader as Loader } from "../ui/multi-step-loader";
import { saveVisitorSession } from "@/lib/firebase-utils";

const loadingStates = [
  { text: "Checking your browser" },
  { text: "Checking your device" },
  { text: "Custom Bot Protection by Gaurav-Backend-Services" },
  { text: "Generating Ray ID" },
  { text: "Finalizing session..." },
  { text: "Entering Gaurav's Portfolio..." },
];

export function MultiStepLoaderDemo({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (loading) {
      const totalDuration = loadingStates.length * 2000; // 6 steps × 2s = 12s

      const timer = setTimeout(async () => {
        try {
          const session = await saveVisitorSession();
          console.log("Ray ID saved:", session.rayId);

          sessionStorage.setItem("multisteploaderShown", "true");
        } catch (err) {
          console.error("Failed to save session:", err);
        }

        onComplete(); // Let parent layout render the site
      }, totalDuration);

      return () => clearTimeout(timer);
    }
  }, [loading, onComplete]);

  return (
    <div className="w-full h-screen flex items-center justify-center bg-black z-50 fixed top-0 left-0">
      <Loader loadingStates={loadingStates} loading={loading} duration={2000} />
    </div>
  );
}
