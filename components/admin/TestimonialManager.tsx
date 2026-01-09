"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { useTestimonials } from "@/contexts/TestimonialContext";
import {
  CreateTestimonialDTO,
  MAX_TESTIMONIALS,
  MIN_QUOTE_LENGTH,
  MAX_QUOTE_LENGTH,
  MIN_NAME_LENGTH,
  MAX_NAME_LENGTH,
  MIN_TITLE_LENGTH,
  MAX_TITLE_LENGTH,
} from "@/types/testimonial";
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
  Upload,
  Library,
  UserCircle,
  Building2,
  MessageSquareQuote,
  Briefcase,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { showToast } from "@/lib/toast";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

export default function TestimonialManager() {
  const {
    testimonials,
    loading,
    createTestimonial,
    createTestimonialsBatch,
    updateTestimonial,
    deleteTestimonial,
    toggleTestimonialActive,
    canAddMoreTestimonials,
    getActiveTestimonialsCount,
  } = useTestimonials();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Confirmation modal states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteTargetName, setDeleteTargetName] = useState<string>("");
  
  const [formData, setFormData] = useState<CreateTestimonialDTO>({
    quote: "",
    name: "",
    title: "",
    img: "",
    order: testimonials.length + 1,
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Image upload state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [deleteProgress, setDeleteProgress] = useState<number>(0);
  const [deletingImage, setDeletingImage] = useState(false);

  // Batch creation state
  const [showBatchCreate, setShowBatchCreate] = useState(false);
  const [batchCount, setBatchCount] = useState(3);

  // Sort testimonials by order
  const sortedTestimonials = useMemo(() => {
    return [...testimonials].sort((a, b) => a.order - b.order);
  }, [testimonials]);

  /**
   * Handle form field changes
   */
  const handleFieldChange = (field: keyof CreateTestimonialDTO, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  /**
   * Handle user avatar/DP image upload
   */
  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showToast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast.error("Image size must be less than 5MB");
      return;
    }

    try {
      setUploadingImage(true);
      setUploadProgress(0);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Create FormData
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      uploadFormData.append("folder", "testimonials/avatars");

      // Upload to API
      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: uploadFormData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();

      // Delete old image from cloud if it was a Storage URL (not the FormData variable!)
      const currentFormData = formData; // Reference to state
      if (
        currentFormData.img &&
        currentFormData.img.includes("storage.googleapis.com")
      ) {
        await deleteImageFromCloud(currentFormData.img);
      }

      // Update form with uploaded image URL
      handleFieldChange("img", data.url);
      setImagePreview(data.url);
      showToast.success("Profile picture uploaded successfully!");

      setTimeout(() => setUploadProgress(0), 1000);
    } catch (error) {
      console.error("Image upload error:", error);
      showToast.error("Failed to upload image. Please try again.");
      setUploadProgress(0);
    } finally {
      setUploadingImage(false);
    }
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
        body: JSON.stringify({ url: imageUrl }),
      });

      const data = await response.json();

      if (data.success) {
        console.log(
          "✅ Image deleted from cloud:",
          data.deletedPath || imageUrl
        );
      }
    } catch (error) {
      console.error("Failed to delete image from cloud:", error);
      // Don't show error to user as this is cleanup
    }
  };

  /**
   * Remove uploaded image
   */
  const removeImage = async () => {
    setDeletingImage(true);
    setDeleteProgress(0);

    // Progress animation
    const progressInterval = setInterval(() => {
      setDeleteProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 15;
      });
    }, 100);

    // Delete from cloud if it's a Storage URL
    if (formData.img && formData.img.includes("storage.googleapis.com")) {
      await deleteImageFromCloud(formData.img);
    }

    clearInterval(progressInterval);
    setDeleteProgress(100);

    handleFieldChange("img", "");
    setImagePreview("");
    showToast.success("Profile picture removed");

    setTimeout(() => {
      setDeleteProgress(0);
      setDeletingImage(false);
    }, 500);
  };

  /**
   * Start creating a new testimonial
   */
  const startCreate = () => {
    if (!canAddMoreTestimonials()) {
      showToast.error(
        `Maximum ${MAX_TESTIMONIALS} testimonials allowed. Delete a testimonial first.`
      );
      return;
    }

    setIsCreating(true);
    setEditingId(null);
    setFormData({
      quote: "",
      name: "",
      title: "",
      img: "",
      order: testimonials.length + 1,
      isActive: true,
    });
    setFormErrors({});
    setImagePreview("");
  };

  /**
   * Start batch creation
   */
  const startBatchCreate = () => {
    if (!canAddMoreTestimonials()) {
      showToast.error(`Maximum ${MAX_TESTIMONIALS} testimonials allowed.`);
      return;
    }

    const maxCanAdd = MAX_TESTIMONIALS - testimonials.length;
    setBatchCount(Math.min(3, maxCanAdd));
    setShowBatchCreate(true);
  };

  /**
   * Handle batch creation
   */
  const handleBatchCreate = async () => {
    const batch: CreateTestimonialDTO[] = [];

    for (let i = 0; i < batchCount; i++) {
      batch.push({
        quote: `Sample testimonial quote ${
          i + 1
        }. This is a placeholder text that showcases client feedback. Replace this with actual testimonial content.`,
        name: `Client ${i + 1}`,
        title: `Position at Company ${i + 1}`,
        img: "",
        order: testimonials.length + i + 1,
        isActive: true,
      });
    }

    setSubmitting(true);
    try {
      const result = await createTestimonialsBatch(batch);
      if (result.success) {
        setShowBatchCreate(false);
        setBatchCount(3);
      }
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Start editing a testimonial
   */
  const startEdit = (id: string) => {
    const testimonial = testimonials.find((t) => t.id === id);
    if (!testimonial) return;

    setIsCreating(false);
    setEditingId(id);
    setFormData({
      quote: testimonial.quote || "",
      name: testimonial.name || "",
      title: testimonial.title || "",
      img: testimonial.img || "",
      order: testimonial.order ?? testimonials.length + 1,
      isActive: testimonial.isActive ?? true,
    });
    setFormErrors({});
    setImagePreview(testimonial.img || "");

    // Scroll form into view
    setTimeout(() => {
      const formEl = document.querySelector(
        "[data-testimonial-form]"
      ) as HTMLElement | null;
      formEl?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  /**
   * Cancel editing
   */
  const cancelEdit = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({
      quote: "",
      name: "",
      title: "",
      img: "",
      order: testimonials.length + 1,
      isActive: true,
    });
    setFormErrors({});
    setImagePreview("");
  };

  /**
   * Validate and save testimonial
   */
  const saveTestimonial = async () => {
    // Client-side validation
    const errors: Record<string, string> = {};

    if (!formData.quote.trim()) errors.quote = "Quote is required";
    else if (formData.quote.length < MIN_QUOTE_LENGTH)
      errors.quote = `Quote must be at least ${MIN_QUOTE_LENGTH} characters`;
    else if (formData.quote.length > MAX_QUOTE_LENGTH)
      errors.quote = `Quote must not exceed ${MAX_QUOTE_LENGTH} characters`;

    if (!formData.name.trim()) errors.name = "Name is required";
    else if (formData.name.length < MIN_NAME_LENGTH)
      errors.name = `Name must be at least ${MIN_NAME_LENGTH} characters`;
    else if (formData.name.length > MAX_NAME_LENGTH)
      errors.name = `Name must not exceed ${MAX_NAME_LENGTH} characters`;

    if (!formData.title.trim()) errors.title = "Title is required";
    else if (formData.title.length < MIN_TITLE_LENGTH)
      errors.title = `Title must be at least ${MIN_TITLE_LENGTH} characters`;
    else if (formData.title.length > MAX_TITLE_LENGTH)
      errors.title = `Title must not exceed ${MAX_TITLE_LENGTH} characters`;

    // Company logo is no longer required (removed)

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showToast.error("Please fix validation errors");
      return;
    }

    setSubmitting(true);

    try {
      if (isCreating) {
        const result = await createTestimonial(formData);
        if (result.success) {
          cancelEdit();
        }
      } else if (editingId) {
        const result = await updateTestimonial({
          id: editingId,
          ...formData,
        });
        if (result.success) {
          cancelEdit();
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Delete a testimonial with confirmation
   */
  const handleDelete = async (id: string) => {
    const testimonial = testimonials.find((t) => t.id === id);
    if (!testimonial) return;

    setDeleteTargetId(id);
    setDeleteTargetName(testimonial.name);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    
    const testimonial = testimonials.find((t) => t.id === deleteTargetId);
    if (!testimonial) return;

    // Close modal immediately
    setShowDeleteConfirm(false);
    setDeleteTargetId(null);
    setDeleteTargetName("");

    // Show progress notification
    showToast.info("Deleting testimonial...", "Deleting", { autoClose: 2000 });

    // Delete images from cloud before deleting testimonial
    const imagesToDelete = [];
    if (testimonial.img && testimonial.img.includes("storage.googleapis.com")) {
      imagesToDelete.push(testimonial.img);
    }
    // Company logo deletion removed (deprecated feature)

    // Delete images in parallel
    if (imagesToDelete.length > 0) {
      await Promise.all(imagesToDelete.map((url) => deleteImageFromCloud(url)));
      showToast.success(`Deleted ${imagesToDelete.length} image(s) from cloud`);
    }

    await deleteTestimonial(testimonial.id);
  };

  /**
   * Toggle testimonial visibility
   */
  const handleToggleActive = async (id: string) => {
    await toggleTestimonialActive(id);
  };

  /**
   * Reorder testimonials
   */
  const moveTestimonial = async (id: string, direction: "up" | "down") => {
    const currentIndex = sortedTestimonials.findIndex((t) => t.id === id);
    if (currentIndex === -1) return;

    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sortedTestimonials.length) return;

    const current = sortedTestimonials[currentIndex];
    const target = sortedTestimonials[targetIndex];

    // Swap orders
    await Promise.all([
      updateTestimonial({ id: current.id, order: target.order }),
      updateTestimonial({ id: target.id, order: current.order }),
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Client Testimonials
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {testimonials.length} / {MAX_TESTIMONIALS} testimonials •{" "}
            {getActiveTestimonialsCount()} active (visible on frontend)
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={startBatchCreate}
            disabled={
              !canAddMoreTestimonials() ||
              isCreating ||
              editingId !== null ||
              loading
            }
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Upload className="w-4 h-4" />
            Batch Create
          </button>

          <button
            onClick={startCreate}
            disabled={
              !canAddMoreTestimonials() ||
              isCreating ||
              editingId !== null ||
              loading
            }
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Testimonial
          </button>
        </div>
      </div>

      {/* Batch Create Modal */}
      {showBatchCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Batch Create Testimonials
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Quickly create multiple testimonial templates that you can edit
              later. This saves time when adding multiple testimonials.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of testimonials to create
              </label>
              <input
                type="number"
                min={1}
                max={MAX_TESTIMONIALS - testimonials.length}
                value={batchCount}
                onChange={(e) => setBatchCount(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-label="Number of testimonials to create"
              />
              <p className="text-xs text-gray-500 mt-1">
                Max: {MAX_TESTIMONIALS - testimonials.length} testimonials
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleBatchCreate}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                    Creating...
                  </>
                ) : (
                  `Create ${batchCount} Testimonial${batchCount > 1 ? "s" : ""}`
                )}
              </button>
              <button
                onClick={() => setShowBatchCreate(false)}
                disabled={submitting}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <div
          data-testimonial-form
          className="bg-white border-2 border-blue-500 rounded-lg p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              {isCreating ? "Create New Testimonial" : "Edit Testimonial"}
            </h3>
            <button
              onClick={cancelEdit}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close form"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quote */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <MessageSquareQuote className="w-4 h-4" />
                Testimonial Quote *
              </label>
              <textarea
                value={formData.quote}
                onChange={(e) => handleFieldChange("quote", e.target.value)}
                placeholder="Write the client's testimonial here..."
                rows={4}
                className={`w-full px-3 py-2 bg-white text-gray-900 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none ${
                  formErrors.quote
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300"
                }`}
              />
              <div className="flex justify-between items-center mt-1">
                {formErrors.quote ? (
                  <p className="text-xs text-red-600">{formErrors.quote}</p>
                ) : (
                  <p className="text-xs text-gray-500">
                    {formData.quote.length}/{MAX_QUOTE_LENGTH} characters
                  </p>
                )}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <UserCircle className="w-4 h-4" />
                Client Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleFieldChange("name", e.target.value)}
                placeholder="John Doe"
                className={`w-full px-3 py-2 bg-white text-gray-900 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                  formErrors.name
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300"
                }`}
              />
              {formErrors.name && (
                <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <Briefcase className="w-4 h-4" />
                Job Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleFieldChange("title", e.target.value)}
                placeholder="CEO at Company Name"
                className={`w-full px-3 py-2 bg-white text-gray-900 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                  formErrors.title
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300"
                }`}
              />
              {formErrors.title && (
                <p className="text-xs text-red-600 mt-1">{formErrors.title}</p>
              )}
            </div>

            {/* Person Image/Avatar Upload */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <UserCircle className="w-4 h-4" />
                Profile Picture (Optional)
              </label>

              {/* Image Preview or Upload Button */}
              {imagePreview || formData.img ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-purple-500 bg-gray-100 flex-shrink-0">
                      <Image
                        src={imagePreview || formData.img}
                        alt="Profile preview"
                        fill
                        className="object-cover"
                        unoptimized
                        onError={(e) => {
                          e.currentTarget.src = "/profile.svg";
                        }}
                      />
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                      <label
                        className={`px-3 py-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 text-sm relative overflow-hidden ${
                          uploadingImage
                            ? "bg-blue-400 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                      >
                        {uploadingImage && uploadProgress > 0 && (
                          <div
                            className="absolute left-0 top-0 h-full bg-blue-700 transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        )}
                        <Upload className="w-4 h-4 relative z-10" />
                        <span className="relative z-10">
                          {uploadingImage
                            ? `Uploading... ${uploadProgress}%`
                            : "Change Image"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={removeImage}
                        disabled={uploadingImage || deletingImage}
                        className={`px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm relative overflow-hidden ${
                          deletingImage
                            ? "bg-red-400 cursor-not-allowed"
                            : "bg-red-600 hover:bg-red-700 text-white"
                        }`}
                      >
                        {deletingImage && deleteProgress > 0 && (
                          <div
                            className="absolute left-0 top-0 h-full bg-red-700 transition-all duration-200"
                            style={{ width: `${deleteProgress}%` }}
                          />
                        )}
                        <Trash2 className="w-4 h-4 relative z-10" />
                        <span className="relative z-10">
                          {deletingImage
                            ? `Deleting... ${deleteProgress}%`
                            : "Remove"}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* URL Input for Manual Entry */}
                  <input
                    type="text"
                    value={formData.img || ""}
                    onChange={(e) => {
                      handleFieldChange("img", e.target.value);
                      setImagePreview(e.target.value);
                    }}
                    placeholder="Or paste image URL"
                    className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Upload Button */}
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all relative overflow-hidden">
                    {uploadingImage && uploadProgress > 0 && (
                      <div
                        className="absolute left-0 bottom-0 h-1 bg-blue-600 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    )}
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {uploadingImage ? (
                        <>
                          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
                          <p className="text-sm text-gray-600">
                            Uploading... {uploadProgress}%
                          </p>
                          <div className="w-48 h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                            <div
                              className="h-full bg-blue-600 transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600 mb-1">
                            Click to upload profile picture
                          </p>
                          <p className="text-xs text-gray-500">
                            PNG, JPG up to 5MB
                          </p>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>

                  {/* Divider */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-gray-300"></div>
                    <span className="text-xs text-gray-500">OR</span>
                    <div className="flex-1 h-px bg-gray-300"></div>
                  </div>

                  {/* URL Input */}
                  <input
                    type="text"
                    value={formData.img || ""}
                    onChange={(e) => {
                      handleFieldChange("img", e.target.value);
                      setImagePreview(e.target.value);
                    }}
                    placeholder="Paste image URL here"
                    className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              )}

              <p className="text-xs text-gray-500 mt-2">
                Circular avatar will be shown on the frontend. Leave empty for
                default avatar.
              </p>
            </div>

            {/* Order and Active Status */}
            <div className="md:col-span-2 flex gap-4">
              <div className="flex-1">
                <label
                  htmlFor="testimonial-order"
                  className="text-sm font-medium text-gray-700 mb-1 block"
                >
                  Display Order
                </label>
                <input
                  id="testimonial-order"
                  type="number"
                  min="1"
                  max={MAX_TESTIMONIALS}
                  value={formData.order}
                  onChange={(e) =>
                    handleFieldChange("order", parseInt(e.target.value) || 1)
                  }
                  className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  aria-label="Display order"
                />
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      handleFieldChange("isActive", e.target.checked)
                    }
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    aria-label="Active status"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Active (Show on frontend)
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={saveTestimonial}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isCreating ? "Create Testimonial" : "Update Testimonial"}
                </>
              )}
            </button>
            <button
              onClick={cancelEdit}
              disabled={submitting}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Testimonials List */}
      {loading && testimonials.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : testimonials.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <MessageSquareQuote className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Testimonials Yet
          </h3>
          <p className="text-gray-600 mb-4">
            Get started by creating your first testimonial or use batch create
            for multiple at once.
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={startBatchCreate}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Batch Create
            </button>
            <button
              onClick={startCreate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Testimonial
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedTestimonials.map((testimonial, index) => (
            <div
              key={testimonial.id}
              className={`bg-white rounded-lg border-2 p-6 transition-all ${
                testimonial.isActive
                  ? "border-green-200 hover:border-green-400"
                  : "border-gray-200 hover:border-gray-400 opacity-60"
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {testimonial.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {testimonial.title}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      {testimonial.isActive ? (
                        <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">
                          Inactive
                        </span>
                      )}
                      <span className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
                        Order: {testimonial.order}
                      </span>
                    </div>
                  </div>

                  {/* Quote */}
                  <blockquote className="text-gray-700 italic border-l-4 border-blue-500 pl-4 mb-4">
                    "{testimonial.quote}"
                  </blockquote>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => startEdit(testimonial.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit
                    </button>

                    <button
                      onClick={() => handleToggleActive(testimonial.id)}
                      className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        testimonial.isActive
                          ? "text-gray-600 bg-gray-50 hover:bg-gray-100"
                          : "text-green-600 bg-green-50 hover:bg-green-100"
                      }`}
                    >
                      {testimonial.isActive ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          Hide
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          Show
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDelete(testimonial.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>

                    {/* Reorder buttons */}
                    <div className="flex items-center gap-1 ml-auto">
                      <button
                        onClick={() => moveTestimonial(testimonial.id, "up")}
                        disabled={index === 0}
                        className="p-1.5 text-gray-600 bg-gray-50 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Move up"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveTestimonial(testimonial.id, "down")}
                        disabled={index === sortedTestimonials.length - 1}
                        className="p-1.5 text-gray-600 bg-gray-50 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Move down"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Footer */}
      {testimonials.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Quick Tips:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Use "Batch Create" to quickly add multiple testimonials</li>
                <li>Reorder testimonials using the arrow buttons</li>
                <li>Toggle visibility without deleting using Hide/Show</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteTargetId(null);
          setDeleteTargetName("");
        }}
        onConfirm={confirmDelete}
        title="Delete Testimonial"
        message={`Are you sure you want to delete the testimonial from "${deleteTargetName}"?`}
        confirmText="Delete"
        variant="danger"
        warningMessage="This action cannot be undone. The testimonial and associated images will be permanently removed."
      />
    </div>
  );
}
