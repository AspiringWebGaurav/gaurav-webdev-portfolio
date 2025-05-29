"use client";
import { useEffect, useState } from "react";
import { ThemeProvider } from "./provider";
import { LoaderProvider } from "./loader-context";
import { RouteLoader } from "./route-loader";
import GlobalLoader from "./global-loader";
import { MultiStepLoaderDemo } from "@/components/admin/MultiStepLoaderDemo";

export default function ClientLayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showRealApp, setShowRealApp] = useState(false);

  useEffect(() => {
    const alreadyShown =
      sessionStorage.getItem("multisteploaderShown") === "true";
    setShowRealApp(alreadyShown);
  }, []);

  if (!showRealApp) {
    return <MultiStepLoaderDemo onComplete={() => setShowRealApp(true)} />;
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <LoaderProvider>
        <GlobalLoader />
        <RouteLoader />
        {children}
      </LoaderProvider>
    </ThemeProvider>
  );
}
