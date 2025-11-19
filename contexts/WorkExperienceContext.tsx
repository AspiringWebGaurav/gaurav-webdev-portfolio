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
  WorkExperience,
  CreateWorkExperienceDTO,
  UpdateWorkExperienceDTO,
  WorkExperienceOperationResult,
  validateWorkExperience,
  MAX_WORK_EXPERIENCES,
} from "@/types/workExperience";
import { useRecycleBin } from "./RecycleBinContext";

interface WorkExperienceContextType {
  workExperiences: WorkExperience[];
  loading: boolean;
  error: string | null;
  fetchWorkExperiences: () => Promise<void>;
  createWorkExperience: (
    experience: CreateWorkExperienceDTO
  ) => Promise<WorkExperienceOperationResult>;
  updateWorkExperience: (
    experience: UpdateWorkExperienceDTO
  ) => Promise<WorkExperienceOperationResult>;
  deleteWorkExperience: (id: string) => Promise<WorkExperienceOperationResult>;
  toggleWorkExperienceActive: (
    id: string
  ) => Promise<WorkExperienceOperationResult>;
  reorderWorkExperiences: (
    experienceId: string,
    newOrder: number
  ) => Promise<WorkExperienceOperationResult>;
  canAddMoreWorkExperiences: () => boolean;
  getActiveWorkExperiencesCount: () => number;
}

const WorkExperienceContext = createContext<
  WorkExperienceContextType | undefined
>(undefined);

export function WorkExperienceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { moveToRecycleBin } = useRecycleBin();

  /**
   * Fetch all work experiences from the API
   */
  const fetchWorkExperiences = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/work-experience", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch work experiences");
      }

      const data = await response.json();

      // Convert date strings back to Date objects
      const experiencesWithDates = data.workExperiences.map((e: any) => ({
        ...e,
        createdAt: new Date(e.createdAt),
        updatedAt: new Date(e.updatedAt),
      }));

      setWorkExperiences(experiencesWithDates);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Error fetching work experiences:", err);
      showToast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new work experience
   */
  const createWorkExperience = useCallback(
    async (
      experience: CreateWorkExperienceDTO
    ): Promise<WorkExperienceOperationResult> => {
      // Check max work experiences limit
      if (workExperiences.length >= MAX_WORK_EXPERIENCES) {
        const result = {
          success: false,
          error: `Maximum ${MAX_WORK_EXPERIENCES} work experiences allowed. Please delete a work experience before adding a new one.`,
        };
        showToast.error(result.error);
        return result;
      }

      // Validate work experience data
      const validationErrors = validateWorkExperience(experience);
      if (validationErrors.length > 0) {
        const result = {
          success: false,
          error: "Validation failed",
          validationErrors,
        };
        showToast.error(validationErrors[0].message);
        return result;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/work-experience", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(experience),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Failed to create work experience"
          );
        }

        const data = await response.json();
        const newExperience = {
          ...data.workExperience,
          createdAt: new Date(data.workExperience.createdAt),
          updatedAt: new Date(data.workExperience.updatedAt),
        };

        setWorkExperiences((prev) =>
          [...prev, newExperience].sort((a, b) => a.order - b.order)
        );
        showToast.success("Work experience created successfully! 🎉", "Success");

        return { success: true, data: newExperience };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        setError(errorMessage);
        console.error("Error creating work experience:", err);
        showToast.error(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [workExperiences]
  );

  /**
   * Update an existing work experience
   */
  const updateWorkExperience = useCallback(
    async (
      experience: UpdateWorkExperienceDTO
    ): Promise<WorkExperienceOperationResult> => {
      // Validate work experience data
      const validationErrors = validateWorkExperience(experience);
      if (validationErrors.length > 0) {
        const result = {
          success: false,
          error: "Validation failed",
          validationErrors,
        };
        showToast.error(validationErrors[0].message);
        return result;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/work-experience", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(experience),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Failed to update work experience"
          );
        }

        const data = await response.json();
        const updatedExperience = {
          ...data.workExperience,
          createdAt: new Date(data.workExperience.createdAt),
          updatedAt: new Date(data.workExperience.updatedAt),
        };

        setWorkExperiences((prev) =>
          prev
            .map((e) => (e.id === updatedExperience.id ? updatedExperience : e))
            .sort((a, b) => a.order - b.order)
        );
        showToast.success("Work experience updated successfully! ✅", "Success");

        return { success: true, data: updatedExperience };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        setError(errorMessage);
        console.error("Error updating work experience:", err);
        showToast.error(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Delete a work experience (moves to recycle bin first)
   */
  const deleteWorkExperience = useCallback(
    async (id: string): Promise<WorkExperienceOperationResult> => {
      setLoading(true);
      setError(null);

      try {
        // Find the work experience to delete
        const experience = workExperiences.find((e) => e.id === id);
        if (!experience) {
          throw new Error("Work experience not found");
        }

        // Move to recycle bin first
        await moveToRecycleBin("workExperience", experience, id);

        // Then delete from Firestore
        const response = await fetch("/api/work-experience", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Failed to delete work experience"
          );
        }

        // Remove from local state
        setWorkExperiences((prev) => prev.filter((e) => e.id !== id));

        // Note: Success toast is shown by moveToRecycleBin
        return { success: true };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        setError(errorMessage);
        console.error("Error deleting work experience:", err);
        showToast.error(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [workExperiences, moveToRecycleBin]
  );

  /**
   * Toggle work experience active status
   */
  const toggleWorkExperienceActive = useCallback(
    async (id: string): Promise<WorkExperienceOperationResult> => {
      const experience = workExperiences.find((e) => e.id === id);
      if (!experience) {
        const result = { success: false, error: "Work experience not found" };
        showToast.error(result.error);
        return result;
      }

      return updateWorkExperience({
        id,
        isActive: !experience.isActive,
      });
    },
    [workExperiences, updateWorkExperience]
  );

  /**
   * Reorder work experiences
   */
  const reorderWorkExperiences = useCallback(
    async (
      experienceId: string,
      newOrder: number
    ): Promise<WorkExperienceOperationResult> => {
      if (newOrder < 1 || newOrder > MAX_WORK_EXPERIENCES) {
        const result = {
          success: false,
          error: `Order must be between 1 and ${MAX_WORK_EXPERIENCES}`,
        };
        showToast.error(result.error);
        return result;
      }

      return updateWorkExperience({
        id: experienceId,
        order: newOrder,
      });
    },
    [updateWorkExperience]
  );

  /**
   * Check if more work experiences can be added
   */
  const canAddMoreWorkExperiences = useCallback(() => {
    return workExperiences.length < MAX_WORK_EXPERIENCES;
  }, [workExperiences]);

  /**
   * Get count of active work experiences (shown on frontend)
   */
  const getActiveWorkExperiencesCount = useCallback(() => {
    return workExperiences.filter((e) => e.isActive).length;
  }, [workExperiences]);

  // Fetch work experiences on mount
  useEffect(() => {
    fetchWorkExperiences();
  }, [fetchWorkExperiences]);

  const value: WorkExperienceContextType = {
    workExperiences,
    loading,
    error,
    fetchWorkExperiences,
    createWorkExperience,
    updateWorkExperience,
    deleteWorkExperience,
    toggleWorkExperienceActive,
    reorderWorkExperiences,
    canAddMoreWorkExperiences,
    getActiveWorkExperiencesCount,
  };

  return (
    <WorkExperienceContext.Provider value={value}>
      {children}
    </WorkExperienceContext.Provider>
  );
}

/**
 * Custom hook to use the WorkExperienceContext
 */
export function useWorkExperiences() {
  const context = useContext(WorkExperienceContext);
  if (context === undefined) {
    throw new Error(
      "useWorkExperiences must be used within a WorkExperienceProvider"
    );
  }
  return context;
}
