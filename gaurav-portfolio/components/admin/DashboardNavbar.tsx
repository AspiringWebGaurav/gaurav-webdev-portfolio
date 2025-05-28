// components/admin/DashboardNavbar.tsx
"use client";

import { auth } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";
import { useMemo } from "react";

interface DashboardNavbarProps {
  title?: string;
}

export default function DashboardNavbar({ title }: DashboardNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const derivedTitle = useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    const page = parts[parts.length - 1] || "Dashboard";
    return page
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }, [pathname]);

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/admin/login");
  };

  return (
    <div className="flex justify-between items-center mb-4 border-b pb-2">
      <h1 className="text-xl font-bold">{title || derivedTitle}</h1>
      <button
        className="bg-red-500 text-white px-4 py-2 rounded text-sm"
        onClick={handleLogout}
      >
        Logout
      </button>
    </div>
  );
}
