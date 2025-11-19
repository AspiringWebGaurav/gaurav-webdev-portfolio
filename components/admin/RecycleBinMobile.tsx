"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRecycleBin } from "@/contexts/RecycleBinContext";
import { useContactSubmissions } from "@/contexts/ContactSubmissionContext";
import { useProjects } from "@/contexts/ProjectContext";
import { useTestimonials } from "@/contexts/TestimonialContext";
import { useWorkExperiences } from "@/contexts/WorkExperienceContext";
import { showToast } from "@/lib/toast";
import { useRouter } from "next/navigation";
import {
  Trash2,
  RotateCcw,
  Clock,
  AlertTriangle,
  Search,
  ListTodo,
  Timer,
  Calendar,
  Bell,
  ArrowLeft,
  Home,
  Briefcase,
  MessageSquare,
  Folder,
  Mail,
} from "lucide-react";
import { RecycleBinItemSource } from "@/types/recycleBin";

export default function RecycleBinMobile() {
  const router = useRouter();
  const {
    items,
    stats,
    restoreItem,
    permanentlyDelete,
    permanentlyDeleteAll,
    extendExpiry,
    getFilteredItems,
  } = useRecycleBin();

  // Context hooks for API restoration
  const { restoreSubmission, refreshSubmissions } = useContactSubmissions();
  const { createProject } = useProjects();
  const { createTestimonial } = useTestimonials();
  const { createWorkExperience } = useWorkExperiences();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSource, setSelectedSource] = useState<
    RecycleBinItemSource | "all"
  >("all");
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  // Keyboard navigation - Escape to go back
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        router.back();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  const filteredItems = useMemo(
    () =>
      getFilteredItems({
        source: selectedSource === "all" ? undefined : selectedSource,
        searchTerm: searchTerm || undefined,
        sortBy: "deletedAt",
        sortOrder: "desc",
      }),
    [getFilteredItems, selectedSource, searchTerm]
  );

  const handleRestore = async (
    recycleBinId: string,
    source: RecycleBinItemSource
  ) => {
    try {
      const restoredData = await restoreItem(recycleBinId);
      if (!restoredData) {
        showToast.info(
          type: "error",
          title: "Restore Failed",
          message: "Failed to restore item",
          duration: 3000,
        });
        return;
      }

      try {
        switch (source) {
          case "contactSubmission":
            const submissionResult = await restoreSubmission({
              name: restoredData.name,
              email: restoredData.email,
              message: restoredData.message,
              status: restoredData.status,
              isReplied: restoredData.isReplied,
              repliedAt: restoredData.repliedAt,
              repliedBy: restoredData.repliedBy,
              replyMessage: restoredData.replyMessage,
              userAgent: restoredData.userAgent,
              ipAddress: restoredData.ipAddress,
              createdAt: restoredData.createdAt,
              updatedAt: new Date(),
            });
            
            if (submissionResult.success) {
              await refreshSubmissions();
              showToast.info(
                type: "success",
                title: "Restored Successfully",
                message: "Contact submission restored with original status preserved",
                duration: 2000,
              });
            } else {
              showToast.info(
                type: "error",
                title: "Restore Failed",
                message: submissionResult.error || "Failed to restore contact submission",
                duration: 3000,
              });
            }
            break;

          case "project":
            const projectResult = await createProject(restoredData);
            if (projectResult) {
              showToast.info(
                type: "success",
                title: "Restored Successfully",
                message: "Project restored successfully",
                duration: 2000,
              });
            } else {
              showToast.info(
                type: "error",
                title: "Restore Failed",
                message: "Failed to restore project",
                duration: 3000,
              });
            }
            break;

          case "testimonial":
            const testimonialResult = await createTestimonial(restoredData);
            if (testimonialResult) {
              showToast.info(
                type: "success",
                title: "Restored Successfully",
                message: "Testimonial restored successfully",
                duration: 2000,
              });
            } else {
              showToast.info(
                type: "error",
                title: "Restore Failed",
                message: "Failed to restore testimonial",
                duration: 3000,
              });
            }
            break;

          case "workExperience":
            const workExpResult = await createWorkExperience(restoredData);
            if (workExpResult) {
              showToast.info(
                type: "success",
                title: "Restored Successfully",
                message: "Work experience restored successfully",
                duration: 2000,
              });
            } else {
              showToast.info(
                type: "error",
                title: "Restore Failed",
                message: "Failed to restore work experience",
                duration: 3000,
              });
            }
            break;

          case "todo":
            const todos = JSON.parse(
              localStorage.getItem(`todos_${restoredData.userId}`) || "[]"
            );
            todos.push(restoredData);
            localStorage.setItem(
              `todos_${restoredData.userId}`,
              JSON.stringify(todos)
            );
            showToast.info(
              type: "success",
              title: "Restored Successfully",
              message: "Todo restored successfully",
              duration: 2000,
            });
            break;

          case "timesheet":
          case "time-tracker":
          case "notification":
            showToast.info(
              type: "info",
              title: "Not Implemented",
              message: `${source} restoration not yet implemented`,
              duration: 3000,
            });
            break;

          default:
            console.log("Unknown source type:", source);
            showToast.info(
              type: "warning",
              title: "Unknown Type",
              message: "Unknown item type",
              duration: 3000,
            });
        }
      } catch (error) {
        console.error("Error during item restoration:", error);
        showToast.info(
          type: "error",
          title: "Restoration Warning",
          message: "Item removed from recycle bin but restoration may have failed",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Error restoring item:", error);
      showToast.info(
        type: "error",
        title: "Restore Error",
        message: "Failed to restore item",
        duration: 3000,
      });
    }
  };

  const getSourceIcon = (source: RecycleBinItemSource) => {
    switch (source) {
      case "todo":
        return <ListTodo className="w-4 h-4" />;
      case "timesheet":
        return <Calendar className="w-4 h-4" />;
      case "time-tracker":
        return <Timer className="w-4 h-4" />;
      case "notification":
        return <Bell className="w-4 h-4" />;
      case "project":
        return <Folder className="w-4 h-4" />;
      case "testimonial":
        return <MessageSquare className="w-4 h-4" />;
      case "workExperience":
        return <Briefcase className="w-4 h-4" />;
      case "contactSubmission":
        return <Mail className="w-4 h-4" />;
      default:
        return <Folder className="w-4 h-4" />;
    }
  };

  const getSourceColor = (source: RecycleBinItemSource) => {
    switch (source) {
      case "todo":
        return "bg-blue-100 text-blue-800";
      case "timesheet":
        return "bg-green-100 text-green-800";
      case "time-tracker":
        return "bg-purple-100 text-purple-800";
      case "notification":
        return "bg-yellow-100 text-yellow-800";
      case "project":
        return "bg-indigo-100 text-indigo-800";
      case "testimonial":
        return "bg-pink-100 text-pink-800";
      case "workExperience":
        return "bg-orange-100 text-orange-800";
      case "contactSubmission":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTimeRemaining = (expiryDate: string) => {
    const now = new Date().getTime();
    const expiry = new Date(expiryDate).getTime();
    const diff = expiry - now;

    if (diff <= 0) return "Expired";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const isExpiringSoon = (expiryDate: string) => {
    const now = new Date().getTime();
    const expiry = new Date(expiryDate).getTime();
    return expiry - now <= 24 * 60 * 60 * 1000;
  };

  const formatItemPreview = (item: any, source: RecycleBinItemSource) => {
    switch (source) {
      case "todo":
        return {
          title: item.title || "Untitled Todo",
          description: item.description || "No description",
        };
      case "timesheet":
      case "time-tracker":
        return {
          title: `${item.date || "Unknown"} - ${item.project || "No project"}`,
          description: `${item.hours || 0}h`,
        };
      case "notification":
        return {
          title: item.title || "Notification",
          description: item.message || "",
        };
      default:
        return { title: "Unknown", description: "" };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        {/* Navigation */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors ml-auto"
            aria-label="Go to dashboard"
          >
            <Home className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-lg">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Recycle Bin
            </h1>
            <p className="text-xs text-gray-600">
              Items auto-delete after expiry
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {[
            { value: "all", label: "All", count: stats.total },
            { value: "todo", label: "Todos", count: stats.todos },
            { value: "timesheet", label: "Sheets", count: stats.timesheets },
            { value: "time-tracker", label: "Logs", count: stats.timeLogs },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSelectedSource(tab.value as any)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${
                selectedSource === tab.value
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {stats.total}
            </div>
            <div className="text-xs text-gray-600">
              Total
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {stats.expiringWithin24Hours}
            </div>
            <div className="text-xs text-gray-600">
              Expiring
            </div>
          </div>
          <div className="text-center">
            <button
              onClick={permanentlyDeleteAll}
              disabled={items.length === 0}
              className="w-full px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              Empty Bin
            </button>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="p-4 space-y-3">
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <Trash2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 text-sm">
              {searchTerm || selectedSource !== "all"
                ? "No items found"
                : "Recycle Bin is empty"}
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const preview = formatItemPreview(item.data, item.source);
            const timeRemaining = getTimeRemaining(item.expiryDate);
            const expiringSoon = isExpiringSoon(item.expiryDate);
            const isExpanded = expandedItem === item.id;

            return (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-sm p-4"
              >
                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className={`p-2 rounded-lg ${getSourceColor(item.source)}`}
                  >
                    {getSourceIcon(item.source)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">
                      {preview.title}
                    </h3>
                    <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                      {preview.description}
                    </p>
                  </div>
                </div>

                {/* Meta */}
                <div className="text-xs text-gray-500 mb-3 space-y-1">
                  <div>
                    Deleted: {new Date(item.deletedAt).toLocaleDateString()}
                  </div>
                  <div
                    className={
                      expiringSoon
                        ? "text-red-600 font-semibold"
                        : ""
                    }
                  >
                    {expiringSoon && (
                      <AlertTriangle className="w-3 h-3 inline mr-1" />
                    )}
                    Expires in: {timeRemaining}
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleRestore(item.id, item.source)}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm flex items-center justify-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Restore
                  </button>
                  <button
                    onClick={() => permanentlyDelete(item.id)}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                  <button
                    onClick={() =>
                      extendExpiry(item.id, item.expiryDays === 15 ? 30 : 15)
                    }
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center justify-center gap-1"
                  >
                    <Clock className="w-3 h-3" />
                    {item.expiryDays === 15 ? "30 days" : "15 days"}
                  </button>
                  <button
                    onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                    className="px-3 py-2 bg-gray-200 text-gray-900 rounded-lg text-sm"
                  >
                    {isExpanded ? "Hide" : "Details"}
                  </button>
                </div>

                {/* Expanded */}
                {isExpanded && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <pre className="text-xs text-gray-700 overflow-auto">
                      {JSON.stringify(item.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
