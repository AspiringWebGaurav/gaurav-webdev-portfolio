"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

// Suppress known non-actionable client-side Firebase SDK developer warnings in browser
if (typeof window !== "undefined") {
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    const isAppCheckWarning = args.some(
      (arg) =>
        typeof arg === "string" &&
        (arg.includes("Missing appcheck token") ||
          arg.includes("FIREBASE WARNING"))
    );
    if (isAppCheckWarning) {
      return;
    }
    originalWarn.apply(console, args);
  };
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
