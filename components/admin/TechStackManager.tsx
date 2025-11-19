"use client";

import React, { useState, useEffect } from "react";
import { useTechStack } from "@/contexts/TechStackContext";
import {
  CreateTechStackDTO,
  MIN_NAME_LENGTH,
  MAX_NAME_LENGTH,
  MAX_TECH_STACKS,
} from "@/types/techStack";
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  AlertCircle,
  Loader2,
  GripVertical,
} from "lucide-react";
import { showToast } from "@/lib/toast";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

export default function TechStackManager() {
  const {
    items,
    loading,
    fetchItems,
    createItem,
    updateItem,
    deleteItem,
    toggleItemActive,
  } = useTechStack();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Confirmation modal states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteTargetName, setDeleteTargetName] = useState<string>("");
  
  const [formData, setFormData] = useState<CreateTechStackDTO>({
    name: "",
    order: 0,
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Fetch items on mount
  useEffect(() => {
    fetchItems(true);
  }, [fetchItems]);

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Name validation
    if (!formData.name.trim()) {
      errors.name = "Name is required";
    } else if (formData.name.trim().length < MIN_NAME_LENGTH) {
      errors.name = `Name must be at least ${MIN_NAME_LENGTH} characters`;
    } else if (formData.name.trim().length > MAX_NAME_LENGTH) {
      errors.name = `Name must not exceed ${MAX_NAME_LENGTH} characters`;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Reset form
   */
  const resetForm = () => {
    setFormData({
      name: "",
      order: 0,
      isActive: true,
    });
    setFormErrors({});
    setIsCreating(false);
    setEditingId(null);
  };

  /**
   * Handle create
   */
  const handleCreate = async () => {
    if (!validateForm()) {
      showToast.error("Please fix validation errors");
      return;
    }

    // Check max limit
    if (items.length >= MAX_TECH_STACKS) {
      showToast.error(`Maximum of ${MAX_TECH_STACKS} tech stacks allowed`);
      return;
    }

    setSubmitting(true);

    try {
      const result = await createItem({
        ...formData,
        name: formData.name.trim(),
        order: items.length, // Auto-assign to end
      });

      if (result.success) {
        resetForm();
      }
    } catch (error) {
      console.error("Error creating tech stack:", error);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Start editing
   */
  const startEdit = (id: string) => {
    const item = items.find((item) => item.id === id);
    if (!item) return;

    setEditingId(id);
    setFormData({
      name: item.name,
      order: item.order,
      isActive: item.isActive,
    });
    setIsCreating(false);
  };

  /**
   * Handle update
   */
  const handleUpdate = async () => {
    if (!validateForm() || !editingId) {
      showToast.error("Please fix validation errors");
      return;
    }

    setSubmitting(true);

    try {
      const result = await updateItem({
        id: editingId,
        ...formData,
        name: formData.name.trim(),
      });

      if (result.success) {
        resetForm();
      }
    } catch (error) {
      console.error("Error updating tech stack:", error);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Handle delete
   */
  const handleDelete = async (id: string) => {
    const item = items.find((item) => item.id === id);
    if (!item) return;

    setDeleteTargetId(id);
    setDeleteTargetName(item.name);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;

    // Close modal immediately
    const itemToDelete = deleteTargetId;
    setShowDeleteConfirm(false);
    setDeleteTargetId(null);
    setDeleteTargetName("");

    // Show progress notification
    showToast.info("Deleting tech stack...", undefined, { autoClose: 2000 });

    await deleteItem(itemToDelete);
  };

  /**
   * Handle toggle active
   */
  const handleToggleActive = async (id: string) => {
    await toggleItemActive(id);
  };

  /**
   * Handle reorder (up/down)
   */
  const handleReorder = async (id: string, direction: "up" | "down") => {
    const currentIndex = items.findIndex((item) => item.id === id);
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= items.length) return;

    // Swap orders
    const currentItem = items[currentIndex];
    const swapItem = items[newIndex];

    try {
      // Update both items
      await updateItem({
        id: currentItem.id,
        order: swapItem.order,
      });

      await updateItem({
        id: swapItem.id,
        order: currentItem.order,
      });

      // Refresh to get sorted list
      await fetchItems(true);
    } catch (error) {
      console.error("Error reordering:", error);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            My Tech Stacks
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage technology stack items displayed in the Grid section (max{" "}
            {MAX_TECH_STACKS})
          </p>
        </div>
        <button
          onClick={() => {
            if (items.length >= MAX_TECH_STACKS) {
              showToast.error(`Maximum of ${MAX_TECH_STACKS} tech stacks allowed`);
              return;
            }
            setIsCreating(true);
            setEditingId(null);
            setFormData({
              name: "",
              order: 0,
              isActive: true,
            });
          }}
          disabled={loading || items.length >= MAX_TECH_STACKS}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Tech Stack
        </button>
      </div>

      {/* Form */}
      {(isCreating || editingId) && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingId ? "Edit Tech Stack" : "Create Tech Stack"}
            </h3>
            <button
              onClick={resetForm}
              disabled={submitting}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., TypeScript, React, Node.js"
                maxLength={MAX_NAME_LENGTH}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent bg-white text-gray-900"
              />
              {formErrors.name && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {formErrors.name}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {formData.name.length}/{MAX_NAME_LENGTH}
              </p>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    isActive: e.target.checked,
                  }))
                }
                className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
              />
              <label htmlFor="isActive" className="text-sm text-gray-900">
                Active (show on frontend)
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={editingId ? handleUpdate : handleCreate}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {editingId ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {editingId ? "Update" : "Create"}
                  </>
                )}
              </button>
              <button
                onClick={resetForm}
                disabled={submitting}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Items List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {loading && items.length === 0 ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">Loading...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">
              No tech stacks yet. Create one to get started!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Drag Handle & Order */}
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-5 h-5 text-gray-400" />
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleReorder(item.id, "up")}
                        disabled={index === 0}
                        className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => handleReorder(item.id, "down")}
                        disabled={index === items.length - 1}
                        className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        ▼
                      </button>
                    </div>
                  </div>

                  {/* Name */}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      Order: {item.order} • Created:{" "}
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Active Badge */}
                  <div>
                    {item.isActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        <Eye className="w-3 h-3" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        <EyeOff className="w-3 h-3" />
                        Inactive
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(item.id)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title={item.isActive ? "Deactivate" : "Activate"}
                    >
                      {item.isActive ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => startEdit(item.id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium">Tips:</p>
            <ul className="mt-1 space-y-1 list-disc list-inside">
              <li>Active tech stacks will appear in the Grid section</li>
              <li>Use the ▲▼ buttons to reorder items</li>
              <li>Maximum {MAX_TECH_STACKS} tech stacks allowed</li>
              <li>Keep names concise (e.g., "React", "TypeScript")</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteTargetId(null);
          setDeleteTargetName("");
        }}
        onConfirm={confirmDelete}
        title="Delete Tech Stack"
        message={`Are you sure you want to delete "${deleteTargetName}"?`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
