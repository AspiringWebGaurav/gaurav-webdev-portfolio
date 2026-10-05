"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";

export type Theme = "light" | "dark";

export interface UseThemeProps {
  theme: Theme;
  resolvedTheme: Theme;
  setTheme: (theme: Theme | string) => void;
  themes: string[];
}

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
}

const ThemeContext = createContext<UseThemeProps>({
  theme: "dark",
  resolvedTheme: "dark",
  setTheme: () => {},
  themes: ["light", "dark"],
});

export function ThemeProvider({
  children,
  defaultTheme = "dark",
}: ThemeProviderProps) {
  // Initialize state directly from the DOM class set by pre-paint head script
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.classList.contains("light") ? "light" : "dark";
    }
    return defaultTheme;
  });

  const setTheme = (next: Theme | string) => {
    const validTheme: Theme = next === "light" ? "light" : "dark";
    setThemeState(validTheme);
    if (typeof document !== "undefined") {
      const d = document.documentElement;
      d.classList.remove("light", "dark");
      d.classList.add(validTheme);
      d.style.colorScheme = validTheme;
    }
  };

  // Synchronize on mount if client DOM already had class from synchronous head script
  useEffect(() => {
    if (typeof document !== "undefined") {
      const isLight = document.documentElement.classList.contains("light");
      const current: Theme = isLight ? "light" : "dark";
      setThemeState((prev) => (prev !== current ? current : prev));
    }
  }, []);

  const value = useMemo<UseThemeProps>(
    () => ({
      theme,
      resolvedTheme: theme,
      setTheme,
      themes: ["light", "dark"],
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): UseThemeProps {
  return useContext(ThemeContext);
}
