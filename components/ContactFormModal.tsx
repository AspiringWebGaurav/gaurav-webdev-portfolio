"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useContactSubmissions } from "@/contexts/ContactSubmissionContext";
import { useInteractionTracking } from "@/lib/useVisitorTracking";
import {
  validateContactSubmission,
  MIN_NAME_LENGTH,
  MAX_NAME_LENGTH,
  MIN_MESSAGE_LENGTH,
  MAX_MESSAGE_LENGTH,
} from "@/types/contactSubmission";

interface ContactFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SubmissionStatus = "idle" | "submitting" | "success" | "error";

export default function ContactFormModal({
  isOpen,
  onClose,
}: ContactFormModalProps) {
  const { createSubmission } = useContactSubmissions();
  const { trackContactOpen, trackFormSubmit } = useInteractionTracking();
  const [status, setStatus] = useState<SubmissionStatus>("idle");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [emailjsLoaded, setEmailjsLoaded] = useState(false);

  // Track contact form open
  useEffect(() => {
    if (isOpen) {
      trackContactOpen();
    }
  }, [isOpen, trackContactOpen]);

  // EmailJS configuration
  const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "";
  const TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || "";
  const USER_TEMPLATE_ID =
    process.env.NEXT_PUBLIC_EMAILJS_USER_TEMPLATE_ID || "";
  const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "";

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize EmailJS only on client side
  useEffect(() => {
    if (mounted && PUBLIC_KEY && !emailjsLoaded) {
      import("@emailjs/browser").then((emailjs) => {
        emailjs.default.init(PUBLIC_KEY);
        setEmailjsLoaded(true);
      });
    }
  }, [mounted, PUBLIC_KEY, emailjsLoaded]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({ name: "", email: "", message: "" });
      setErrors({});
      setStatus("idle");
      setShowSuccessModal(false);
    }
  }, [isOpen]);

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Validate form
  const validateForm = () => {
    const validationErrors = validateContactSubmission(formData);
    const errorMap: Record<string, string> = {};
    validationErrors.forEach((err) => {
      errorMap[err.field] = err.message;
    });
    setErrors(errorMap);
    return validationErrors.length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!emailjsLoaded) {
      setErrors({
        general: "Email service is still loading. Please try again in a moment.",
      });
      return;
    }

    setStatus("submitting");
    trackFormSubmit(); // Track form submission

    try {
      // Get user agent and IP (IP will be set on server side for security)
      const userAgent = navigator.userAgent;

      // Submit to database
      const result = await createSubmission({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        message: formData.message.trim(),
        userAgent,
      });

      if (!result.success) {
        setStatus("error");
        setErrors({
          general:
            result.error || "Failed to submit form. Please try again later.",
        });
        return;
      }

      // Dynamically import emailjs for sending emails
      const emailjs = (await import("@emailjs/browser")).default;

      // Send confirmation email to user via EmailJS
      try {
        await emailjs.send(
          SERVICE_ID,
          USER_TEMPLATE_ID,
          {
            to_email: formData.email,
            to_name: formData.name,
            from_name: "Gaurav Patil",
            message: formData.message,
          },
          PUBLIC_KEY
        );
      } catch (emailError) {
        console.error("Error sending confirmation email:", emailError);
        // Don't fail the submission if email fails
      }

      // Send notification to admin via EmailJS
      try {
        await emailjs.send(
          SERVICE_ID,
          TEMPLATE_ID,
          {
            from_name: formData.name,
            from_email: formData.email,
            message: formData.message,
            to_name: "Gaurav",
          },
          PUBLIC_KEY
        );
      } catch (emailError) {
        console.error("Error sending admin notification:", emailError);
      }

      setStatus("success");
      setShowSuccessModal(true);

      // Auto-close after 5 seconds
      setTimeout(() => {
        onClose();
      }, 5000);
    } catch (error) {
      console.error("Error submitting form:", error);
      setStatus("error");
      setErrors({
        general: "An unexpected error occurred. Please try again later.",
      });
    }
  };

  // Auto-close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && status !== "submitting") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose, status]);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4" style={{ isolation: 'isolate' }}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.3 }}
            onClick={() => status !== "submitting" && onClose()}
            className="absolute inset-0 bg-black/90"
            style={{ zIndex: 1 }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ 
              type: "spring", 
              damping: 20, 
              stiffness: 260,
              mass: 0.8
            }}
            className="relative w-full max-w-lg bg-black-100 border border-white/10 rounded-xl sm:rounded-2xl shadow-2xl"
            style={{ zIndex: 2 }}
          >
            {/* Submitting Overlay */}
            <AnimatePresence>
              {status === "submitting" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black-100/80 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center z-50"
                >
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col items-center gap-3 p-6"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      className="relative"
                    >
                      <div className="w-16 h-16 border-4 border-purple/30 border-t-purple rounded-full" />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 border-4 border-transparent border-t-purple/50 rounded-full"
                      />
                    </motion.div>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-sm sm:text-base text-white font-medium"
                    >
                      Sending your message...
                    </motion.p>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-xs text-white-200"
                    >
                      Please wait
                    </motion.p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success State */}
            {showSuccessModal ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="p-5 sm:p-6 text-center"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ 
                    type: "spring", 
                    damping: 12, 
                    stiffness: 200,
                    delay: 0.1
                  }}
                  className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500/30 to-green-500/10 rounded-full mb-4 ring-4 ring-green-500/20"
                >
                  <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 text-green-500" />
                </motion.div>
                <motion.h3 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-lg sm:text-xl font-bold text-white mb-2"
                >
                  Message Sent Successfully!
                </motion.h3>
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-xs sm:text-sm text-white-200 mb-2"
                >
                  Thank you for reaching out. I&apos;ve received your message
                  and will get back to you soon.
                </motion.p>
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-xs text-white-100 mb-4"
                >
                  Please check your email inbox for a confirmation message from{" "}
                  <span className="text-purple font-semibold">
                    gauravbackendservices
                  </span>
                  . If you don&apos;t see it, please check your spam folder.
                </motion.p>
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="px-5 py-2 text-sm bg-purple hover:bg-purple/80 text-white rounded-lg transition-colors shadow-lg shadow-purple/30"
                >
                  Close
                </motion.button>
              </motion.div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white">
                      Let&apos;s Get in Touch
                    </h2>
                    <p className="text-xs text-white-200 mt-0.5">
                      I&apos;d love to hear from you!
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    disabled={status === "submitting"}
                    className="p-1.5 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
                    aria-label="Close contact form"
                    title="Close"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5 text-white-200" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3">
                  {/* General Error */}
                  {errors.general && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ type: "spring", damping: 20, stiffness: 300 }}
                      className="flex items-start gap-2 p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg"
                    >
                      <motion.div
                        initial={{ rotate: -180, scale: 0 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={{ delay: 0.1, type: "spring", damping: 15 }}
                      >
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      </motion.div>
                      <p className="text-xs text-red-400">{errors.general}</p>
                    </motion.div>
                  )}

                  {/* Name Field */}
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-xs font-medium text-white mb-1"
                    >
                      Your Name *
                    </label>
                    <motion.input
                      whileFocus={{ scale: 1.01 }}
                      transition={{ duration: 0.2 }}
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={status === "submitting"}
                      placeholder="John Doe"
                      className={`w-full px-3 py-2 text-sm bg-black-200 border ${
                        errors.name ? "border-red-500" : "border-white/10"
                      } rounded-lg text-white placeholder-white-100 focus:outline-none focus:border-purple focus:ring-2 focus:ring-purple/20 transition-all disabled:opacity-50`}
                    />
                    {errors.name && (
                      <motion.p 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-red-400 mt-0.5"
                      >
                        {errors.name}
                      </motion.p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-xs font-medium text-white mb-1"
                    >
                      Your Email *
                    </label>
                    <motion.input
                      whileFocus={{ scale: 1.01 }}
                      transition={{ duration: 0.2 }}
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={status === "submitting"}
                      placeholder="john@example.com"
                      className={`w-full px-3 py-2 text-sm bg-black-200 border ${
                        errors.email ? "border-red-500" : "border-white/10"
                      } rounded-lg text-white placeholder-white-100 focus:outline-none focus:border-purple focus:ring-2 focus:ring-purple/20 transition-all disabled:opacity-50`}
                    />
                    {errors.email && (
                      <motion.p 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-red-400 mt-0.5"
                      >
                        {errors.email}
                      </motion.p>
                    )}
                  </div>

                  {/* Message Field */}
                  <div>
                    <label
                      htmlFor="message"
                      className="block text-xs font-medium text-white mb-1"
                    >
                      Your Message *
                    </label>
                    <motion.textarea
                      whileFocus={{ scale: 1.01 }}
                      transition={{ duration: 0.2 }}
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      disabled={status === "submitting"}
                      rows={3}
                      placeholder="Tell me about your project or idea..."
                      className={`w-full px-3 py-2 text-sm bg-black-200 border ${
                        errors.message ? "border-red-500" : "border-white/10"
                      } rounded-lg text-white placeholder-white-100 focus:outline-none focus:border-purple focus:ring-2 focus:ring-purple/20 transition-all resize-none disabled:opacity-50`}
                    />
                    {errors.message && (
                      <motion.p 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-red-400 mt-0.5"
                      >
                        {errors.message}
                      </motion.p>
                    )}
                    <div className="flex justify-between items-center mt-0.5">
                      <p className="text-xs text-white-100">
                        {formData.message.length}/{MAX_MESSAGE_LENGTH}
                      </p>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={status === "submitting"}
                    whileHover={status !== "submitting" ? { scale: 1.02 } : {}}
                    whileTap={status !== "submitting" ? { scale: 0.98 } : {}}
                    className="w-full px-4 py-2.5 text-sm bg-purple hover:bg-purple/80 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-purple/30"
                  >
                    {status === "submitting" ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ 
                            duration: 1, 
                            repeat: Infinity, 
                            ease: "linear" 
                          }}
                        >
                          <Loader2 className="w-4 h-4" />
                        </motion.div>
                        <motion.span
                          initial={{ opacity: 0.6 }}
                          animate={{ opacity: [0.6, 1, 0.6] }}
                          transition={{ 
                            duration: 1.5, 
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        >
                          Sending...
                        </motion.span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Message
                      </>
                    )}
                  </motion.button>

                  {/* Privacy Notice */}
                  <p className="text-xs text-center text-white-100">
                    By submitting this form, you agree to receive email
                    communications from me regarding your inquiry.
                  </p>
                </form>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  // Use portal to render at document body level
  return mounted ? createPortal(modalContent, document.body) : null;
}
