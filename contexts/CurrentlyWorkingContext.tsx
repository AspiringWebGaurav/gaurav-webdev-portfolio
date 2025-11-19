"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { showToast } from "@/lib/toast";
import {
  CurrentlyWorking,
  CreateCurrentlyWorkingDTO,
  UpdateCurrentlyWorkingDTO,
  CurrentlyWorkingOperationResult,
  validateCurrentlyWorking,
} from "@/types/currentlyWorking";
import { useRecycleBin } from "./RecycleBinContext";

interface CurrentlyWorkingContextType {
  items: CurrentlyWorking[];
  activeItem: CurrentlyWorking | null;
  loading: boolean;
  error: string | null;
  fetchItems: (adminView?: boolean) => Promise<void>;
  createItem: (
    item: CreateCurrentlyWorkingDTO
  ) => Promise<CurrentlyWorkingOperationResult>;
  updateItem: (
    item: UpdateCurrentlyWorkingDTO
  ) => Promise<CurrentlyWorkingOperationResult>;
  deleteItem: (id: string) => Promise<CurrentlyWorkingOperationResult>;
  toggleItemActive: (id: string) => Promise<CurrentlyWorkingOperationResult>;
}

const CurrentlyWorkingContext = createContext<
  CurrentlyWorkingContextType | undefined
>(undefined);

export function CurrentlyWorkingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<CurrentlyWorking[]>([]);
  const [activeItem, setActiveItem] = useState<CurrentlyWorking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { moveToRecycleBin } = useRecycleBin();

  /**
   * Fetch all items or just the active item
   */
  const fetchItems = useCallback(async (adminView: boolean = false) => {
    setLoading(true);
    setError(null);

    try {
      const url = adminView
        ? "/api/currently-working?admin=true"
        : "/api/currently-working";

      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch currently working");
      }

      const data = await response.json();

      if (adminView) {
        // Convert date strings back to Date objects
        const itemsWithDates = data.items.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        }));

        setItems(itemsWithDates);
        
        // Set active item from the list
        const active = itemsWithDates.find((item: CurrentlyWorking) => item.isActive);
        setActiveItem(active || null);
      } else {
        // Frontend view - single active item
        if (data.item) {
          const itemWithDates = {
            ...data.item,
            createdAt: new Date(data.item.createdAt),
            updatedAt: new Date(data.item.updatedAt),
          };
          setActiveItem(itemWithDates);
        } else {
          setActiveItem(null);
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Error fetching currently working:", err);
      showToast.error(errorMessage, "Fetch Error");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new item
   */
  const createItem = useCallback(
    async (
      itemData: CreateCurrentlyWorkingDTO
    ): Promise<CurrentlyWorkingOperationResult> => {
      try {
        // Validate
        const validationErrors = validateCurrentlyWorking(itemData);
        if (validationErrors.length > 0) {
          const errorMessage = validationErrors
            .map((e) => e.message)
            .join(", ");
          showToast.error(errorMessage, "Validation Error");
          return {
            success: false,
            error: errorMessage,
            validationErrors,
          };
        }

        const response = await fetch("/api/currently-working", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(itemData),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to create item");
        }

        // Convert dates
        const newItem = {
          ...result.item,
          createdAt: new Date(result.item.createdAt),
          updatedAt: new Date(result.item.updatedAt),
        };

        setItems((prev) => [...prev, newItem]);

        if (newItem.isActive) {
          setActiveItem(newItem);
        }

        showToast.success("Currently working item created successfully", "Created Successfully");

        return {
          success: true,
          data: newItem,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create item";
        console.error("Error creating currently working item:", err);
        showToast.error(errorMessage, "Create Error");

        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    []
  );

  /**
   * Update an existing item
   */
  const updateItem = useCallback(
    async (
      itemData: UpdateCurrentlyWorkingDTO
    ): Promise<CurrentlyWorkingOperationResult> => {
      try {
        // Validate
        const validationErrors = validateCurrentlyWorking(itemData);
        if (validationErrors.length > 0) {
          const errorMessage = validationErrors
            .map((e) => e.message)
            .join(", ");
          showToast.error(errorMessage, "Validation Error");
          return {
            success: false,
            error: errorMessage,
            validationErrors,
          };
        }

        const response = await fetch("/api/currently-working", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(itemData),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to update item");
        }

        // Convert dates
        const updatedItem = {
          ...result.item,
          createdAt: new Date(result.item.createdAt),
          updatedAt: new Date(result.item.updatedAt),
        };

        setItems((prev) =>
          prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
        );

        if (updatedItem.isActive) {
          setActiveItem(updatedItem);
        } else if (activeItem?.id === updatedItem.id) {
          setActiveItem(null);
        }

        showToast.success("Currently working item updated successfully", "Updated Successfully");

        return {
          success: true,
          data: updatedItem,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update item";
        console.error("Error updating currently working item:", err);
        showToast.error(errorMessage, "Update Error");

        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    [activeItem]
  );

  /**
   * Delete an item
   */
  const deleteItem = useCallback(
    async (id: string): Promise<CurrentlyWorkingOperationResult> => {
      try {
        // Find the item to delete
        const item = items.find((i) => i.id === id);
        if (!item) {
          throw new Error("Item not found");
        }

        // Move to recycle bin first
        await moveToRecycleBin("currentlyWorking", item, id);

        // Then delete from Firestore
        const response = await fetch(`/api/currently-working?id=${id}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to delete item");
        }

        setItems((prev) => prev.filter((item) => item.id !== id));

        if (activeItem?.id === id) {
          setActiveItem(null);
        }

        // Note: Success toast is shown by moveToRecycleBin
        return {
          success: true,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete item";
        console.error("Error deleting currently working item:", err);
        showToast.error(errorMessage, "Delete Error");

        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    [items, activeItem, moveToRecycleBin]
  );

  /**
   * Toggle item active status
   */
  const toggleItemActive = useCallback(
    async (id: string): Promise<CurrentlyWorkingOperationResult> => {
      try {
        const item = items.find((item) => item.id === id);
        if (!item) {
          throw new Error("Item not found");
        }

        // If activating this item, deactivate all others first
        if (!item.isActive) {
          // Deactivate all other items
          const updatePromises = items
            .filter((i) => i.isActive && i.id !== id)
            .map((i) =>
              fetch("/api/currently-working", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: i.id, isActive: false }),
              })
            );

          await Promise.all(updatePromises);
        }

        const response = await fetch("/api/currently-working", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id,
            isActive: !item.isActive,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to toggle item status");
        }

        // Convert dates
        const updatedItem = {
          ...result.item,
          createdAt: new Date(result.item.createdAt),
          updatedAt: new Date(result.item.updatedAt),
        };

        setItems((prev) => {
          // Update all items - deactivate others if this one is being activated
          return prev.map((item) => {
            if (item.id === id) {
              return updatedItem;
            } else if (updatedItem.isActive && item.isActive) {
              return { ...item, isActive: false };
            }
            return item;
          });
        });

        if (updatedItem.isActive) {
          setActiveItem(updatedItem);
        } else {
          setActiveItem(null);
        }

        showToast.success(`Item ${updatedItem.isActive ? "activated" : "deactivated"} successfully`, "Status Updated");

        return {
          success: true,
          data: updatedItem,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to toggle item status";
        console.error("Error toggling item status:", err);
        showToast.error(errorMessage, "Toggle Error");

        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    [items]
  );

  return (
    <CurrentlyWorkingContext.Provider
      value={{
        items,
        activeItem,
        loading,
        error,
        fetchItems,
        createItem,
        updateItem,
        deleteItem,
        toggleItemActive,
      }}
    >
      {children}
    </CurrentlyWorkingContext.Provider>
  );
}

export function useCurrentlyWorking() {
  const context = useContext(CurrentlyWorkingContext);
  if (context === undefined) {
    throw new Error(
      "useCurrentlyWorking must be used within a CurrentlyWorkingProvider"
    );
  }
  return context;
}
