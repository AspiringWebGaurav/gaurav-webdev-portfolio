"use client";

import React, { useState, useMemo, useRef } from "react";
import Image from "next/image";
import { useProjects } from "@/contexts/ProjectContext";
import {
  CreateProjectDTO,
  MAX_PROJECTS,
  MIN_TITLE_LENGTH,
  MAX_TITLE_LENGTH,
  MIN_DESCRIPTION_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_ICON_LISTS,
} from "@/types/project";
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
  ExternalLink,
  Image as ImageIcon,
  Link as LinkIcon,
  FileText,
  Tag,
  Upload,
  Globe,
  Library,
} from "lucide-react";
import { showToast } from "@/lib/toast";
import IconPicker from "./IconPicker";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

export default function ProjectManager() {
  const {
    projects,
    loading,
    createProject,
    updateProject,
    deleteProject,
    toggleProjectActive,
    canAddMoreProjects,
    getActiveProjectsCount,
  } = useProjects();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Confirmation modal states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteTargetName, setDeleteTargetName] = useState<string>("");
  
  const [formData, setFormData] = useState<CreateProjectDTO>({
    title: "",
    des: "",
    img: "",
    images: [],
    iconLists: [""],
    link: "",
    order: projects.length + 1,
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {}
  );
  const [deleteProgress, setDeleteProgress] = useState<number>(0);
  const [deletingImage, setDeletingImage] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [tempUrl, setTempUrl] = useState("");
  const [showIconPicker, setShowIconPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sort projects by order
  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => a.order - b.order);
  }, [projects]);

  /**
   * Handle form field changes
   */
  const handleFieldChange = (field: keyof CreateProjectDTO, value: any) => {
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
   * Handle icon list changes
   */
  const handleIconChange = (index: number, value: string) => {
    const newIcons = [...(formData.iconLists || [""])];
    newIcons[index] = value;
    handleFieldChange("iconLists", newIcons);
  };

  const addIconField = () => {
    const currentIcons = formData.iconLists || [];
    if (currentIcons.length < MAX_ICON_LISTS) {
      handleFieldChange("iconLists", [...currentIcons, ""]);
    } else {
      showToast.error(`Maximum ${MAX_ICON_LISTS} technology icons allowed`);
    }
  };

  const removeIconField = (index: number) => {
    const currentIcons = formData.iconLists || [];
    if (currentIcons.length > 1) {
      const newIcons = currentIcons.filter((_, i) => i !== index);
      handleFieldChange("iconLists", newIcons);
    }
  };

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = "Title is required";
    } else if (formData.title.trim().length < MIN_TITLE_LENGTH) {
      errors.title = `Title must be at least ${MIN_TITLE_LENGTH} characters`;
    } else if (formData.title.trim().length > MAX_TITLE_LENGTH) {
      errors.title = `Title must not exceed ${MAX_TITLE_LENGTH} characters`;
    }

    if (!formData.des.trim()) {
      errors.des = "Description is required";
    } else if (formData.des.trim().length < MIN_DESCRIPTION_LENGTH) {
      errors.des = `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters`;
    } else if (formData.des.trim().length > MAX_DESCRIPTION_LENGTH) {
      errors.des = `Description must not exceed ${MAX_DESCRIPTION_LENGTH} characters`;
    }

    if (!formData.img.trim()) {
      errors.img = "Image URL is required";
    }

    if (!formData.link.trim()) {
      errors.link = "Project link is required";
    }

    const validIcons = (formData.iconLists || []).filter((icon) => icon.trim());
    if (validIcons.length === 0) {
      errors.iconLists = "At least one technology icon is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Upload image from local file
   */
  const handleImageFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading({ ...uploading, mainImage: true });
    setUploadProgress({ ...uploadProgress, mainImage: 0 });

    // Simulate progress for UX
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => ({
        ...prev,
        mainImage: Math.min((prev.mainImage || 0) + 10, 90),
      }));
    }, 200);

    try {
      // Delete old image if it exists
      if (formData.img && formData.img.includes("storage.googleapis.com")) {
        await deleteImageFromCloud(formData.img);
      }

      const formDataToSend = new FormData();
      formDataToSend.append("file", file);
      formDataToSend.append("folder", "images");

      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formDataToSend,
      });

      const data = await response.json();

      clearInterval(progressInterval);
      setUploadProgress({ ...uploadProgress, mainImage: 100 });

      if (data.success) {
        handleFieldChange("img", data.url);
        showToast.success("Image uploaded successfully!");
        setTimeout(() => {
          setUploadProgress({ ...uploadProgress, mainImage: 0 });
        }, 1000);
      } else {
        showToast.error(data.error || "Upload failed");
        setUploadProgress({ ...uploadProgress, mainImage: 0 });
      }
    } catch (error) {
      clearInterval(progressInterval);
      showToast.error("Failed to upload image");
      console.error("Upload error:", error);
      setUploadProgress({ ...uploadProgress, mainImage: 0 });
    } finally {
      setUploading({ ...uploading, mainImage: false });
    }
  };

  /**
   * Upload image from URL
   */
  const handleUrlUpload = async () => {
    if (!tempUrl.trim()) return;

    setUploading({ ...uploading, mainImage: true });

    try {
      // Delete old image if it exists
      if (formData.img && formData.img.includes("storage.googleapis.com")) {
        await deleteImageFromCloud(formData.img);
      }

      const formDataToSend = new FormData();
      formDataToSend.append("url", tempUrl);
      formDataToSend.append("folder", "images");

      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formDataToSend,
      });

      const data = await response.json();

      if (data.success) {
        handleFieldChange("img", data.url);
        setTempUrl("");
        setShowUrlInput(false);
        showToast.success("Image uploaded from URL!");
      } else {
        showToast.error(data.error || "Upload failed");
      }
    } catch (error) {
      showToast.error("Failed to upload from URL");
      console.error("URL upload error:", error);
    } finally {
      setUploading({ ...uploading, mainImage: false });
    }
  };

  /**
   * Handle multiple images upload
   */
  const handleMultipleImagesUpload = async (files: FileList) => {
    const currentImages = formData.images || [];
    const filesToUpload = Array.from(files).slice(0, 10 - currentImages.length); // Max 10 images

    if (filesToUpload.length === 0) {
      showToast.error("Maximum 10 images allowed");
      return;
    }

    setUploading({ ...uploading, gallery: true });

    try {
      const uploadPromises = filesToUpload.map(async (file) => {
        const formDataToSend = new FormData();
        formDataToSend.append("file", file);
        formDataToSend.append("folder", "images");

        const response = await fetch("/api/upload-image", {
          method: "POST",
          body: formDataToSend,
        });

        const data = await response.json();
        return data.success ? data.url : null;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const validUrls = uploadedUrls.filter((url) => url !== null) as string[];

      if (validUrls.length > 0) {
        const newImages = [...currentImages, ...validUrls];
        handleFieldChange("images", newImages);
        // Also set the first image as main img for backward compatibility
        if (!formData.img && newImages.length > 0) {
          handleFieldChange("img", newImages[0]);
        }
        showToast.success(`${validUrls.length} image(s) uploaded!`);
      } else {
        showToast.error("Failed to upload images");
      }
    } catch (error) {
      showToast.error("Failed to upload images");
      console.error("Multiple images upload error:", error);
    } finally {
      setUploading({ ...uploading, gallery: false });
    }
  };

  /**
   * Remove image from gallery
   */
  const removeGalleryImage = async (index: number) => {
    const currentImages = formData.images || [];
    const imageToDelete = currentImages[index];

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
    if (imageToDelete && imageToDelete.includes("storage.googleapis.com")) {
      await deleteImageFromCloud(imageToDelete);
    }

    clearInterval(progressInterval);
    setDeleteProgress(100);

    const newImages = currentImages.filter((_, i) => i !== index);
    handleFieldChange("images", newImages);

    // Update main img if it was removed
    if (formData.img === imageToDelete) {
      handleFieldChange("img", newImages[0] || "");
    }

    showToast.success("Image removed from gallery and cloud");

    setTimeout(() => {
      setDeleteProgress(0);
      setDeletingImage(false);
    }, 500);
  };

  /**
   * Remove main project image
   */
  const removeMainImage = async () => {
    const imageToDelete = formData.img;

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
    if (imageToDelete && imageToDelete.includes("storage.googleapis.com")) {
      await deleteImageFromCloud(imageToDelete);
    }

    clearInterval(progressInterval);
    setDeleteProgress(100);

    handleFieldChange("img", "");
    showToast.success("Main image removed from project and cloud");

    setTimeout(() => {
      setDeleteProgress(0);
      setDeletingImage(false);
    }, 500);
  };

  /**
   * Reorder gallery images
   */
  const reorderGalleryImages = (fromIndex: number, toIndex: number) => {
    const currentImages = [...(formData.images || [])];
    const [movedImage] = currentImages.splice(fromIndex, 1);
    currentImages.splice(toIndex, 0, movedImage);
    handleFieldChange("images", currentImages);
  };

  /**
   * Upload icon from local file
   */
  const handleIconUpload = async (index: number) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setUploading({ ...uploading, [`icon_${index}`]: true });

      try {
        // Delete old icon if it exists and is from Storage
        const currentIcons = formData.iconLists || [];
        const oldIcon = currentIcons[index];
        if (oldIcon && oldIcon.includes("storage.googleapis.com")) {
          await deleteImageFromCloud(oldIcon);
        }

        const formDataToSend = new FormData();
        formDataToSend.append("file", file);
        formDataToSend.append("folder", "icons");

        const response = await fetch("/api/upload-image", {
          method: "POST",
          body: formDataToSend,
        });

        const data = await response.json();

        if (data.success) {
          const newIcons = [...(formData.iconLists || [""])];
          newIcons[index] = data.url;
          handleFieldChange("iconLists", newIcons);
          showToast.success(`Icon ${index + 1} uploaded!`);
        } else {
          showToast.error(data.error || "Upload failed");
        }
      } catch (error) {
        showToast.error("Failed to upload icon");
        console.error("Icon upload error:", error);
      } finally {
        setUploading({ ...uploading, [`icon_${index}`]: false });
      }
    };

    input.click();
  };

  /**
   * Handle icon selection from icon picker
   */
  const handleIconSelect = (iconUrl: string) => {
    const currentIcons = formData.iconLists || [];
    const emptyIndex = currentIcons.findIndex((icon) => !icon.trim());

    if (emptyIndex !== -1) {
      // Fill empty slot
      const newIcons = [...currentIcons];
      newIcons[emptyIndex] = iconUrl;
      handleFieldChange("iconLists", newIcons);
    } else if (currentIcons.length < MAX_ICON_LISTS) {
      // Add new slot
      handleFieldChange("iconLists", [...currentIcons, iconUrl]);
    } else {
      showToast.error(`Maximum ${MAX_ICON_LISTS} icons allowed`);
    }
  };

  /**
   * Handle icon removal from icon picker
   */
  const handleIconRemove = (iconUrl: string) => {
    const currentIcons = formData.iconLists || [];
    const newIcons = currentIcons.filter((icon) => icon !== iconUrl);
    // Ensure at least one slot remains
    if (newIcons.length === 0) {
      newIcons.push("");
    }
    handleFieldChange("iconLists", newIcons);
  };

  /**
   * Get selected icon URLs for icon picker
   */
  const getSelectedIconUrls = (): string[] => {
    return (formData.iconLists || []).filter((icon) => icon.trim());
  };

  /**
   * Start creating a new project
   */
  const startCreate = () => {
    if (!canAddMoreProjects()) {
      showToast.error(
        `Maximum ${MAX_PROJECTS} projects allowed. Delete a project first.`
      );
      return;
    }

    setIsCreating(true);
    setEditingId(null);
    setFormData({
      title: "",
      des: "",
      img: "",
      images: [],
      iconLists: [""],
      link: "",
      order: projects.length + 1,
      isActive: true,
    });
    setFormErrors({});
  };

  /**
   * Start editing a project
   */
  const startEdit = (id: string) => {
    const project = projects.find((p) => p.id === id);
    if (!project) return;

    try {
      // Defensive: ensure iconLists is an array
      const iconLists = Array.isArray(project.iconLists)
        ? project.iconLists.length
          ? project.iconLists
          : [""]
        : [""];

      // Defensive: ensure images is an array
      const images = Array.isArray(project.images)
        ? project.images
        : project.img
        ? [project.img]
        : [];

      const newForm = {
        title: project.title || "",
        des: project.des || "",
        img: project.img || "",
        images: [...images],
        iconLists: [...iconLists],
        link: project.link || "",
        order: project.order ?? projects.length + 1,
        isActive: project.isActive ?? true,
      } as CreateProjectDTO;

      // Set states together
      setIsCreating(false);
      setEditingId(id);
      setFormData(newForm);
      setFormErrors({});

      // Smooth scroll form into view and focus first input for better UX
      setTimeout(() => {
        try {
          const formEl = document.querySelector(
            "[data-project-form]"
          ) as HTMLElement | null;
          if (formEl) {
            formEl.scrollIntoView({ behavior: "smooth", block: "center" });
            const firstInput = formEl.querySelector(
              "input, textarea"
            ) as HTMLElement | null;
            firstInput?.focus();
          }
        } catch (e) {
          // ignore
        }
      }, 60);
    } catch (err) {
      console.error("startEdit error:", err);
      showToast.error("Unable to open edit form. Please try again.");
    }
  };

  /**
   * Cancel editing
   */
  const cancelEdit = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({
      title: "",
      des: "",
      img: "",
      images: [],
      iconLists: [""],
      link: "",
      order: projects.length + 1,
      isActive: true,
    });
    setFormErrors({});
  };

  /**
   * Save project (create or update)
   */
  const saveProject = async () => {
    if (!validateForm()) {
      showToast.error("Please fix validation errors");
      return;
    }

    setSubmitting(true);

    try {
      // Filter out empty icon URLs
      const cleanedIcons = (formData.iconLists || []).filter((icon) =>
        icon.trim()
      );

      // Prepare images array
      const cleanedImages = (formData.images || []).filter((img) => img.trim());

      console.log("💾 Saving project with:", {
        title: formData.title,
        imagesCount: cleanedImages.length,
        images: cleanedImages,
        isCreating,
      });

      if (isCreating) {
        const result = await createProject({
          ...formData,
          iconLists: cleanedIcons,
          images: cleanedImages,
        });

        if (result.success) {
          console.log("✅ Project created successfully");
          cancelEdit();
        }
      } else if (editingId) {
        const result = await updateProject({
          id: editingId,
          ...formData,
          iconLists: cleanedIcons,
          images: cleanedImages,
        });

        if (result.success) {
          console.log("✅ Project updated successfully");
          cancelEdit();
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Delete a project with confirmation
   */
  const handleDelete = async (id: string) => {
    const project = projects.find((p) => p.id === id);
    if (!project) return;

    setDeleteTargetId(id);
    setDeleteTargetName(project.title);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    
    const project = projects.find((p) => p.id === deleteTargetId);
    if (!project) return;

    // Close modal immediately
    setShowDeleteConfirm(false);
    setDeleteTargetId(null);
    setDeleteTargetName("");

    // Show progress notification
    showToast.info("Deleting project...", "Deleting", { autoClose: 2000 });

    // Collect all images to delete from cloud
    const imagesToDelete = [];

    // Main project image
    if (project.img && project.img.includes("storage.googleapis.com")) {
      imagesToDelete.push(project.img);
    }

    // All gallery images
    if (project.images && Array.isArray(project.images)) {
      project.images.forEach((imgUrl) => {
        if (imgUrl && imgUrl.includes("storage.googleapis.com")) {
          imagesToDelete.push(imgUrl);
        }
      });
    }

    // All icon images
    if (project.iconLists && Array.isArray(project.iconLists)) {
      project.iconLists.forEach((iconUrl) => {
        if (iconUrl && iconUrl.includes("storage.googleapis.com")) {
          imagesToDelete.push(iconUrl);
        }
      });
    }

    // Delete all images from cloud in parallel
    if (imagesToDelete.length > 0) {
      await Promise.all(imagesToDelete.map((url) => deleteImageFromCloud(url)));
      showToast.success(`Deleted ${imagesToDelete.length} image(s) from cloud`);
    }

    await deleteProject(project.id);
  };

  /**
   * Toggle project visibility
   */
  const handleToggleActive = async (id: string) => {
    await toggleProjectActive(id);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Portfolio Projects
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {projects.length} / {MAX_PROJECTS} projects •{" "}
            {getActiveProjectsCount()} active (visible on frontend)
          </p>
        </div>

        <button
          onClick={startCreate}
          disabled={
            !canAddMoreProjects() || isCreating || editingId !== null || loading
          }
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Project
        </button>
      </div>

      {/* Info Banner */}
      {projects.length >= 7 && projects.length % 2 !== 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium">Asymmetric Layout Warning</p>
            <p className="mt-1">
              You currently have {projects.length} projects. Consider adding one
              more to create a symmetric 2x2 grid layout on the frontend.
            </p>
          </div>
        </div>
      )}

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <div
          data-project-form
          className="bg-gradient-to-br from-white to-gray-50 border-2 border-blue-500 rounded-xl p-6 shadow-xl"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                {isCreating ? "Create New Project" : "Edit Project"}
              </h3>
            </div>
            <button
              onClick={cancelEdit}
              disabled={submitting}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              aria-label="Cancel editing"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <FileText className="w-4 h-4" />
                Project Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleFieldChange("title", e.target.value)}
                placeholder="Enter project title"
                maxLength={MAX_TITLE_LENGTH}
                className={`w-full px-3 py-2 bg-white text-gray-900 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 ${
                  formErrors.title
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300"
                }`}
              />
              {formErrors.title && (
                <p className="text-xs text-red-600 mt-1">{formErrors.title}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {formData.title.length} / {MAX_TITLE_LENGTH}
              </p>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <FileText className="w-4 h-4" />
                Description *
              </label>
              <textarea
                value={formData.des}
                onChange={(e) => handleFieldChange("des", e.target.value)}
                placeholder="Enter project description"
                maxLength={MAX_DESCRIPTION_LENGTH}
                rows={3}
                className={`w-full px-3 py-2 bg-white text-gray-900 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 resize-none ${
                  formErrors.des
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300"
                }`}
              />
              {formErrors.des && (
                <p className="text-xs text-red-600 mt-1">{formErrors.des}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {formData.des.length} / {MAX_DESCRIPTION_LENGTH}
              </p>
            </div>

            {/* Project Image Upload */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <ImageIcon className="w-4 h-4" />
                Project Image *
              </label>

              {/* Image Preview */}
              {formData.img && (
                <div className="relative w-full h-48 mb-3 rounded-lg overflow-hidden border-2 border-gray-300 bg-gray-50">
                  <img
                    src={formData.img}
                    alt="Project preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder-image.svg";
                    }}
                  />
                  <button
                    onClick={removeMainImage}
                    disabled={deletingImage}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                    type="button"
                    title="Remove image"
                    aria-label="Remove image"
                  >
                    {deletingImage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                  </button>
                </div>
              )}

              {/* Upload Options */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileUpload}
                    className="hidden"
                    aria-label="Upload image file"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading.mainImage}
                    type="button"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {uploading.mainImage ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Upload from Device
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    disabled={uploading.mainImage}
                    type="button"
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    <Globe className="w-4 h-4" />
                    From URL
                  </button>
                </div>

                {/* URL Input */}
                {showUrlInput && (
                  <div className="flex gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <input
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={tempUrl}
                      onChange={(e) => setTempUrl(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleUrlUpload();
                        }
                      }}
                      className="flex-1 px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all placeholder:text-gray-400"
                    />
                    <button
                      onClick={handleUrlUpload}
                      disabled={!tempUrl.trim() || uploading.mainImage}
                      type="button"
                      className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      Upload
                    </button>
                  </div>
                )}

                {/* Manual URL Input (fallback) */}
                {!formData.img && (
                  <input
                    type="text"
                    value={formData.img}
                    onChange={(e) => handleFieldChange("img", e.target.value)}
                    placeholder="Or paste image URL directly"
                    className={`w-full px-3 py-2 bg-white text-gray-900 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 text-sm ${
                      formErrors.img
                        ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                )}
              </div>

              {formErrors.img && (
                <p className="text-xs text-red-600 mt-1">{formErrors.img}</p>
              )}
            </div>

            {/* Multiple Images Gallery */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <ImageIcon className="w-4 h-4" />
                Project Images Gallery (Optional - for slideshow)
                <span className="text-xs text-gray-500 font-normal">
                  (Max 10 images)
                </span>
              </label>

              {/* Images Grid */}
              {(formData.images || []).length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-3">
                  {(formData.images || []).map((imageUrl, index) => (
                    <div
                      key={index}
                      className="relative group aspect-video rounded-lg overflow-hidden border-2 border-gray-300 bg-gray-50"
                    >
                      <Image
                        src={imageUrl}
                        alt={`Gallery ${index + 1}`}
                        fill
                        sizes="200px"
                        className="object-cover"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder-image.svg";
                        }}
                      />
                      {/* Image number badge */}
                      <div className="absolute top-1 left-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                        {index + 1}
                      </div>
                      {/* Remove button */}
                      <button
                        onClick={() => removeGalleryImage(index)}
                        className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-lg opacity-0 group-hover:opacity-100"
                        type="button"
                        title={`Remove image ${index + 1}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                      {/* Reorder buttons */}
                      <div className="absolute bottom-1 left-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {index > 0 && (
                          <button
                            onClick={() =>
                              reorderGalleryImages(index, index - 1)
                            }
                            className="flex-1 px-2 py-1 bg-blue-500/90 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                            type="button"
                            title="Move left"
                          >
                            ←
                          </button>
                        )}
                        {index < (formData.images || []).length - 1 && (
                          <button
                            onClick={() =>
                              reorderGalleryImages(index, index + 1)
                            }
                            className="flex-1 px-2 py-1 bg-blue-500/90 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                            type="button"
                            title="Move right"
                          >
                            →
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Button */}
              {(formData.images || []).length < 10 && (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        handleMultipleImagesUpload(e.target.files);
                      }
                    }}
                    className="hidden"
                    id="gallery-upload"
                  />
                  <label
                    htmlFor="gallery-upload"
                    className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                      uploading.gallery
                        ? "border-gray-300 bg-gray-50 cursor-not-allowed"
                        : "border-blue-300 bg-blue-50 hover:bg-blue-100 hover:border-blue-400"
                    }`}
                  >
                    {uploading.gallery ? (
                      <>
                        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                        <span className="text-sm text-gray-600">
                          Uploading images...
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-blue-600" />
                        <span className="text-sm text-blue-600 font-medium">
                          Add Images to Gallery (
                          {(formData.images || []).length}
                          /10)
                        </span>
                      </>
                    )}
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Multiple images will auto-play as slideshow on frontend
                  </p>
                </div>
              )}
            </div>

            {/* Project Link */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <LinkIcon className="w-4 h-4" />
                Project Link *
              </label>
              <input
                type="text"
                value={formData.link}
                onChange={(e) => handleFieldChange("link", e.target.value)}
                placeholder="https://github.com/..."
                className={`w-full px-3 py-2 bg-white text-gray-900 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 ${
                  formErrors.link
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300"
                }`}
              />
              {formErrors.link && (
                <p className="text-xs text-red-600 mt-1">{formErrors.link}</p>
              )}
            </div>

            {/* Technology Icons */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Tag className="w-4 h-4" />
                Technology Icons * (max {MAX_ICON_LISTS})
              </label>

              {/* Icons Preview Grid */}
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 mb-3">
                {(formData.iconLists || []).map((icon, index) => (
                  <div key={index} className="relative group">
                    {icon ? (
                      <div className="relative aspect-square">
                        <div className="w-full h-full rounded-full border-2 border-gray-700 bg-black overflow-hidden flex items-center justify-center p-1.5">
                          <div className="w-full h-full bg-white/10 backdrop-blur-sm rounded-full p-1.5 flex items-center justify-center relative">
                            <Image
                              src={icon}
                              alt={`Tech ${index + 1}`}
                              fill
                              sizes="80px"
                              className="object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] p-1"
                              loading="lazy"
                              unoptimized
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder-icon.svg";
                              }}
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => removeIconField(index)}
                          className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 shadow-lg"
                          type="button"
                          title={`Remove icon ${index + 1}`}
                          aria-label={`Remove icon ${index + 1}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleIconUpload(index)}
                        disabled={uploading[`icon_${index}`]}
                        className="w-full aspect-square rounded-full border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        type="button"
                        title={`Upload icon ${index + 1}`}
                        aria-label={`Upload icon ${index + 1}`}
                      >
                        {uploading[`icon_${index}`] ? (
                          <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                        ) : (
                          <Upload className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add/Remove Controls */}
              <div className="flex items-center gap-3 text-sm flex-wrap">
                <button
                  onClick={() => setShowIconPicker(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 transition-colors"
                  type="button"
                >
                  <Library className="w-4 h-4" />
                  Choose from Library
                </button>

                {(formData.iconLists || []).length < MAX_ICON_LISTS && (
                  <button
                    onClick={addIconField}
                    className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    type="button"
                  >
                    <Plus className="w-4 h-4" />
                    Add Icon Slot
                  </button>
                )}

                <span className="text-gray-500">
                  {(formData.iconLists || []).filter((i) => i).length}/
                  {(formData.iconLists || []).length} filled
                </span>
              </div>

              {formErrors.iconLists && (
                <p className="text-xs text-red-600 mt-2">
                  {formErrors.iconLists}
                </p>
              )}
            </div>

            {/* Order and Active Status */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label
                  htmlFor="project-order"
                  className="text-sm font-medium text-gray-700 mb-1 block"
                >
                  Display Order
                </label>
                <input
                  id="project-order"
                  type="number"
                  min="1"
                  max={MAX_PROJECTS}
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
              onClick={saveProject}
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
                  {isCreating ? "Create Project" : "Update Project"}
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

      {/* Projects List */}
      {loading && projects.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : sortedProjects.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-5xl mb-3">📁</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Projects Yet
          </h3>
          <p className="text-gray-600 mb-4">
            Get started by creating your first portfolio project
          </p>
          <button
            onClick={startCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedProjects.map((project) => (
            <div
              key={project.id}
              className={`bg-white border-2 rounded-lg p-4 transition-all ${
                project.isActive
                  ? "border-gray-200 hover:border-blue-300"
                  : "border-gray-200 bg-gray-50 opacity-75"
              }`}
            >
              {/* Project Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <GripVertical className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {project.title}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Order: {project.order}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleToggleActive(project.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      project.isActive
                        ? "text-green-600 hover:bg-green-50"
                        : "text-gray-400 hover:bg-gray-100"
                    }`}
                    title={
                      project.isActive
                        ? "Active (visible)"
                        : "Inactive (hidden)"
                    }
                  >
                    {project.isActive ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => startEdit(project.id)}
                    disabled={
                      isCreating ||
                      (editingId !== null && editingId !== project.id)
                    }
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Edit project"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    disabled={isCreating || editingId !== null}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Delete project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Project Details */}
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {project.des}
              </p>

              {/* Technology Icons */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {project.iconLists.slice(0, 5).map((icon, idx) => (
                  <div
                    key={idx}
                    className="w-8 h-8 rounded-full bg-black border border-gray-700 flex items-center justify-center overflow-hidden p-1"
                  >
                    <div className="w-full h-full bg-white/10 backdrop-blur-sm rounded-full p-1 flex items-center justify-center relative">
                      <Image
                        src={icon}
                        alt={`Tech icon ${idx + 1}`}
                        fill
                        sizes="32px"
                        className="object-contain drop-shadow-[0_0_6px_rgba(255,255,255,0.3)]"
                        loading="lazy"
                        unoptimized
                      />
                    </div>
                  </div>
                ))}
                {project.iconLists.length > 5 && (
                  <span className="text-xs text-gray-500">
                    +{project.iconLists.length - 5}
                  </span>
                )}
              </div>

              {/* Project Link */}
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                View Project
                <ExternalLink className="w-3 h-3" />
              </a>

              {/* Metadata */}
              <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                Updated: {new Date(project.updatedAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Icon Picker Modal */}
      {showIconPicker && (
        <IconPicker
          selectedIcons={getSelectedIconUrls()}
          onSelect={handleIconSelect}
          onRemove={handleIconRemove}
          maxIcons={MAX_ICON_LISTS}
          onClose={() => setShowIconPicker(false)}
          onCustomUpload={() => {
            setShowIconPicker(false);
            // Trigger upload for first empty slot
            const emptyIndex = (formData.iconLists || []).findIndex(
              (icon) => !icon.trim()
            );
            if (emptyIndex !== -1) {
              handleIconUpload(emptyIndex);
            }
          }}
        />
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
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteTargetName}"?`}
        confirmText="Delete"
        variant="danger"
        warningMessage="This action cannot be undone. The project and all associated images will be permanently removed."
      />
    </div>
  );
}
