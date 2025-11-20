"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { showToast } from "@/lib/toast";
import {
  RecycleBinItem,
  RecycleBinItemSource,
  RecycleBinStats,
  RecycleBinFilters,
} from "@/types/recycleBin";

/**
 * Mapping configuration for data source operations
 * Maps each RecycleBinItemSource to its corresponding API endpoints
 */
const DATA_SOURCE_CONFIG: Record<
  RecycleBinItemSource,
  {
    deleteEndpoint: string;
    restoreEndpoint: string;
    getIdFromData: (data: any) => string;
    requiresCustomRestore?: boolean;
  }
> = {
  bugReport: {
    deleteEndpoint: "/api/bug-reports",
    restoreEndpoint: "/api/bug-reports/restore",
    getIdFromData: (data) => data.id,
    requiresCustomRestore: true,
  },
  contactSubmission: {
    deleteEndpoint: "/api/contact-submissions",
    restoreEndpoint: "/api/contact-submissions/restore",
    getIdFromData: (data) => data.id,
    requiresCustomRestore: true,
  },
  banAppeal: {
    deleteEndpoint: "/api/ban-appeals",
    restoreEndpoint: "/api/ban-appeals/restore",
    getIdFromData: (data) => data.id,
    requiresCustomRestore: true,
  },
  bubbleSession: {
    deleteEndpoint: "/api/bubble/sessions",
    restoreEndpoint: "/api/bubble/sessions/restore",
    getIdFromData: (data) => data.id,
    requiresCustomRestore: true,
  },
  bubbleMessage: {
    deleteEndpoint: "/api/bubble/messages",
    restoreEndpoint: "/api/bubble/messages/restore",
    getIdFromData: (data) => data.id,
  },
  bubblePredefinedQuestion: {
    deleteEndpoint: "/api/bubble/questions",
    restoreEndpoint: "/api/bubble/questions/restore",
    getIdFromData: (data) => data.id,
  },
  bubbleResume: {
    deleteEndpoint: "/api/bubble/resume",
    restoreEndpoint: "/api/bubble/resume/restore",
    getIdFromData: (data) => data.id,
  },
  project: {
    deleteEndpoint: "/api/projects",
    restoreEndpoint: "/api/projects/restore",
    getIdFromData: (data) => data.id,
  },
  testimonial: {
    deleteEndpoint: "/api/testimonials",
    restoreEndpoint: "/api/testimonials/restore",
    getIdFromData: (data) => data.id,
  },
  workExperience: {
    deleteEndpoint: "/api/work-experience",
    restoreEndpoint: "/api/work-experience/restore",
    getIdFromData: (data) => data.id,
  },
  currentlyWorking: {
    deleteEndpoint: "/api/currently-working",
    restoreEndpoint: "/api/currently-working/restore",
    getIdFromData: (data) => data.id,
  },
  notification: {
    deleteEndpoint: "/api/notifications",
    restoreEndpoint: "/api/notifications/restore",
    getIdFromData: (data) => data.id,
  },
  "visitor-analytics": {
    deleteEndpoint: "/api/visitor-analytics",
    restoreEndpoint: "/api/visitor-analytics/restore",
    getIdFromData: (data) => data.uuid || data.id,
  },
  todo: {
    deleteEndpoint: "/api/todos",
    restoreEndpoint: "/api/todos/restore",
    getIdFromData: (data) => data.id,
  },
  timesheet: {
    deleteEndpoint: "/api/timesheets",
    restoreEndpoint: "/api/timesheets/restore",
    getIdFromData: (data) => data.id,
  },
  "time-tracker": {
    deleteEndpoint: "/api/time-tracker",
    restoreEndpoint: "/api/time-tracker/restore",
    getIdFromData: (data) => data.id,
  },
};

interface RecycleBinContextType {
  items: RecycleBinItem[];
  loading: boolean;
  stats: RecycleBinStats;
  moveToRecycleBin: (
    source: RecycleBinItemSource,
    data: any,
    originalId: string,
    silent?: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  restoreItem: (recycleBinId: string) => Promise<any>;
  permanentlyDelete: (recycleBinId: string) => Promise<void>;
  permanentlyDeleteAll: () => Promise<void>;
  extendExpiry: (recycleBinId: string, days: 15 | 30) => Promise<void>;
  getFilteredItems: (filters?: RecycleBinFilters) => RecycleBinItem[];
  refreshItems: () => Promise<void>;
}

const RecycleBinContext = createContext<RecycleBinContextType | undefined>(
  undefined
);

export const useRecycleBin = () => {
  const context = useContext(RecycleBinContext);
  if (!context) {
    throw new Error("useRecycleBin must be used within RecycleBinProvider");
  }
  return context;
};

interface RecycleBinProviderProps {
  children: ReactNode;
}

export const RecycleBinProvider: React.FC<RecycleBinProviderProps> = ({
  children,
}) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(
    "portfolio-user"
  );
  const [items, setItems] = useState<RecycleBinItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<RecycleBinStats>({
    total: 0,
    todos: 0,
    timesheets: 0,
    timeLogs: 0,
    notifications: 0,
    projects: 0,
    testimonials: 0,
    workExperiences: 0,
    contactSubmissions: 0,
    currentlyWorking: 0,
    bubbleSessions: 0,
    bubbleMessages: 0,
    bubblePredefinedQuestions: 0,
    bubbleResumes: 0,
    banAppeals: 0,
    bugReports: 0,
    expiringWithin24Hours: 0,
  });

  useEffect(() => {
    setCurrentUserId("portfolio-user");
  }, []);

  const loadItems = useCallback(async () => {
    if (!currentUserId) return;

    try {
      setLoading(true);
      const response = await fetch("/api/recycle-bin");
      const result = await response.json();

      if (result.success) {
        setItems(result.items || []);
      } else {
        console.error("Failed to load recycle bin items:", result.error);
        showToast.error("Failed to load recycle bin items", "Load Failed");
        setItems([]);
      }
    } catch (error) {
      console.error("Error loading recycle bin items:", error);
      showToast.error("Failed to load recycle bin items", "Load Error");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (currentUserId) {
      loadItems();
    }
  }, [currentUserId, loadItems]);

  useEffect(() => {
    updateStats();
  }, [items]);

  const refreshItems = useCallback(async () => {
    await loadItems();
  }, [loadItems]);

  const updateStats = () => {
    const now = new Date().getTime();
    const oneDayFromNow = now + 24 * 60 * 60 * 1000;

    const newStats: RecycleBinStats = {
      total: items.length,
      todos: items.filter((item) => item.source === "todo").length,
      timesheets: items.filter((item) => item.source === "timesheet").length,
      timeLogs: items.filter((item) => item.source === "time-tracker").length,
      notifications: items.filter((item) => item.source === "notification")
        .length,
      projects: items.filter((item) => item.source === "project").length,
      testimonials: items.filter((item) => item.source === "testimonial").length,
      workExperiences: items.filter((item) => item.source === "workExperience").length,
      contactSubmissions: items.filter((item) => item.source === "contactSubmission").length,
      currentlyWorking: items.filter((item) => item.source === "currentlyWorking").length,
      bubbleSessions: items.filter((item) => item.source === "bubbleSession").length,
      bubbleMessages: items.filter((item) => item.source === "bubbleMessage").length,
      bubblePredefinedQuestions: items.filter((item) => item.source === "bubblePredefinedQuestion").length,
      bubbleResumes: items.filter((item) => item.source === "bubbleResume").length,
      banAppeals: items.filter((item) => item.source === "banAppeal").length,
      bugReports: items.filter((item) => item.source === "bugReport").length,
      expiringWithin24Hours: items.filter(
        (item) => new Date(item.expiryDate).getTime() <= oneDayFromNow
      ).length,
    };

    setStats(newStats);
  };

  const moveToRecycleBin = useCallback(
    async (
      source: RecycleBinItemSource,
      data: any,
      originalId: string,
      silent: boolean = false
    ): Promise<{ success: boolean; error?: string }> => {
      if (!currentUserId) {
        if (!silent) {
          showToast.error("User not authenticated", "Authentication Error");
        }
        return { success: false, error: "User not authenticated" };
      }

      try {
        const response = await fetch("/api/recycle-bin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source,
            data,
            originalId,
          }),
        });

        const result = await response.json();

        if (result.success) {
          await refreshItems();
          if (!silent) {
            showToast.success(
              "Item will expire in 15 days. You can restore or extend it.",
              "Moved to Recycle Bin"
            );
          }
          return { success: true };
        } else {
          const errorMsg = result.error || "Failed to move item to Recycle Bin";
          if (!silent) {
            showToast.error(errorMsg, "Failed to Move");
          }
          return { success: false, error: errorMsg };
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Failed to move item to Recycle Bin";
        console.error("Error moving to recycle bin:", error);
        if (!silent) {
          showToast.error(errorMsg, "Error");
        }
        return { success: false, error: errorMsg };
      }
    },
    [currentUserId, refreshItems]
  );

  const restoreItem = useCallback(
    async (recycleBinId: string): Promise<any> => {
      const item = items.find((i) => i.id === recycleBinId);
      if (!item) {
        showToast.error("Item not found", "Not Found");
        return null;
      }

      try {
        // Get configuration for this data source
        const config = DATA_SOURCE_CONFIG[item.source];

        if (config && item.data) {
          // Call the restore endpoint for this data type
          const restoreResponse = await fetch(config.restoreEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(
              config.requiresCustomRestore && item.source === 'bubbleSession'
                ? { sessionId: item.data.id }
                : item.data
            ),
          });

          const restoreResult = await restoreResponse.json();

          if (!restoreResult.success) {
            showToast.error(
              restoreResult.error || `Failed to restore ${item.source}`,
              "Restore Failed"
            );
            return null;
          }
        }

        // Remove from recycle bin
        const response = await fetch(`/api/recycle-bin?id=${recycleBinId}`, {
          method: "DELETE",
        });

        const result = await response.json();

        if (result.success) {
          await refreshItems();
          
          // Show appropriate success message
          const sourceLabels: Record<string, string> = {
            bubbleSession: "Bubble session",
            banAppeal: "Ban appeal",
            bugReport: "Bug report",
            contactSubmission: "Contact submission",
            project: "Project",
            testimonial: "Testimonial",
            workExperience: "Work experience",
            currentlyWorking: "Currently working",
            notification: "Notification",
          };
          
          const label = sourceLabels[item.source] || "Item";
          showToast.success(
            `${label} restored successfully`,
            "Item Restored"
          );
          
          return result.item.data;
        } else {
          showToast.error(result.error || "Failed to restore item", "Restore Failed");
          return null;
        }
      } catch (error) {
        console.error("Error restoring item:", error);
        showToast.error("Failed to restore item", "Restore Error");
        return null;
      }
    },
    [items, refreshItems]
  );

  const permanentlyDelete = useCallback(
    async (recycleBinId: string): Promise<void> => {
      try {
        // Get the item first to know what type it is
        const item = items.find((i) => i.id === recycleBinId);
        
        if (!item) {
          showToast.error("Item not found in recycle bin", "Not Found");
          return;
        }

        // Get configuration for this data source
        const config = DATA_SOURCE_CONFIG[item.source];

        if (config && item.data) {
          try {
            const itemId = config.getIdFromData(item.data);
            
            if (itemId) {
              // Delete from original database
              const deleteResponse = await fetch(`${config.deleteEndpoint}?id=${itemId}`, {
                method: "DELETE",
              });

              const deleteResult = await deleteResponse.json();

              if (!deleteResult.success) {
                console.warn(
                  `Failed to delete ${item.source} from database:`,
                  deleteResult.error
                );
                // Continue with recycle bin deletion even if database deletion fails
              }
            }
          } catch (error) {
            console.error(`Error deleting ${item.source} from database:`, error);
            // Continue with recycle bin deletion
          }
        }

        // Delete from recycle bin
        const response = await fetch(`/api/recycle-bin?id=${recycleBinId}`, {
          method: "DELETE",
        });

        const result = await response.json();

        if (result.success) {
          await refreshItems();
          showToast.success("Item permanently deleted", "Deleted Permanently");
        } else {
          showToast.error(result.error || "Failed to delete item", "Delete Failed");
        }
      } catch (error) {
        console.error("Error permanently deleting:", error);
        showToast.error("Failed to delete item", "Delete Failed");
      }
    },
    [items, refreshItems]
  );

  const permanentlyDeleteAll = useCallback(async (): Promise<void> => {
    if (!currentUserId) {
      showToast.error("User not authenticated", "Authentication Error");
      return;
    }

    try {
      // Group items by source type
      const itemsBySource = items.reduce((acc, item) => {
        if (!acc[item.source]) {
          acc[item.source] = [];
        }
        acc[item.source].push(item);
        return acc;
      }, {} as Record<RecycleBinItemSource, RecycleBinItem[]>);

      // Calculate total items to delete
      const totalItems = items.length;
      
      if (totalItems > 0) {
        showToast.info(
          `Deleting ${totalItems} item${totalItems > 1 ? 's' : ''} from database...`,
          "Processing"
        );

        // Delete items from their original databases
        const deletePromises: Promise<any>[] = [];

        for (const [source, sourceItems] of Object.entries(itemsBySource)) {
          const config = DATA_SOURCE_CONFIG[source as RecycleBinItemSource];
          
          if (config && sourceItems.length > 0) {
            // Delete each item from its original database
            for (const item of sourceItems) {
              try {
                const itemId = config.getIdFromData(item.data);
                
                if (itemId) {
                  const deletePromise = fetch(`${config.deleteEndpoint}?id=${itemId}`, {
                    method: "DELETE",
                  }).catch(err => {
                    console.error(`Failed to delete ${source} ${itemId}:`, err);
                    return null;
                  });
                  
                  deletePromises.push(deletePromise);
                }
              } catch (error) {
                console.error(`Error processing ${source}:`, error);
              }
            }
          }
        }

        // Wait for all database deletions to complete
        await Promise.all(deletePromises);
      }

      // Then delete all from recycle bin
      const response = await fetch("/api/recycle-bin?deleteAll=true", {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        await refreshItems();
        showToast.success("All items permanently deleted", "Bin Emptied");
      } else {
        showToast.error(result.error || "Failed to delete all items", "Empty Failed");
      }
    } catch (error) {
      console.error("Error deleting all items:", error);
      showToast.error("Failed to delete all items", "Delete Failed");
    }
  }, [currentUserId, refreshItems]);

  const extendExpiry = useCallback(
    async (recycleBinId: string, days: 15 | 30): Promise<void> => {
      try {
        const response = await fetch("/api/recycle-bin", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: recycleBinId,
            expiryDays: days,
          }),
        });

        const result = await response.json();

        if (result.success) {
          await refreshItems();
          showToast.success(`Item will now expire in ${days} days`, "Expiry Extended");
        } else {
          showToast.error(result.error || "Failed to extend expiry", "Extension Failed");
        }
      } catch (error) {
        console.error("Error extending expiry:", error);
        showToast.error("Failed to extend expiry", "Extension Failed");
      }
    },
    [refreshItems]
  );

  const getFilteredItems = useCallback(
    (filters?: RecycleBinFilters): RecycleBinItem[] => {
      let filtered = [...items];

      if (filters?.source) {
        filtered = filtered.filter((item) => item.source === filters.source);
      }

      if (filters?.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        filtered = filtered.filter((item) => {
          const dataStr = JSON.stringify(item.data).toLowerCase();
          return dataStr.includes(term) || item.source.includes(term);
        });
      }

      const sortBy = filters?.sortBy || "deletedAt";
      const sortOrder = filters?.sortOrder || "desc";

      filtered.sort((a, b) => {
        let aVal, bVal;

        switch (sortBy) {
          case "deletedAt":
            aVal = new Date(a.deletedAt).getTime();
            bVal = new Date(b.deletedAt).getTime();
            break;
          case "expiryDate":
            aVal = new Date(a.expiryDate).getTime();
            bVal = new Date(b.expiryDate).getTime();
            break;
          case "source":
            aVal = a.source;
            bVal = b.source;
            break;
          default:
            return 0;
        }

        if (sortOrder === "asc") {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });

      return filtered;
    },
    [items]
  );

  const value: RecycleBinContextType = {
    items,
    loading,
    stats,
    moveToRecycleBin,
    restoreItem,
    permanentlyDelete,
    permanentlyDeleteAll,
    extendExpiry,
    getFilteredItems,
    refreshItems,
  };

  return (
    <RecycleBinContext.Provider value={value}>
      {children}
    </RecycleBinContext.Provider>
  );
};
