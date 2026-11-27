"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "@/lib/theme";
import { getSubdomainUrl } from "@/lib/theme/navigation";
import { writeThemeCookieSync } from "@/lib/theme/cookie";

type EcosystemLinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
};

/**
 * Renders the clean canonical href in SSR HTML for SEO/crawlers and
 * upgrades it on mount with cross-subdomain localhost mapping and active ?theme=.
 */
export function EcosystemLink({
  href,
  onClick,
  children,
  ...rest
}: EcosystemLinkProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const resolvedHref = mounted ? getSubdomainUrl(href, resolvedTheme) : href;

  return (
    <a
      href={resolvedHref}
      suppressHydrationWarning
      onClick={(e) => {
        writeThemeCookieSync(resolvedTheme);
        onClick?.(e);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
