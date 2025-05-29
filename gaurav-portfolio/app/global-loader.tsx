"use client";
import { useEffect } from "react";
import { useLoader } from "./loader-context";
import Loader from "@/components/Loader";

export default function GlobalLoader() {
  const { isLoading } = useLoader();

  useEffect(() => {
    const fallback = document.getElementById("fallback-loader");
    if (fallback) {
      fallback.style.opacity = "0";
      setTimeout(() => fallback.remove(), 300);
    }
  }, []);

  return isLoading ? <Loader /> : null;
}
