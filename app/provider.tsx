"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

// 1. Robust window.matchMedia polyfill & null-guard
// Prevents `Cannot read properties of null (reading 'addEventListener') at Provider`
// when next-themes calls window.matchMedia('(prefers-color-scheme: dark)')
if (typeof window !== "undefined") {
  const safeMediaQueryList = (query: string): MediaQueryList => ({
    matches: query.includes("dark"),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });

  if (!window.matchMedia) {
    window.matchMedia = (query: string) => safeMediaQueryList(query);
  } else {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = function (query: string): MediaQueryList {
      try {
        const result = originalMatchMedia.call(window, query);
        if (!result) {
          return safeMediaQueryList(query);
        }
        if (typeof result.addEventListener !== "function") {
          result.addEventListener = function (
            _type: string,
            listener: EventListenerOrEventListenerObject
          ) {
            if (typeof result.addListener === "function") {
              (result.addListener as Function)(listener);
            }
          };
        }
        if (typeof result.removeEventListener !== "function") {
          result.removeEventListener = function (
            _type: string,
            listener: EventListenerOrEventListenerObject
          ) {
            if (typeof result.removeListener === "function") {
              (result.removeListener as Function)(listener);
            }
          };
        }
        return result;
      } catch {
        return safeMediaQueryList(query);
      }
    };
  }

  // Suppress known non-actionable client-side Firebase SDK developer warnings in browser
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

// 2. Resilient Error Boundary to isolate any third-party theme provider failures
interface ThemeErrorBoundaryProps {
  children: React.ReactNode;
}

interface ThemeErrorBoundaryState {
  hasError: boolean;
}

class ThemeErrorBoundary extends React.Component<
  ThemeErrorBoundaryProps,
  ThemeErrorBoundaryState
> {
  constructor(props: ThemeErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn("Theme provider encountered a non-fatal error, falling back to static dark theme:", error);
  }

  render() {
    if (this.state.hasError) {
      return <>{this.props.children}</>;
    }
    return this.props.children;
  }
}

// 3. Mount-guarded ThemeProvider with error boundary wrapper
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeErrorBoundary>
      <NextThemesProvider {...props}>{children}</NextThemesProvider>
    </ThemeErrorBoundary>
  );
}
