"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home, Trash2 } from "lucide-react";

interface BreadcrumbProps {
  activeTab?: string;
  activeTabIcon?: string; // Optional emoji icon for active tab
  customItems?: Array<{ label: string; href?: string; icon?: string }>;
  showPathBreadcrumbs?: boolean; // Control if pathname-based breadcrumbs should be shown
}

export default function Breadcrumb({
  activeTab,
  activeTabIcon,
  customItems,
  showPathBreadcrumbs = true,
}: BreadcrumbProps) {
  const pathname = usePathname();

  // Generate breadcrumb items from pathname
  const generateBreadcrumbs = () => {
    const breadcrumbs: Array<{
      label: string;
      href?: string;
      isHome: boolean;
      icon?: string;
    }> = [{ label: "Home", href: "/", isHome: true }];

    if (showPathBreadcrumbs) {
      const paths = pathname.split("/").filter((path) => path);
      
      // If we're in admin section, add Admin breadcrumb
      if (paths[0] === "admin") {
        breadcrumbs.push({
          label: "Admin",
          href: "/admin/dashboard",
          isHome: false,
        });
        
        // If there are more path segments after admin and dashboard
        if (paths.length > 2) {
          // Add the specific page (e.g., recycle-bin)
          const pagePath = paths.slice(2).join("/");
          const label = paths[2]
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
          
          breadcrumbs.push({
            label,
            href: `/admin/${pagePath}`,
            isHome: false,
          });
        }
      }
    }

    // Add active tab if provided (this overrides the last breadcrumb)
    if (activeTab) {
      // Remove the last breadcrumb if it exists and replace with activeTab
      if (breadcrumbs.length > 2) {
        breadcrumbs.pop();
      }
      breadcrumbs.push({
        label: activeTab,
        icon: activeTabIcon,
        isHome: false,
      });
    }

    // Add custom items if provided
    if (customItems && customItems.length > 0) {
      customItems.forEach((item) => {
        breadcrumbs.push({
          label: item.label,
          href: item.href,
          icon: item.icon,
          isHome: false,
        });
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't show breadcrumb if only home item exists
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="bg-gray-50/50 border-b border-gray-200">
      <div className="px-4 md:px-6 py-1.5 md:py-2.5">
        <ol className="flex items-center gap-1 text-xs overflow-x-auto scrollbar-hide">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;

            return (
              <li
                key={`${crumb.href}-${index}`}
                className="flex items-center gap-1 group"
              >
                {index > 0 && (
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                )}
                {isLast || !crumb.href ? (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-600/15 text-blue-700 font-medium whitespace-nowrap">
                    {crumb.isHome && <Home className="w-3.5 h-3.5" />}
                    {crumb.icon === "recycleBin" ? (
                      <Trash2 className="w-3.5 h-3.5" />
                    ) : crumb.icon ? (
                      <span className="text-sm">{crumb.icon}</span>
                    ) : null}
                    <span className="text-xs">{crumb.label}</span>
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all whitespace-nowrap"
                  >
                    {crumb.isHome && <Home className="w-3.5 h-3.5" />}
                    {crumb.icon === "recycleBin" ? (
                      <Trash2 className="w-3.5 h-3.5" />
                    ) : crumb.icon ? (
                      <span className="text-sm">{crumb.icon}</span>
                    ) : null}
                    <span className="text-xs">{crumb.label}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {/* Hide scrollbar style */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </nav>
  );
}
