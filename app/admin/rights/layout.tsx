"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";

export default function AdminRightsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // Determine if we're on a sub-page
  const isSubPage = pathname !== "/admin/rights";

  // Get page title based on path
  const getPageTitle = () => {
    if (pathname.includes("/maintenance")) return "Maintenance Mode";
    if (pathname.includes("/cache")) return "Cache Management";
    if (pathname.includes("/suspension")) return "Suspension Mode";
    return "Admin Rights";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar - Only show on sub-pages */}
      {isSubPage && (
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm">
                <button
                  onClick={() => router.push("/admin/dashboard")}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Admin
                </button>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <button
                  onClick={() => router.push("/admin/rights")}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Admin Rights
                </button>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900 font-medium">{getPageTitle()}</span>
              </div>

              {/* Back Button */}
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Content */}
      {children}
    </div>
  );
}
