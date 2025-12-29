"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import { useCurrentlyWorking } from "@/contexts/CurrentlyWorkingContext";
import { showToast } from "@/lib/toast";
import {
  CreateCurrentlyWorkingDTO,
  MIN_TITLE_LENGTH,
  MAX_TITLE_LENGTH,
  MIN_DESCRIPTION_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_BLOG_CONTENT_LENGTH,
  MAX_ICON_LISTS,
  MAX_IMAGES,
} from "@/types/currentlyWorking";
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
  ExternalLink,
  Image as ImageIcon,
  Upload,
  FileText,
  Link as LinkIcon,
} from "lucide-react";
import IconPicker from "./IconPicker";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { syncImagesWithCloud, deleteMultipleImages } from "@/lib/imageSync";

export default function CurrentlyWorkingManager() {
    const {
    items,
    loading,
    fetchItems,
    createItem,
    updateItem,
    deleteItem,
    toggleItemActive,
  } = useCurrentlyWorking();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Confirmation modal states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteTargetTitle, setDeleteTargetTitle] = useState<string>("");
  
  const [formData, setFormData] = useState<CreateCurrentlyWorkingDTO>({
    headingTitle: "",
    title: "",
    description: "",
    blogContent: "",
    images: [],
    iconLists: [""],
    githubLink: "",
    liveLink: "",
    isActive: false,
    showBlogNotification: false,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [deletingImage, setDeletingImage] = useState<string | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [syncingImages, setSyncingImages] = useState(false);
  const [storageImages, setStorageImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const multiFileInputRef = useRef<HTMLInputElement>(null);

  // Fetch items on mount
  useEffect(() => {
    fetchItems(true);
  }, [fetchItems]);

  /**
   * Sync images from Firebase Storage
   */
  const syncWithCloud = async () => {
    setSyncingImages(true);
    try {
      const result = await syncImagesWithCloud({
        folder: "currently-working",
        existingImages: formData.images || [],
      });

      if (result.success) {
        setStorageImages(result.storageImages);
        
        // Auto-cleanup orphaned images if desired
        if (result.orphanedImages.length > 0) {
          console.log(`Found ${result.orphanedImages.length} orphaned images:`, result.orphanedImages);
          
          // Ask user if they want to clean up orphaned images
          const shouldCleanup = window.confirm(
            `Found ${result.orphanedImages.length} unused image(s) in cloud storage that are not linked to any item.\n\nDo you want to delete them?`
          );
          
          if (shouldCleanup) {
            showToast.info("Cleaning up orphaned images...", "Cleanup");
            const cleanupResult = await deleteMultipleImages(result.orphanedImages);
            
            if (cleanupResult.success) {
              showToast.success(
                `Deleted ${cleanupResult.deletedCount} orphaned image(s)`,
                "Cleanup Complete"
              );
              // Refresh the storage images list
              const refreshResult = await syncImagesWithCloud({
                folder: "currently-working",
                existingImages: formData.images || [],
              });
              if (refreshResult.success) {
                setStorageImages(refreshResult.storageImages);
              }
            } else {
              showToast.error(
                `Deleted ${cleanupResult.deletedCount} images, but ${cleanupResult.errors.length} failed`,
                "Cleanup Partial"
              );
            }
          }
        }
        
        showToast.success(
          `Found ${result.storageImages.length} images in cloud storage`,
          "Sync Complete"
        );
      } else {
        showToast.error(result.error || "Failed to sync with cloud", "Sync Failed");
      }
    } catch (error) {
      console.error("Error syncing with cloud:", error);
      showToast.error("Failed to sync images", "Sync Error");
    } finally {
      setSyncingImages(false);
    }
  };

  /**
   * Handle form field changes
   */
  const handleFieldChange = (
    field: keyof CreateCurrentlyWorkingDTO,
    value: any
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    setFormErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  /**
   * Delete image from Firebase Storage
   */
  const deleteImageFromCloud = async (imageUrl: string) => {
    try {
      const response = await fetch("/api/delete-image", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageUrl }),
      });

      const data = await response.json();

      if (!data.success) {
        console.warn("Failed to delete image from storage:", data.error);
      }
    } catch (error) {
      console.error("Error deleting image:", error);
    }
  };

  /**
   * Handle multiple images upload with progress
   */
  const handleMultipleImagesUpload = async (files: FileList) => {
    const currentImages = formData.images || [];
    const remainingSlots = 5 - currentImages.length;
    
    if (remainingSlots <= 0) {
      showToast.error("Maximum 5 images allowed", "Upload Limit");
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    if (filesToUpload.length === 0) {
      return;
    }

    setUploading(true);
    const newImages: string[] = [];

    try {
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        setUploadingIndex(i);
        setUploadProgress(0);

        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => Math.min(prev + 10, 90));
        }, 200);

        const formDataToSend = new FormData();
        formDataToSend.append("file", file);
        formDataToSend.append("folder", "currently-working");

        const response = await fetch("/api/upload-image", {
          method: "POST",
          body: formDataToSend,
        });

        clearInterval(progressInterval);
        setUploadProgress(100);

        const data = await response.json();

        if (data.success && data.url) {
          newImages.push(data.url);
          showToast.success(
            `Image ${i + 1} uploaded successfully!`,
            "Upload Success"
          );
        } else {
          showToast.error(
            `Failed to upload image ${i + 1}: ${data.error || "Unknown error"}`,
            "Upload Failed"
          );
        }

        // Small delay between uploads
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      if (newImages.length > 0) {
        handleFieldChange("images", [...currentImages, ...newImages]);
      }
    } catch (error) {
      console.error("Upload error:", error);
      showToast.error("Failed to upload images", "Upload Error");
    } finally {
      setUploading(false);
      setUploadingIndex(null);
      setUploadProgress(0);
      
      // Reset file input
      if (multiFileInputRef.current) {
        multiFileInputRef.current.value = "";
      }
    }
  };

  /**
   * Remove image from gallery and cloud storage
   */
  const removeImage = async (imageUrl: string) => {
    const currentImages = formData.images || [];
    
    // Optimistically remove from UI
    const newImages = currentImages.filter((img) => img !== imageUrl);
    handleFieldChange("images", newImages);

    // Delete from cloud storage if it's a Firebase URL
    if (imageUrl.includes("storage.googleapis.com")) {
      setDeletingImage(imageUrl);
      
      try {
        await deleteImageFromCloud(imageUrl);
        showToast.success("Image deleted from cloud storage", "Deleted");
      } catch (error) {
        console.error("Error deleting image:", error);
        showToast.error("Failed to delete image from storage", "Delete Failed");
        // Revert on error
        handleFieldChange("images", currentImages);
      } finally {
        setDeletingImage(null);
      }
    }
  };

  /**
   * Handle icon selection from icon picker
   */
  const handleIconSelect = (iconUrl: string) => {
    const currentIcons = formData.iconLists || [];
    const emptyIndex = currentIcons.findIndex((icon) => !icon || !icon.trim());

    if (emptyIndex !== -1) {
      const newIcons = [...currentIcons];
      newIcons[emptyIndex] = iconUrl;
      handleFieldChange("iconLists", newIcons);
    } else if (currentIcons.length < MAX_ICON_LISTS) {
      handleFieldChange("iconLists", [...currentIcons, iconUrl]);
    } else {
      showToast.error(
        `Maximum ${MAX_ICON_LISTS} icons allowed`,
        "Icon Limit"
      );
    }
  };

  /**
   * Handle icon removal
   */
  const handleIconRemove = (iconUrl: string) => {
    const currentIcons = formData.iconLists || [];
    const newIcons = currentIcons.filter((icon) => icon !== iconUrl);
    if (newIcons.length === 0) {
      newIcons.push("");
    }
    handleFieldChange("iconLists", newIcons);
  };

  /**
   * Get selected icon URLs
   */
  const getSelectedIconUrls = (): string[] => {
    return (formData.iconLists || []).filter((icon) => icon.trim());
  };

  /**
   * Start creating a new item
   */
  const startCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    setFormData({
      headingTitle: "",
      title: "",
      description: "",
      blogContent: "",
      images: [],
      iconLists: [""],
      githubLink: "",
      liveLink: "",
      isActive: false,
      showBlogNotification: false,
    });
    setFormErrors({});
  };

  /**
   * Start editing an item
   */
  const startEdit = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    setIsCreating(false);
    setEditingId(id);
    setFormData({
      headingTitle: item.headingTitle || "",
      title: item.title || "",
      description: item.description || "",
      blogContent: item.blogContent || "",
      images: Array.isArray(item.images) ? [...item.images] : [],
      iconLists: Array.isArray(item.iconLists)
        ? item.iconLists.length
          ? [...item.iconLists]
          : [""]
        : [""],
      githubLink: item.githubLink || "",
      liveLink: item.liveLink || "",
      isActive: item.isActive ?? false,
      showBlogNotification: item.showBlogNotification ?? false,
    });
    setFormErrors({});
    
    // Sync with cloud to get latest images
    try {
      const result = await syncImagesWithCloud({
        folder: "currently-working",
        existingImages: item.images || [],
      });
      
      if (result.success) {
        setStorageImages(result.storageImages);
      }
    } catch (error) {
      console.error("Error syncing images during edit:", error);
    }
  };

  /**
   * Cancel form
   */
  const cancelForm = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({
      headingTitle: "",
      title: "",
      description: "",
      blogContent: "",
      images: [],
      iconLists: [""],
      githubLink: "",
      liveLink: "",
      isActive: false,
      showBlogNotification: false,
    });
    setFormErrors({});
  };

  /**
   * Validate form
   */
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.headingTitle?.trim()) {
      errors.headingTitle = "Heading title is required";
    } else if (formData.headingTitle.length < 3) {
      errors.headingTitle = "Heading title must be at least 3 characters";
    } else if (formData.headingTitle.length > 50) {
      errors.headingTitle = "Heading title must not exceed 50 characters";
    }

    if (!formData.title?.trim()) {
      errors.title = "Title is required";
    } else if (formData.title.length < MIN_TITLE_LENGTH) {
      errors.title = `Title must be at least ${MIN_TITLE_LENGTH} characters`;
    } else if (formData.title.length > MAX_TITLE_LENGTH) {
      errors.title = `Title must not exceed ${MAX_TITLE_LENGTH} characters`;
    }

    if (!formData.description?.trim()) {
      errors.description = "Description is required";
    } else if (formData.description.length < MIN_DESCRIPTION_LENGTH) {
      errors.description = `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters`;
    } else if (formData.description.length > MAX_DESCRIPTION_LENGTH) {
      errors.description = `Description must not exceed ${MAX_DESCRIPTION_LENGTH} characters`;
    }

    if (
      formData.blogContent &&
      formData.blogContent.length > MAX_BLOG_CONTENT_LENGTH
    ) {
      errors.blogContent = `Blog content must not exceed ${MAX_BLOG_CONTENT_LENGTH} characters`;
    }

    const validIcons = (formData.iconLists || []).filter((icon) =>
      icon.trim()
    );
    if (validIcons.length === 0) {
      errors.iconLists = "At least one technology icon is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Submit form
   */
  const handleSubmit = async () => {
    if (!validateForm()) {
      showToast.error("Please fix the errors in the form", "Validation Error");
      return;
    }

    setSubmitting(true);

    try {
      // Filter out empty icons
      const cleanedData = {
        ...formData,
        iconLists: (formData.iconLists || []).filter((icon) => icon.trim()),
      };

      let result;
      if (editingId) {
        result = await updateItem({ id: editingId, ...cleanedData });
      } else {
        result = await createItem(cleanedData);
      }

      if (result.success) {
        cancelForm();
        fetchItems(true);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Handle delete
   */
  const handleDelete = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    setDeleteTargetId(id);
    setDeleteTargetTitle(item.title);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;

    // Close modal immediately
    const itemToDelete = deleteTargetId;
    setShowDeleteConfirm(false);
    setDeleteTargetId(null);
    setDeleteTargetTitle("");

    // Show progress notification
    showToast.info("Deleting item...", "Deleting", { autoClose: 2000 });

    await deleteItem(itemToDelete);
    await fetchItems(true);
  };

  /**
   * Handle toggle active
   */
  const handleToggleActive = async (id: string) => {
    await toggleItemActive(id);
    fetchItems(true);
  };

  // Loading state
  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Currently Working</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage what you&apos;re currently working on
          </p>
        </div>
        {!isCreating && !editingId && (
          <button
            onClick={startCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add New
          </button>
        )}
      </div>

      {/* Form */}
      {(isCreating || editingId) && (
        <div
          className="bg-white border border-gray-200 rounded-lg p-6 space-y-6"
          data-currently-working-form
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingId ? "Edit Item" : "Create New Item"}
            </h3>
            <button
              onClick={cancelForm}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Heading Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Heading Title *
            </label>
            <input
              type="text"
              value={formData.headingTitle}
              onChange={(e) => handleFieldChange("headingTitle", e.target.value)}
              className={`w-full px-4 py-2 bg-white text-gray-900 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 ${
                formErrors.headingTitle ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="e.g., Currently Working"
              maxLength={50}
            />
            {formErrors.headingTitle && (
              <p className="mt-1 text-sm text-red-600">{formErrors.headingTitle}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              This will appear in two places:<br />
              1. Grid card: &quot;Currently building {formData.headingTitle || '...'}&quot;<br />
              2. Section heading: &quot;Currently Working - {formData.headingTitle || '...'}&quot;
            </p>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleFieldChange("title", e.target.value)}
              className={`w-full px-4 py-2 bg-white text-gray-900 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 ${
                formErrors.title ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="e.g., Currently building a JS Animation library"
              maxLength={MAX_TITLE_LENGTH}
            />
            {formErrors.title && (
              <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.title.length}/{MAX_TITLE_LENGTH}
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleFieldChange("description", e.target.value)}
              rows={3}
              className={`w-full px-4 py-2 bg-white text-gray-900 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 resize-none ${
                formErrors.description ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Short description for the card"
              maxLength={MAX_DESCRIPTION_LENGTH}
            />
            {formErrors.description && (
              <p className="mt-1 text-sm text-red-600">
                {formErrors.description}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.description.length}/{MAX_DESCRIPTION_LENGTH}
            </p>
          </div>

          {/* Blog Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Blog Content (Optional)
            </label>
            <textarea
              value={formData.blogContent}
              onChange={(e) => handleFieldChange("blogContent", e.target.value)}
              rows={10}
              className={`w-full px-4 py-2 bg-white text-gray-900 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 resize-none font-mono text-sm ${
                formErrors.blogContent ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Detailed blog content about what you're working on..."
              maxLength={MAX_BLOG_CONTENT_LENGTH}
            />
            {formErrors.blogContent && (
              <p className="mt-1 text-sm text-red-600">
                {formErrors.blogContent}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.blogContent?.length || 0}/{MAX_BLOG_CONTENT_LENGTH}
            </p>
          </div>

          {/* Show Blog Notification */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="showBlogNotification"
              checked={formData.showBlogNotification}
              onChange={(e) =>
                handleFieldChange("showBlogNotification", e.target.checked)
              }
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label
              htmlFor="showBlogNotification"
              className="text-sm font-medium text-gray-700"
            >
              Show &quot;Read Blog&quot; notification badge on card
            </label>
          </div>

          {/* Images Gallery */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Images (Max 5)
              </label>
              <button
                type="button"
                onClick={syncWithCloud}
                disabled={syncingImages}
                className="flex items-center gap-2 px-3 py-1 text-sm border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                {syncingImages ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Syncing...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Sync with Cloud</span>
                  </>
                )}
              </button>
            </div>
            
            {/* Available images from storage */}
            {storageImages.length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-blue-900">
                    Available in Cloud Storage ({storageImages.length})
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                  {storageImages.map((img, idx) => {
                    const isUsed = formData.images?.includes(img);
                    return (
                      <div key={idx} className="relative group">
                        <div
                          className={`relative w-full h-20 rounded border-2 overflow-hidden cursor-pointer transition-all ${
                            isUsed
                              ? "border-green-500 opacity-50"
                              : "border-gray-300 hover:border-blue-500"
                          }`}
                          onClick={() => {
                            if (!isUsed && (formData.images?.length || 0) < 5) {
                              handleFieldChange("images", [...(formData.images || []), img]);
                              showToast.success("Image added from cloud", "Added");
                            }
                          }}
                        >
                          <Image
                            src={img}
                            alt={`Storage ${idx + 1}`}
                            fill
                            className="object-cover"
                          />
                          {isUsed && (
                            <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                              <span className="text-white text-xs bg-green-600 px-2 py-1 rounded">✓ Used</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-blue-700 mt-2">
                  Click on an image to add it to your gallery
                </p>
              </div>
            )}
            
            <div className="space-y-4">
              {/* Image Grid */}
              {formData.images && formData.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {formData.images.map((img, index) => (
                    <div key={index} className="relative group">
                      <div className="relative w-full h-32 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-all">
                        <Image
                          src={img}
                          alt={`Image ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                        {/* Image number badge */}
                        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          {index + 1}
                        </div>
                      </div>
                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => removeImage(img)}
                        disabled={deletingImage === img}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
                        title="Delete image"
                      >
                        {deletingImage === img ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Progress */}
              {uploading && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                      Uploading image {uploadingIndex !== null ? uploadingIndex + 1 : ""}...
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-2 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-blue-700 mt-1">{uploadProgress}%</p>
                </div>
              )}

              {/* Upload Button */}
              {(!formData.images || formData.images.length < 5) && (
                <div>
                  <input
                    ref={multiFileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleMultipleImagesUpload(e.target.files);
                      }
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => multiFileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>
                          Upload Images ({formData.images?.length || 0}/5)
                        </span>
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    Click to upload up to {5 - (formData.images?.length || 0)} more image(s). Supported formats: JPG, PNG, GIF
                  </p>
                </div>
              )}

              {formData.images && formData.images.length >= 5 && (
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  ✓ Maximum images reached (5/5)
                </p>
              )}
            </div>
          </div>

          {/* Technology Icons */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Technology Icons * (Max {MAX_ICON_LISTS})
            </label>
            
            {/* Selected Icons */}
            {getSelectedIconUrls().length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {getSelectedIconUrls().map((icon, index) => (
                  <div key={index} className="relative group">
                    <div className="w-12 h-12 rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                      <Image
                        src={icon}
                        alt={`Icon ${index + 1}`}
                        width={48}
                        height={48}
                        className="w-full h-full object-contain p-2"
                      />
                    </div>
                    <button
                      onClick={() => handleIconRemove(icon)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowIconPicker(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Technology Icon
            </button>
            {formErrors.iconLists && (
              <p className="mt-1 text-sm text-red-600">
                {formErrors.iconLists}
              </p>
            )}
          </div>

          {/* Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GitHub Link (Optional)
              </label>
              <input
                type="url"
                value={formData.githubLink}
                onChange={(e) => handleFieldChange("githubLink", e.target.value)}
                className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                placeholder="https://github.com/..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Live Link (Optional)
              </label>
              <input
                type="url"
                value={formData.liveLink}
                onChange={(e) => handleFieldChange("liveLink", e.target.value)}
                className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => handleFieldChange("isActive", e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label
              htmlFor="isActive"
              className="text-sm font-medium text-gray-700"
            >
              Show on frontend
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {editingId ? "Update" : "Create"}
            </button>
            <button
              onClick={cancelForm}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Items List */}
      <div className="space-y-4">
        {items.length === 0 && !isCreating && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No items yet. Create one to get started!</p>
          </div>
        )}

        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-gray-200 rounded-lg p-6 space-y-4"
          >
            <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {item.headingTitle || "Currently Working"}
                </h3>
                {item.isActive && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                    Active
                  </span>
                )}
                {item.showBlogNotification && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                    📖 Blog
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mb-1">{item.title}</p>
              <p className="text-gray-600 text-sm mb-3">{item.description}</p>                {/* Images preview */}
                {Array.isArray(item.images) && item.images.length > 0 && (
                  <div className="flex gap-2 mb-3">
                    {item.images.slice(0, 4).map((img, idx) => (
                      <div
                        key={idx}
                        className="w-16 h-16 rounded border border-gray-200 overflow-hidden"
                      >
                        <Image
                          src={img}
                          alt={`Preview ${idx + 1}`}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                    {Array.isArray(item.images) && item.images.length > 4 && (
                      <div className="w-16 h-16 rounded border border-gray-200 bg-gray-100 flex items-center justify-center text-gray-600 text-sm">
                        +{item.images.length - 4}
                      </div>
                    )}
                  </div>
                )}

                {/* Tech Icons */}
                <div className="flex gap-2">
                  {Array.isArray(item.iconLists) && item.iconLists.filter(icon => {
                    // Only show valid URLs (http/https)
                    try {
                      return icon.startsWith('http://') || icon.startsWith('https://');
                    } catch {
                      return false;
                    }
                  }).slice(0, 6).map((icon, idx) => (
                    <div
                      key={idx}
                      className="w-8 h-8 rounded border border-gray-200 overflow-hidden bg-gray-50"
                    >
                      <Image
                        src={icon}
                        alt={`Tech ${idx + 1}`}
                        width={32}
                        height={32}
                        className="w-full h-full object-contain p-1"
                      />
                    </div>
                  ))}
                  {Array.isArray(item.iconLists) && item.iconLists.length > 6 && (
                    <div className="w-8 h-8 rounded border border-gray-200 bg-gray-100 flex items-center justify-center text-gray-600 text-xs">
                      +{item.iconLists.length - 6}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleActive(item.id)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title={item.isActive ? "Deactivate" : "Activate"}
                >
                  {item.isActive ? (
                    <Eye className="w-5 h-5" />
                  ) : (
                    <EyeOff className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={() => startEdit(item.id)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Links */}
            <div className="flex gap-3 pt-3 border-t border-gray-100">
              {item.githubLink && (
                <a
                  href={item.githubLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  GitHub
                </a>
              )}
              {item.liveLink && (
                <a
                  href={item.liveLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  Live Link
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Icon Picker Modal */}
      {showIconPicker && (
        <IconPicker
          onSelect={handleIconSelect}
          onRemove={handleIconRemove}
          onClose={() => setShowIconPicker(false)}
          selectedIcons={getSelectedIconUrls()}
          maxIcons={MAX_ICON_LISTS}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteTargetId(null);
          setDeleteTargetTitle("");
        }}
        onConfirm={confirmDelete}
        title="Delete Item"
        message={`Are you sure you want to delete "${deleteTargetTitle}"?`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
