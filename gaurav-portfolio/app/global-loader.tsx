"use client";
import { useLoader } from "./loader-context";
import Loader from "@/components/Loader";

export default function GlobalLoader() {
  const { isLoading } = useLoader();
  return isLoading ? <Loader /> : null;
}
