"use client";

import React, { useState, useMemo, useRef } from "react";
import Image from "next/image";
import { useWorkExperiences } from "@/contexts/WorkExperienceContext";
import {
  CreateWorkExperienceDTO,
  MAX_WORK_EXPERIENCES,
  MIN_TITLE_LENGTH,
  MAX_TITLE_LENGTH,
  MIN_DESC_LENGTH,
  MAX_DESC_LENGTH,
} from "@/types/workExperience";
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
  Upload,
  Globe,
  Briefcase,
  MapPin,
  Calendar,
  Building,
  Library,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { showToast } from "@/lib/toast";
import IconPicker from "./IconPicker";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

// Suggested icons for work experience - using reliable CDN URLs
const SUGGESTED_WORK_EXPERIENCE_ICONS = [
  "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nextjs/nextjs-original.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/java/java-original.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/go/go-original.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/rust/rust-original.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mongodb/mongodb-original.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/postgresql/postgresql-original.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/amazonwebservices/amazonwebservices-plain-wordmark.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/docker/docker-original.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/kubernetes/kubernetes-plain.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/git/git-original.svg",
];

// Suggested job titles for quick selection
const SUGGESTED_JOB_TITLES = [
  "Senior Software Engineer",
  "Full Stack Developer",
  "Frontend Developer",
  "Backend Developer",
  "DevOps Engineer",
  "Software Architect",
  "Tech Lead",
  "Engineering Manager",
  "Product Engineer",
  "Systems Engineer",
  "Machine Learning Engineer",
  "Data Engineer",
  "Cloud Engineer",
  "Mobile Developer",
  "UI/UX Engineer",
];

export default function WorkExperienceManager() {
  const {
    workExperiences,
    loading,
    createWorkExperience,
    updateWorkExperience,
    deleteWorkExperience,
    toggleWorkExperienceActive,
    reorderWorkExperiences,
    canAddMoreWorkExperiences,
    getActiveWorkExperiencesCount,
  } = useWorkExperiences();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Confirmation modal states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteTargetTitle, setDeleteTargetTitle] = useState<string>("");
  
  const [formData, setFormData] = useState<CreateWorkExperienceDTO>({
    title: "",
    desc: "",
    thumbnail: "",
    company: "",
    duration: "",
    location: "",
    order: workExperiences.length + 1,
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [tempUrl, setTempUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sort work experiences by order
  const sortedExperiences = useMemo(() => {
    return [...workExperiences].sort((a, b) => a.order - b.order);
  }, [workExperiences]);

  /**
   * Handle form field changes
   */
  const handleFieldChange = (
    field: keyof CreateWorkExperienceDTO,
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
    }
  };

  /**
   * Upload image to Firebase Storage
   */
  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "work-experience");

    const response = await fetch("/api/upload-image", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to upload image");
    }

    const data = await response.json();
    return data.url;
  };

  /**
   * Handle icon/thumbnail upload
   */
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showToast.error("Please select an image file");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      showToast.error("Image size must be less than 5MB");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const imageUrl = await uploadImage(file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Delete old thumbnail if exists and is from cloud storage
      if (
        formData.thumbnail &&
        formData.thumbnail.includes("firebasestorage.googleapis.com")
      ) {
        await deleteImageFromCloud(formData.thumbnail);
      }

      handleFieldChange("thumbnail", imageUrl);
      showToast.success("Image uploaded successfully!");
    } catch (error) {
      console.error("Error uploading image:", error);
      showToast.error(
        error instanceof Error ? error.message : "Failed to upload image"
      );
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  /**
   * Handle icon selection from IconPicker
   */
  const handleIconSelect = (iconUrl: string) => {
    handleFieldChange("thumbnail", iconUrl);
    setShowIconPicker(false);
    showToast.success("Icon selected!");
  };

  /**
   * Handle manual URL input
   */
  const handleUrlSubmit = () => {
    if (!tempUrl.trim()) {
      showToast.error("Please enter a valid URL");
      return;
    }

    if (!tempUrl.match(/^(https?:\/\/|\/)/)) {
      showToast.error("Please enter a valid HTTP/HTTPS URL or path");
      return;
    }

    handleFieldChange("thumbnail", tempUrl.trim());
    setTempUrl("");
    setShowUrlInput(false);
    showToast.success("URL added successfully!");
  };

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Title validation
    if (!formData.title?.trim()) {
      errors.title = "Title is required";
    } else if (formData.title.trim().length < MIN_TITLE_LENGTH) {
      errors.title = `Title must be at least ${MIN_TITLE_LENGTH} characters`;
    } else if (formData.title.length > MAX_TITLE_LENGTH) {
      errors.title = `Title must not exceed ${MAX_TITLE_LENGTH} characters`;
    }

    // Description validation
    if (!formData.desc?.trim()) {
      errors.desc = "Description is required";
    } else if (formData.desc.trim().length < MIN_DESC_LENGTH) {
      errors.desc = `Description must be at least ${MIN_DESC_LENGTH} characters`;
    } else if (formData.desc.length > MAX_DESC_LENGTH) {
      errors.desc = `Description must not exceed ${MAX_DESC_LENGTH} characters`;
    }

    // Thumbnail validation
    if (!formData.thumbnail?.trim()) {
      errors.thumbnail = "Icon/Image is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Reset form to initial state
   */
  const resetForm = () => {
    setFormData({
      title: "",
      desc: "",
      thumbnail: "",
      company: "",
      duration: "",
      location: "",
      order: workExperiences.length + 1,
      isActive: true,
    });
    setFormErrors({});
    setIsCreating(false);
    setEditingId(null);
    setShowIconPicker(false);
    setShowUrlInput(false);
    setTempUrl("");
  };

  /**
   * Handle create new work experience
   */
  const handleCreate = async () => {
    if (!validateForm()) {
      showToast.error("Please fix the validation errors");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createWorkExperience(formData);
      if (result.success) {
        resetForm();
      }
    } catch (error) {
      console.error("Error creating work experience:", error);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Handle edit work experience
   */
  const handleEdit = (id: string) => {
    try {
      const experience = workExperiences.find((e) => e.id === id);
      if (!experience) {
        showToast.error("Work experience not found");
        return;
      }

      setFormData({
        title: experience.title,
        desc: experience.desc,
        thumbnail: experience.thumbnail,
        company: experience.company || "",
        duration: experience.duration || "",
        location: experience.location || "",
        order: experience.order,
        isActive: experience.isActive,
      });
      setEditingId(id);
      setIsCreating(true);

      // Scroll to form and focus first input
      setTimeout(() => {
        const formEl = document.querySelector("[data-experience-form]");
        if (formEl) {
          formEl.scrollIntoView({ behavior: "smooth", block: "center" });
          const firstInput = formEl.querySelector<
            HTMLInputElement | HTMLTextAreaElement
          >("input:not([type='hidden']), textarea");
          if (firstInput) {
            firstInput.focus();
          }
        }
      }, 100);
    } catch (error) {
      console.error("Error opening edit form:", error);
      showToast.error("Unable to open edit form");
    }
  };

  /**
   * Handle update work experience
   */
  const handleUpdate = async () => {
    if (!editingId || !validateForm()) {
      showToast.error("Please fix the validation errors");
      return;
    }

    setSubmitting(true);
    try {
      const result = await updateWorkExperience({
        id: editingId,
        ...formData,
      });
      if (result.success) {
        resetForm();
      }
    } catch (error) {
      console.error("Error updating work experience:", error);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Handle delete work experience
   */
  const handleDelete = async (id: string) => {
    const experience = workExperiences.find((e) => e.id === id);
    if (!experience) return;

    setDeleteTargetId(id);
    setDeleteTargetTitle(experience.title);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    
    const experience = workExperiences.find((e) => e.id === deleteTargetId);
    if (!experience) return;

    // Close modal immediately
    setShowDeleteConfirm(false);
    setDeleteTargetId(null);
    setDeleteTargetTitle("");

    // Show progress notification
    showToast.info("Deleting work experience...", undefined, { autoClose: 2000 });

    try {
      // Delete thumbnail from cloud if it's stored in Firebase Storage
      if (
        experience.thumbnail &&
        experience.thumbnail.includes("storage.googleapis.com")
      ) {
        await deleteImageFromCloud(experience.thumbnail);
        showToast.success("Deleted image from cloud");
      }

      await deleteWorkExperience(experience.id);
    } catch (error) {
      console.error("Error deleting work experience:", error);
      showToast.error("Failed to delete work experience");
    }
  };

  /**
   * Handle toggle active status
   */
  const handleToggleActive = async (id: string) => {
    try {
      await toggleWorkExperienceActive(id);
    } catch (error) {
      console.error("Error toggling work experience active status:", error);
    }
  };

  /**
   * Start creating new work experience
   */
  const startCreate = () => {
    if (!canAddMoreWorkExperiences()) {
      showToast.error(
        `Maximum ${MAX_WORK_EXPERIENCES} work experiences allowed. Please delete one before adding a new one.`
      );
      return;
    }

    resetForm();
    setIsCreating(true);
  };

  /**
   * Reorder work experiences (move up/down)
   */
  const moveWorkExperience = async (id: string, direction: "up" | "down") => {
    const currentIndex = sortedExperiences.findIndex((e) => e.id === id);
    if (currentIndex === -1) return;

    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sortedExperiences.length) return;

    const current = sortedExperiences[currentIndex];
    const target = sortedExperiences[targetIndex];

    try {
      // Swap orders
      await Promise.all([
        updateWorkExperience({ id: current.id, order: target.order }),
        updateWorkExperience({ id: target.id, order: current.order }),
      ]);
    } catch (error) {
      console.error("Error reordering work experiences:", error);
      showToast.error("Failed to reorder work experiences");
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Work Experience Manager
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {workExperiences.length}/{MAX_WORK_EXPERIENCES} work experiences •{" "}
              {getActiveWorkExperiencesCount()} active
            </p>
          </div>
          <button
            onClick={startCreate}
            disabled={!canAddMoreWorkExperiences() || isCreating || loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Experience
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* Create/Edit Form */}
        {isCreating && (
          <div
            data-experience-form
            className="bg-gradient-to-br from-white to-gray-50 border-2 border-blue-500 rounded-xl p-6 shadow-xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  {editingId
                    ? "Edit Work Experience"
                    : "Create New Work Experience"}
                </h3>
              </div>
              <button
                onClick={resetForm}
                disabled={submitting}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                title="Close form"
                aria-label="Close form"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title */}
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Briefcase className="w-4 h-4" />
                  Job Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleFieldChange("title", e.target.value)}
                  placeholder="e.g., Frontend Engineer Intern"
                  maxLength={MAX_TITLE_LENGTH}
                  className={`w-full px-3 py-2 bg-white text-gray-900 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 ${
                    formErrors.title
                      ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-300"
                  }`}
                />
                {formErrors.title && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {formErrors.title}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {formData.title.length}/{MAX_TITLE_LENGTH} characters
                </p>

                {/* Title Suggestions */}
                <div className="mt-2">
                  <p className="text-xs text-gray-600 mb-1">
                    Quick suggestions:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {SUGGESTED_JOB_TITLES.slice(0, 5).map((title) => (
                      <button
                        key={title}
                        type="button"
                        onClick={() => handleFieldChange("title", title)}
                        className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                      >
                        {title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Briefcase className="w-4 h-4" />
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.desc}
                  onChange={(e) => handleFieldChange("desc", e.target.value)}
                  placeholder="Describe your role and responsibilities..."
                  rows={4}
                  maxLength={MAX_DESC_LENGTH}
                  className={`w-full px-3 py-2 bg-white text-gray-900 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 resize-none ${
                    formErrors.desc
                      ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-300"
                  }`}
                />
                {formErrors.desc && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {formErrors.desc}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {formData.desc.length}/{MAX_DESC_LENGTH} characters
                </p>
              </div>

              {/* Company (Optional) */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Building className="w-4 h-4" />
                  Company
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleFieldChange("company", e.target.value)}
                  placeholder="e.g., JSM Tech"
                  maxLength={100}
                  className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                />
              </div>

              {/* Duration (Optional) */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-4 h-4" />
                  Duration
                </label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) =>
                    handleFieldChange("duration", e.target.value)
                  }
                  placeholder="e.g., 2020 - 2021"
                  maxLength={50}
                  className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                />
              </div>

              {/* Location (Optional) */}
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <MapPin className="w-4 h-4" />
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    handleFieldChange("location", e.target.value)
                  }
                  placeholder="e.g., New York, USA"
                  maxLength={100}
                  className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                />
              </div>

              {/* Icon/Thumbnail */}
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Globe className="w-4 h-4" />
                  Icon/Image <span className="text-red-500">*</span>
                </label>

                {/* Icon Preview */}
                {formData.thumbnail && (
                  <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="relative w-16 h-16 bg-white rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                        <Image
                          src={formData.thumbnail}
                          alt="Icon preview"
                          fill
                          className="object-contain p-2"
                          unoptimized
                          loading="eager"
                          priority
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-600 break-all">
                          {formData.thumbnail}
                        </p>
                        <button
                          onClick={() => handleFieldChange("thumbnail", "")}
                          className="text-xs text-red-600 hover:text-red-700 mt-1"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Upload Options */}
                <div className="flex flex-wrap gap-2">
                  {/* Browse Icon Library */}
                  <button
                    type="button"
                    onClick={() => setShowIconPicker(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Library className="w-4 h-4" />
                    Browse Icon Library
                  </button>

                  {/* Upload Custom Image */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {uploading ? "Uploading..." : "Upload Custom"}
                  </button>

                  {/* Manual URL Input */}
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    Enter URL
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    aria-label="Upload image file"
                  />
                </div>

                {/* Icon Suggestions */}
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs font-medium text-blue-900 mb-2">
                    Popular Tech Icons:
                  </p>
                  <div className="grid grid-cols-8 gap-2">
                    {SUGGESTED_WORK_EXPERIENCE_ICONS.map((iconUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleFieldChange("thumbnail", iconUrl)}
                        className="relative w-10 h-10 p-1.5 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all overflow-hidden"
                        title="Click to use this icon"
                      >
                        <Image
                          src={iconUrl}
                          alt={`Tech icon ${idx + 1}`}
                          fill
                          className="object-contain p-0.5"
                          unoptimized
                          loading="eager"
                          onError={(e) => {
                            // Fallback to placeholder on error
                            const target = e.target as HTMLImageElement;
                            target.src =
                              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Crect x='3' y='3' width='18' height='18' rx='2'/%3E%3Cline x1='3' y1='12' x2='21' y2='12'/%3E%3Cline x1='12' y1='3' x2='12' y2='21'/%3E%3C/svg%3E";
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Upload Progress */}
                {uploading && (
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {uploadProgress}% uploaded
                    </p>
                  </div>
                )}

                {/* URL Input */}
                {showUrlInput && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Enter Image URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={tempUrl}
                        onChange={(e) => setTempUrl(e.target.value)}
                        placeholder="https://example.com/icon.svg"
                        className="flex-1 px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm placeholder:text-gray-400"
                      />
                      <button
                        onClick={handleUrlSubmit}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}

                {formErrors.thumbnail && (
                  <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {formErrors.thumbnail}
                  </p>
                )}
              </div>

              {/* Active Status */}
              <div className="md:col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    handleFieldChange("isActive", e.target.checked)
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  Show on frontend (visible to visitors)
                </label>
              </div>

              {/* Action Buttons */}
              <div className="md:col-span-2 flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={editingId ? handleUpdate : handleCreate}
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {submitting
                    ? "Saving..."
                    : editingId
                    ? "Update Experience"
                    : "Create Experience"}
                </button>
                <button
                  onClick={resetForm}
                  disabled={submitting}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Work Experiences List */}
        <div className="space-y-4">
          {loading && workExperiences.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : sortedExperiences.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No work experiences yet
              </h3>
              <p className="text-gray-600 mb-4">
                Get started by adding your first work experience
              </p>
              <button
                onClick={startCreate}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Experience
              </button>
            </div>
          ) : (
            sortedExperiences.map((experience, index) => (
              <div
                key={experience.id}
                className={`bg-white rounded-lg shadow-sm border p-6 transition-all ${
                  !experience.isActive
                    ? "border-gray-300 opacity-60"
                    : "border-gray-200"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Drag Handle */}
                  <div className="flex-shrink-0 mt-1">
                    <GripVertical className="w-5 h-5 text-gray-400" />
                  </div>

                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <div className="relative w-16 h-16 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                      <Image
                        src={experience.thumbnail}
                        alt={experience.title}
                        fill
                        className="object-contain p-2"
                        unoptimized
                        loading="eager"
                        priority
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {experience.title}
                        </h3>
                        {experience.company && (
                          <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                            <Building className="w-4 h-4" />
                            {experience.company}
                          </p>
                        )}
                      </div>
                      <span className="flex-shrink-0 px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
                        #{experience.order}
                      </span>
                    </div>

                    <p className="text-gray-700 mb-3">{experience.desc}</p>

                    {/* Additional Info */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                      {experience.duration && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {experience.duration}
                        </span>
                      )}
                      {experience.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {experience.location}
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleActive(experience.id)}
                        className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
                          experience.isActive
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {experience.isActive ? (
                          <>
                            <Eye className="w-4 h-4" />
                            <span className="text-sm">Active</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-4 h-4" />
                            <span className="text-sm">Hidden</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleEdit(experience.id)}
                        disabled={isCreating}
                        className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span className="text-sm">Edit</span>
                      </button>

                      <button
                        onClick={() => handleDelete(experience.id)}
                        className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-sm">Delete</span>
                      </button>

                      {/* Reorder buttons */}
                      <div className="flex items-center gap-1 ml-auto">
                        <button
                          onClick={() =>
                            moveWorkExperience(experience.id, "up")
                          }
                          disabled={index === 0}
                          className="p-1.5 text-gray-600 bg-gray-50 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Move up"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            moveWorkExperience(experience.id, "down")
                          }
                          disabled={index === sortedExperiences.length - 1}
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
            ))
          )}
        </div>
      </div>

      {/* Icon Picker Modal */}
      {showIconPicker && (
        <IconPicker
          selectedIcons={formData.thumbnail ? [formData.thumbnail] : []}
          onSelect={handleIconSelect}
          onRemove={() => handleFieldChange("thumbnail", "")}
          maxIcons={1}
          onClose={() => setShowIconPicker(false)}
          onCustomUpload={() => {
            setShowIconPicker(false);
            fileInputRef.current?.click();
          }}
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
        title="Delete Work Experience"
        message={`Are you sure you want to delete "${deleteTargetTitle}"?`}
        confirmText="Delete"
        variant="danger"
        warningMessage="The item will be moved to the recycle bin and can be restored later."
      />
    </div>
  );
}
