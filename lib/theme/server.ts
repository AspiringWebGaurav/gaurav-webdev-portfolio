/**
 * Single Backend Authoritative Theme Store
 * Provides persistent server-side theme state across all subdomains and routes.
 * 
 * Uses globalThis with Symbol.for to ensure singleton identity across
 * Next.js hot reloads, server components, and API routes within the runtime process.
 */

const GLOBAL_THEME_KEY = Symbol.for("gaurav_portfolio_server_theme");

interface GlobalThemeContainer {
  [GLOBAL_THEME_KEY]?: "light" | "dark";
}

const globalContainer = globalThis as unknown as GlobalThemeContainer;

if (!globalContainer[GLOBAL_THEME_KEY]) {
  globalContainer[GLOBAL_THEME_KEY] = "dark";
}

export function getServerTheme(): "light" | "dark" {
  return globalContainer[GLOBAL_THEME_KEY] || "dark";
}

export function setServerTheme(theme: "light" | "dark"): void {
  if (theme === "light" || theme === "dark") {
    globalContainer[GLOBAL_THEME_KEY] = theme;
  }
}
