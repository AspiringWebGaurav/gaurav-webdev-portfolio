"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

// Import production console silencer
if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
  import("@/utils/productionConsoleSilencer").then(({ initializeProductionConsoleSilencing }) => {
    initializeProductionConsoleSilencing();
  });
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  // Initialize console silencing on mount in production
  React.useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      import("@/utils/productionConsoleSilencer").then(({ initializeProductionConsoleSilencing }) => {
        initializeProductionConsoleSilencing();
      });
    }
  }, []);

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
