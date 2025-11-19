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
  Testimonial,
  CreateTestimonialDTO,
  UpdateTestimonialDTO,
  TestimonialOperationResult,
  MAX_TESTIMONIALS,
} from "@/types/testimonial";

interface TestimonialContextType {
  testimonials: Testimonial[];
  loading: boolean;
  error: string | null;
  createTestimonial: (
    data: CreateTestimonialDTO
  ) => Promise<TestimonialOperationResult>;
  createTestimonialsBatch: (
    data: CreateTestimonialDTO[]
  ) => Promise<TestimonialOperationResult>;
  updateTestimonial: (
    data: UpdateTestimonialDTO
  ) => Promise<TestimonialOperationResult>;
  deleteTestimonial: (id: string) => Promise<TestimonialOperationResult>;
  toggleTestimonialActive: (id: string) => Promise<TestimonialOperationResult>;
  canAddMoreTestimonials: () => boolean;
  getActiveTestimonialsCount: () => number;
  refreshTestimonials: () => Promise<void>;
}

const TestimonialContext = createContext<TestimonialContextType | undefined>(
  undefined
);

export function TestimonialProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all testimonials
   */
  const fetchTestimonials = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/testimonials");
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch testimonials");
      }

      // Convert date strings back to Date objects
      const testimonials = data.testimonials.map((t: any) => ({
        ...t,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
      }));

      setTestimonials(testimonials);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch testimonials";
      setError(errorMessage);
      console.error("Error fetching testimonials:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new testimonial
   */
  const createTestimonial = async (
    data: CreateTestimonialDTO
  ): Promise<TestimonialOperationResult> => {
    try {
      const response = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        showToast.error(result.error || "Failed to create testimonial", "Create Failed");
        return {
          success: false,
          error: result.error,
          validationErrors: result.validationErrors,
        };
      }

      showToast.success("Testimonial created successfully!", "Success");
      await fetchTestimonials();

      return { success: true, data: result.testimonial };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create testimonial";
      showToast.error(errorMessage, "Error");
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Create multiple testimonials at once
   */
  const createTestimonialsBatch = async (
    data: CreateTestimonialDTO[]
  ): Promise<TestimonialOperationResult> => {
    try {
      const response = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        showToast.error(result.error || "Failed to create testimonials", "Batch Create Failed");
        return {
          success: false,
          error: result.error,
          validationErrors: result.validationErrors,
        };
      }

      showToast.success(
        result.message || `${data.length} testimonials created successfully!`,
        "Success"
      );
      await fetchTestimonials();

      return { success: true, data: result.testimonials };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to create testimonials";
      showToast.error(errorMessage, "Error");
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Update an existing testimonial
   */
  const updateTestimonial = async (
    data: UpdateTestimonialDTO
  ): Promise<TestimonialOperationResult> => {
    try {
      const response = await fetch("/api/testimonials", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        showToast.error(result.error || "Failed to update testimonial", "Update Failed");
        return {
          success: false,
          error: result.error,
          validationErrors: result.validationErrors,
        };
      }

      showToast.success("Testimonial updated successfully!", "Success");
      await fetchTestimonials();

      return { success: true, data: result.testimonial };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update testimonial";
      showToast.error(errorMessage, "Error");
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Delete a testimonial
   */
  const deleteTestimonial = async (
    id: string
  ): Promise<TestimonialOperationResult> => {
    try {
      const response = await fetch(`/api/testimonials?id=${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        showToast.error(result.error || "Failed to delete testimonial", "Delete Failed");
        return { success: false, error: result.error };
      }

      showToast.success("Testimonial deleted successfully!", "Success");
      await fetchTestimonials();

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete testimonial";
      showToast.error(errorMessage, "Error");
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Toggle testimonial active status
   */
  const toggleTestimonialActive = async (
    id: string
  ): Promise<TestimonialOperationResult> => {
    const testimonial = testimonials.find((t) => t.id === id);
    if (!testimonial) {
      return { success: false, error: "Testimonial not found" };
    }

    return updateTestimonial({
      id,
      isActive: !testimonial.isActive,
    });
  };

  /**
   * Check if more testimonials can be added
   */
  const canAddMoreTestimonials = () => {
    return testimonials.length < MAX_TESTIMONIALS;
  };

  /**
   * Get count of active testimonials
   */
  const getActiveTestimonialsCount = () => {
    return testimonials.filter((t) => t.isActive).length;
  };

  /**
   * Refresh testimonials manually
   */
  const refreshTestimonials = async () => {
    await fetchTestimonials();
  };

  // Fetch testimonials on mount
  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  const value: TestimonialContextType = {
    testimonials,
    loading,
    error,
    createTestimonial,
    createTestimonialsBatch,
    updateTestimonial,
    deleteTestimonial,
    toggleTestimonialActive,
    canAddMoreTestimonials,
    getActiveTestimonialsCount,
    refreshTestimonials,
  };

  return (
    <TestimonialContext.Provider value={value}>
      {children}
    </TestimonialContext.Provider>
  );
}

export function useTestimonials() {
  const context = useContext(TestimonialContext);
  if (context === undefined) {
    throw new Error(
      "useTestimonials must be used within a TestimonialProvider"
    );
  }
  return context;
}
