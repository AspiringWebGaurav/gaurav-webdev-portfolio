"use client";

import React, { useEffect, useState } from "react";
import DesktopLogin from "./_components/DesktopLogin";
import MobileLogin from "./_components/MobileLogin";

export default function LoginRoute() {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1024);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (isDesktop === null) return null;

  return isDesktop ? <DesktopLogin /> : <MobileLogin />;
}
