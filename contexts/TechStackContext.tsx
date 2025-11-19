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
  TechStack,
  CreateTechStackDTO,
  UpdateTechStackDTO,
  TechStackOperationResult,
  validateTechStack,
} from "@/types/techStack";

interface TechStackContextType {
  items: TechStack[];
  loading: boolean;
  error: string | null;
  fetchItems: (adminView?: boolean) => Promise<void>;
  createItem: (
    item: CreateTechStackDTO
  ) => Promise<TechStackOperationResult>;
  updateItem: (
    item: UpdateTechStackDTO
  ) => Promise<TechStackOperationResult>;
  deleteItem: (id: string) => Promise<TechStackOperationResult>;
  toggleItemActive: (id: string) => Promise<TechStackOperationResult>;
}

const TechStackContext = createContext<TechStackContextType | undefined>(
  undefined
);

export function TechStackProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<TechStack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all items
   */
  const fetchItems = useCallback(async (adminView: boolean = false) => {
    setLoading(true);
    setError(null);

    try {
      const url = adminView
        ? "/api/tech-stacks?admin=true"
        : "/api/tech-stacks";

      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Include credentials for auth
      });

      if (!response.ok) {
        let errorMessage = "Failed to fetch tech stacks";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.details || errorMessage;
          console.error("API Error Response:", errorData);
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Handle empty or invalid response
      if (!data || !data.items) {
        console.warn("Invalid response structure:", data);
        setItems([]);
        return;
      }

      // Convert date strings back to Date objects
      const itemsWithDates = data.items.map((item: any) => ({
        ...item,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      }));

      setItems(itemsWithDates);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Error fetching tech stacks:", err);
      
      // Don't show toast on initial load, only on explicit fetch
      if (items.length > 0) {
        showToast.error(errorMessage, "Error");
      }
    } finally {
      setLoading(false);
    }
  }, []); // Remove items.length from dependencies

  /**
   * Create a new item
   */
  const createItem = useCallback(
    async (
      itemData: CreateTechStackDTO
    ): Promise<TechStackOperationResult> => {
      try {
        // Validate
        const validationErrors = validateTechStack(itemData);
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

        const response = await fetch("/api/tech-stacks", {
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
        showToast.success("Tech stack created successfully", "Success");

        return {
          success: true,
          data: newItem,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create item";
        console.error("Error creating tech stack:", err);
        showToast.error(errorMessage, "Error");

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
      itemData: UpdateTechStackDTO
    ): Promise<TechStackOperationResult> => {
      try {
        // Validate
        const validationErrors = validateTechStack(itemData);
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

        const response = await fetch("/api/tech-stacks", {
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

        showToast.success("Tech stack updated successfully", "Success");

        return {
          success: true,
          data: updatedItem,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update item";
        console.error("Error updating tech stack:", err);
        showToast.error(errorMessage, "Error");

        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    []
  );

  /**
   * Delete an item
   */
  const deleteItem = useCallback(
    async (id: string): Promise<TechStackOperationResult> => {
      try {
        const response = await fetch(`/api/tech-stacks?id=${id}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to delete item");
        }

        setItems((prev) => prev.filter((item) => item.id !== id));
        showToast.success("Tech stack deleted successfully", "Success");

        return {
          success: true,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete item";
        console.error("Error deleting tech stack:", err);
        showToast.error(errorMessage, "Error");

        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    []
  );

  /**
   * Toggle item active status
   */
  const toggleItemActive = useCallback(
    async (id: string): Promise<TechStackOperationResult> => {
      try {
        const item = items.find((item) => item.id === id);
        if (!item) {
          throw new Error("Item not found");
        }

        const response = await fetch("/api/tech-stacks", {
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

        setItems((prev) =>
          prev.map((item) => (item.id === id ? updatedItem : item))
        );

        showToast.success(
          `Tech stack ${updatedItem.isActive ? "activated" : "deactivated"} successfully`,
          "Success"
        );

        return {
          success: true,
          data: updatedItem,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to toggle item status";
        console.error("Error toggling item status:", err);
        showToast.error(errorMessage, "Error");

        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    [items]
  );

  return (
    <TechStackContext.Provider
      value={{
        items,
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
    </TechStackContext.Provider>
  );
}

export function useTechStack() {
  const context = useContext(TechStackContext);
  if (context === undefined) {
    throw new Error("useTechStack must be used within a TechStackProvider");
  }
  return context;
}
