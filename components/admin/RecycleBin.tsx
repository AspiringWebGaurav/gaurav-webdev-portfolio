"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRecycleBin } from "@/contexts/RecycleBinContext";
import { useContactSubmissions } from "@/contexts/ContactSubmissionContext";
import { useProjects } from "@/contexts/ProjectContext";
import { useTestimonials } from "@/contexts/TestimonialContext";
import { useWorkExperiences } from "@/contexts/WorkExperienceContext";
import { useCurrentlyWorking } from "@/contexts/CurrentlyWorkingContext";
import { showToast } from "@/lib/toast";
import { useRouter } from "next/navigation";
import {
  Trash2,
  RotateCcw,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Calendar,
  ListTodo,
  Timer,
  Bell,
  ArrowUpDown,
  ArrowLeft,
  Briefcase,
  MessageSquare,
  Folder,
  Mail,
  Home,
  ExternalLink,
} from "lucide-react";
import { RecycleBinItemSource, RecycleBinFilters } from "@/types/recycleBin";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

export default function RecycleBin() {
  const router = useRouter();
  const {
    items,
    loading,
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
  const { createItem: createCurrentlyWorking } = useCurrentlyWorking();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSource, setSelectedSource] = useState<
    RecycleBinItemSource | "all"
  >("all");
  const [sortBy, setSortBy] = useState<"deletedAt" | "expiryDate" | "source">(
    "deletedAt"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  
  // Confirmation modal states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [showEmptyBinConfirm, setShowEmptyBinConfirm] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        router.push("/admin/dashboard");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  const filters: RecycleBinFilters = {
    source: selectedSource === "all" ? undefined : selectedSource,
    searchTerm: searchTerm || undefined,
    sortBy,
    sortOrder,
  };

  const filteredItems = useMemo(
    () => getFilteredItems(filters),
    [getFilteredItems, filters]
  );

  const handleRestore = async (
    recycleBinId: string,
    source: RecycleBinItemSource
  ) => {
    try {
      const restoredData = await restoreItem(recycleBinId);
      if (!restoredData) {
        showToast.error(
          "Failed to restore item",
          "Restore Failed"
        );
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
              // Refresh the submissions list to show the restored item
              await refreshSubmissions();
              // Toast already shown by restoreSubmission context
            } else {
              // Error toast already shown by restoreSubmission context
              // Still remove from recycle bin even if restore failed
            }
            break;

          case "project":
            // Restore project through API (shows its own success toast)
            const projectResult = await createProject(restoredData);
            if (!projectResult || !projectResult.success) {
              // Error toast already shown by createProject context
            }
            break;

          case "testimonial":
            // Restore testimonial through API (shows its own success toast)
            const testimonialResult = await createTestimonial(restoredData);
            if (!testimonialResult || !testimonialResult.success) {
              // Error toast already shown by createTestimonial context
            }
            break;

          case "workExperience":
            // Restore work experience through API (shows its own success toast)
            const workExpResult = await createWorkExperience(restoredData);
            if (!workExpResult || !workExpResult.success) {
              // Error toast already shown by createWorkExperience context
            }
            break;

          case "currentlyWorking":
            // Restore currently working item through API (shows its own success toast)
            const currentlyWorkingResult = await createCurrentlyWorking(restoredData);
            if (!currentlyWorkingResult || !currentlyWorkingResult.success) {
              // Error toast already shown by createCurrentlyWorking context
            }
            break;

          case "todo":
            // Keep localStorage for todo (if still needed)
            const todos = JSON.parse(
              localStorage.getItem(`todos_${restoredData.userId}`) || "[]"
            );
            todos.push(restoredData);
            localStorage.setItem(
              `todos_${restoredData.userId}`,
              JSON.stringify(todos)
            );
            showToast.success(
              "Todo restored successfully",
              "Restored Successfully"
            );
            break;

          case "timesheet":
          case "time-tracker":
          case "notification":
            showToast.info(
              `${source} restoration not yet implemented`,
              "Not Implemented"
            );
            break;

          default:
            console.log("Unknown source type:", source);
            showToast.warning(
              "Unknown item type",
              "Unknown Type"
            );
        }
      } catch (error) {
        console.error("Error during item restoration:", error);
        showToast.error(
          "Item removed from recycle bin but restoration may have failed",
          "Restoration Warning"
        );
      }
    } catch (error) {
      console.error("Error restoring item:", error);
      showToast.error(
        "Failed to restore item",
        "Restore Error"
      );
    }
  };

  /**
   * Delete image from Firebase Storage
   */
  const deleteImageFromStorage = async (imageUrl: string): Promise<void> => {
    try {
      if (!imageUrl || !imageUrl.includes("storage.googleapis.com")) {
        return; // Not a Firebase Storage URL
      }

      const response = await fetch("/api/delete-image", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: imageUrl }),
      });

      const result = await response.json();
      if (result.success) {
        console.log("✅ Image deleted from storage:", imageUrl);
      }
    } catch (error) {
      console.error("Failed to delete image from storage:", error);
      // Don't throw - this is cleanup, shouldn't block the main operation
    }
  };

  /**
   * Extract image URLs from item data based on source type
   */
  const extractImageUrls = (item: any, source: RecycleBinItemSource): string[] => {
    const urls: string[] = [];
    
    try {
      switch (source) {
        case "project":
          if (item.data?.image) urls.push(item.data.image);
          if (item.data?.link) urls.push(item.data.link);
          break;
        case "testimonial":
          if (item.data?.img) urls.push(item.data.img);
          break;
        case "workExperience":
          if (item.data?.thumbnail) urls.push(item.data.thumbnail);
          break;
        // contactSubmission doesn't have images
        default:
          break;
      }
    } catch (error) {
      console.error("Error extracting image URLs:", error);
    }
    
    return urls.filter(url => url && url.includes("storage.googleapis.com"));
  };

  const handlePermanentDelete = async (recycleBinId: string) => {
    setDeleteTargetId(recycleBinId);
    setShowDeleteConfirm(true);
  };

  const confirmPermanentDelete = async () => {
    if (!deleteTargetId) return;
    
    // Close modal immediately
    const itemToDelete = deleteTargetId;
    setShowDeleteConfirm(false);
    setDeleteTargetId(null);

    // Show progress notification
    showToast.info(
      "Permanently deleting item...",
      "Deleting..."
    );

    try {
      // Find the item to delete
      const item = items.find(i => i.id === itemToDelete);
      
      if (item) {
        // Extract and delete associated images from Firebase Storage
        const imageUrls = extractImageUrls(item, item.source);
        
        if (imageUrls.length > 0) {
          showToast.info(
            `Deleting ${imageUrls.length} associated image(s)...`,
            "Deleting Images"
          );
          await Promise.all(imageUrls.map(url => deleteImageFromStorage(url)));
        }
      }
      
      // Delete the item from recycle bin
      await permanentlyDelete(itemToDelete);
    } catch (error) {
      console.error("Error deleting item:", error);
      showToast.error(
        "Failed to delete item",
        "Delete Failed"
      );
    }
  };

  const handleEmptyBin = async () => {
    if (items.length === 0) {
      showToast.info(
        "Recycle bin is already empty",
        "Already Empty"
      );
      return;
    }
    setShowEmptyBinConfirm(true);
  };

  const confirmEmptyBin = async () => {
    // Close modal immediately
    setShowEmptyBinConfirm(false);

    // Show progress notification
    const totalItems = items.length;
    showToast.info(
      `Deleting ${totalItems} item${totalItems > 1 ? 's' : ''}...`,
      "Emptying Recycle Bin..."
    );

    try {
      // Extract all image URLs from all items
      const allImageUrls: string[] = [];
      items.forEach(item => {
        const urls = extractImageUrls(item, item.source);
        allImageUrls.push(...urls);
      });
      
      if (allImageUrls.length > 0) {
        showToast.info(
          `Deleting ${allImageUrls.length} associated image(s)...`,
          "Deleting Images"
        );
        await Promise.all(allImageUrls.map(url => deleteImageFromStorage(url)));
      }
      
      // Delete all items
      await permanentlyDeleteAll();
    } catch (error) {
      console.error("Error emptying recycle bin:", error);
      showToast.error(
        "Failed to empty recycle bin",
        "Empty Failed"
      );
    }
  };

  const getSourceIcon = (source: RecycleBinItemSource) => {
    const icons = {
      todo: <ListTodo className="w-4 h-4" />,
      timesheet: <Calendar className="w-4 h-4" />,
      "time-tracker": <Timer className="w-4 h-4" />,
      notification: <Bell className="w-4 h-4" />,
      project: <Folder className="w-4 h-4" />,
      testimonial: <MessageSquare className="w-4 h-4" />,
      workExperience: <Briefcase className="w-4 h-4" />,
      contactSubmission: <Mail className="w-4 h-4" />,
    };
    return icons[source] || <Trash2 className="w-4 h-4" />;
  };

  const getSourceLabel = (source: RecycleBinItemSource) => {
    const labels = {
      todo: "Todo",
      timesheet: "Timesheet",
      "time-tracker": "Time Log",
      notification: "Notification",
      project: "Project",
      testimonial: "Testimonial",
      workExperience: "Work Experience",
      contactSubmission: "Contact Submission",
    };
    return labels[source] || "Unknown";
  };

  const getSourceColor = (source: RecycleBinItemSource) => {
    const colors = {
      todo: "bg-blue-100 text-blue-800 border-blue-200",
      timesheet: "bg-green-100 text-green-800 border-green-200",
      "time-tracker": "bg-purple-100 text-purple-800 border-purple-200",
      notification: "bg-yellow-100 text-yellow-800 border-yellow-200",
      project: "bg-indigo-100 text-indigo-800 border-indigo-200",
      testimonial: "bg-pink-100 text-pink-800 border-pink-200",
      workExperience: "bg-orange-100 text-orange-800 border-orange-200",
      contactSubmission: "bg-cyan-100 text-cyan-800 border-cyan-200",
    };
    return colors[source] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getTimeRemaining = (expiryDate: string) => {
    try {
      const now = new Date().getTime();
      const expiry = new Date(expiryDate).getTime();
      const diff = expiry - now;
      if (diff <= 0) return "Expired";
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      if (days > 0) return `${days}d ${hours}h`;
      return `${hours}h`;
    } catch (error) {
      console.error("Error calculating time remaining:", error);
      return "Unknown";
    }
  };

  const isExpiringSoon = (expiryDate: string) => {
    try {
      const now = new Date().getTime();
      const expiry = new Date(expiryDate).getTime();
      return expiry - now <= 24 * 60 * 60 * 1000;
    } catch (error) {
      return false;
    }
  };

  const formatItemPreview = (item: any, source: RecycleBinItemSource) => {
    try {
      const previews: Record<RecycleBinItemSource, { title: string; description: string }> = {
        todo: { title: item?.title || "Untitled Todo", description: item?.description || "No description" },
        timesheet: { title: `${item?.date || "Unknown date"} - ${item?.project || "No project"}`, description: `${item?.hours || 0}h - ${item?.description || "No description"}` },
        "time-tracker": { title: `${item?.date || "Unknown date"} - ${item?.project || "No project"}`, description: `${item?.hours || 0}h - ${item?.description || "No description"}` },
        notification: { title: item?.title || "Notification", description: item?.message || "No message" },
        project: { title: item?.title || "Untitled Project", description: item?.des || item?.description || "No description" },
        testimonial: { title: item?.name || "Anonymous", description: item?.quote || item?.testimonial || "No testimonial" },
        workExperience: { title: `${item?.title || "Untitled"} at ${item?.company || "Unknown Company"}`, description: item?.desc || item?.description || "No description" },
        contactSubmission: { title: `${item?.name || "Unknown"} (${item?.email || "No email"})`, description: item?.message?.substring(0, 100) || "No message" },
      };
      return previews[source] || { title: "Unknown Item", description: "No preview available" };
    } catch (error) {
      console.error("Error formatting item preview:", error);
      return { title: "Error loading preview", description: "" };
    }
  };

  return (
    <>
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/admin/dashboard")}
              className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Recycle Bin</h1>
              <p className="text-sm text-gray-600 mt-1">
                Deleted items are kept for 15-30 days before permanent deletion
              </p>
            </div>
          </div>
          
          {/* Navigation Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2"
              title="View Portfolio"
            >
              <Home className="w-4 h-4 text-gray-700" />
              <span className="text-sm font-medium text-gray-700 hidden md:inline">Portfolio</span>
            </button>
            <button
              onClick={() => router.push("/admin/dashboard")}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium hidden md:inline">Dashboard</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards - Only Total Items and Expiring Soon */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-gray-900">
                {stats.total}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Items</div>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <Trash2 className="w-7 h-7 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-red-600">
                {stats.expiringWithin24Hours}
              </div>
              <div className="text-sm text-gray-600 mt-1">Expiring Soon</div>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="w-7 h-7 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-4 shadow-sm mb-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value as any)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Sources</option>
              <option value="project">Projects</option>
              <option value="testimonial">Testimonials</option>
              <option value="workExperience">Work Experience</option>
            </select>
          </div>
          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="deletedAt">Deleted Date</option>
              <option value="expiryDate">Expiry Date</option>
              <option value="source">Source</option>
            </select>
          </div>
          <button
            onClick={handleEmptyBin}
            disabled={items.length === 0}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Empty Bin
          </button>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-lg p-12 text-center shadow-sm border border-gray-200">
            <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center shadow-sm border border-gray-200">
            <Trash2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {items.length === 0 ? "Recycle Bin is Empty" : "No Items Match Your Filters"}
            </h3>
            <p className="text-gray-600">
              {searchTerm || selectedSource !== "all"
                ? "Try adjusting your filters"
                : "Deleted items will appear here"}
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
                className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-2.5 rounded-lg border ${getSourceColor(
                        item.source
                      )}`}
                    >
                      {getSourceIcon(item.source)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {preview.title}
                          </h3>
                          <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                            {preview.description}
                          </p>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap border ${getSourceColor(
                            item.source
                          )}`}
                        >
                          {getSourceLabel(item.source)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Deleted: {new Date(item.deletedAt).toLocaleDateString()}
                        </span>
                        <span
                          className={`flex items-center gap-1 ${
                            expiringSoon ? "text-red-600 font-semibold" : ""
                          }`}
                        >
                          {expiringSoon && <AlertTriangle className="w-3 h-3" />}
                          <Clock className="w-3 h-3" />
                          Expires in: {timeRemaining}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleRestore(item.id, item.source)}
                          className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1.5 text-sm font-medium transition-colors"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Restore
                        </button>
                        <button
                          onClick={() =>
                            extendExpiry(
                              item.id,
                              item.expiryDays === 15 ? 30 : 15
                            )
                          }
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1.5 text-sm font-medium transition-colors"
                        >
                          <Clock className="w-4 h-4" />
                          {item.expiryDays === 15 ? "Extend to 30d" : "Set to 15d"}
                        </button>
                        <button
                          onClick={() => handlePermanentDelete(item.id)}
                          className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-1.5 text-sm font-medium transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Forever
                        </button>
                        <button
                          onClick={() =>
                            setExpandedItem(isExpanded ? null : item.id)
                          }
                          className="px-3 py-1.5 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 flex items-center gap-1.5 text-sm font-medium transition-colors"
                        >
                          {isExpanded ? "Hide" : "View"} Details
                        </button>
                      </div>
                      {isExpanded && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">
                            Item Data:
                          </h4>
                          <pre className="text-xs text-gray-700 overflow-auto max-h-96 p-2 bg-white rounded border border-gray-200">
                            {JSON.stringify(item.data, null, 2)}
                          </pre>
                        </div>
                      )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {items.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-500">
            Showing {filteredItems.length} of {items.length} items
          </div>
        )}

      {/* Single Item Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteTargetId(null);
        }}
        onConfirm={confirmPermanentDelete}
        title="Permanently Delete Item"
        message="Are you sure you want to permanently delete this item?"
        confirmText="Delete Permanently"
        variant="danger"
        warningMessage="This action cannot be undone. The item will be permanently removed from the system."
      />

      {/* Empty Bin Confirmation Modal */}
      <ConfirmationModal
        isOpen={showEmptyBinConfirm}
        onClose={() => setShowEmptyBinConfirm(false)}
        onConfirm={confirmEmptyBin}
        title="Empty Recycle Bin"
        message="Are you sure you want to permanently delete all"
        confirmText="Delete All"
        variant="danger"
        itemCount={items.length}
        warningMessage="This action cannot be undone. All items will be permanently removed from the system."
      />
    </>
  );
}
