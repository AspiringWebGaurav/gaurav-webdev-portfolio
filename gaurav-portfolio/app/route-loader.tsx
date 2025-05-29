"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useLoader } from "./loader-context";

export const RouteLoader = () => {
  const pathname = usePathname();
  const { setIsLoading } = useLoader();

  useEffect(() => {
    setIsLoading(true);
    const timeout = setTimeout(() => setIsLoading(false), 1000); // simulate load
    return () => clearTimeout(timeout);
  }, [pathname]);

  return null;
};
