"use client";

/**
 * Enhanced Contact Form Modal with Multi-Layer Abuse Protection
 * 
 * Security Features:
 * 1. Honeypot Field - Hidden field that only bots will fill
 * 2. Form Timing - Detects if form submitted too quickly (< 3 seconds)
 * 3. Cloudflare Turnstile - CAPTCHA shown when suspicious activity detected
 * 4. Device Fingerprinting - Tracks unique device identifiers
 * 5. Spam Detection - Server-side content analysis for spam patterns
 * 6. Rate Limiting - Per email (3/day) and per IP (5/hour) limits
 * 7. Content Validation - Checks for URLs, profanity, suspicious patterns
 * 8. Email Validation - Detects temporary/disposable email addresses
 * 
 * User Experience:
 * - Auto-closes after 1.5 minutes (90 seconds)
 * - Clean, modern UI with smooth animations
 * - Non-intrusive security checks (only shows CAPTCHA when needed)
 */

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Send, CheckCircle, AlertCircle, Loader2, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Formik, Form, Field, ErrorMessage, FormikHelpers } from "formik";
import { useContactSubmissions } from "@/contexts/ContactSubmissionContext";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";
import TurnstileWidget from "@/components/TurnstileWidget";
import { generateDeviceFingerprint } from "@/lib/deviceFingerprint";
import {
  contactFormSchema,
  contactFormInitialValues,
  ContactFormValues,
} from "@/lib/validationSchemas";
import {
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
  const { trackEvent } = useVisitorTracking();
  const [status, setStatus] = useState<SubmissionStatus>("idle");
  const [generalError, setGeneralError] = useState<string>("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [emailjsLoaded, setEmailjsLoaded] = useState(false);
  const [autoCloseTimer, setAutoCloseTimer] = useState<NodeJS.Timeout | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [formOpenTime, setFormOpenTime] = useState<number>(0);
  const [showTurnstile, setShowTurnstile] = useState(false);
  const [contactOpenTracked, setContactOpenTracked] = useState(false);
  const turnstileRef = useRef<HTMLDivElement>(null);

  // Track contact form open and initialize protections - GUARANTEED DELIVERY
  useEffect(() => {
    if (isOpen && !contactOpenTracked) {
      console.log('[ContactForm] 📧 Modal opened - tracking contact_open');
      trackEvent('contact_open')
        .then(() => {
          setContactOpenTracked(true);
          console.log('[ContactForm] ✅ Contact open tracked successfully');
        })
        .catch((err) => {
          console.error('[ContactForm] Contact open tracking failed, will retry:', err);
          // Retry after 2 seconds
          setTimeout(() => {
            trackEvent('contact_open').then(() => setContactOpenTracked(true));
          }, 2000);
        });
      
      setFormOpenTime(Date.now());
      
      // Generate device fingerprint
      const fp = generateDeviceFingerprint();
      setFingerprint(fp);
    }
    
    // Reset when modal closes
    if (!isOpen) {
      setContactOpenTracked(false);
    }
  }, [isOpen, contactOpenTracked, trackEvent]);

  // EmailJS configuration
  const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "";
  const TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || "";
  const USER_TEMPLATE_ID =
    process.env.NEXT_PUBLIC_EMAILJS_USER_TEMPLATE_ID || "";
  const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "";
  
  // Turnstile configuration
  const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || "";

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
      setStatus("idle");
      setShowSuccessModal(false);
      setHoneypot("");
      setTurnstileToken(null);
      setFingerprint(null);
      setFormOpenTime(0);
      setShowTurnstile(false);
      setGeneralError("");
      // Clear auto-close timer if exists
      if (autoCloseTimer) {
        clearTimeout(autoCloseTimer);
        setAutoCloseTimer(null);
      }
    }
  }, [isOpen, autoCloseTimer]);

  // Handle form submission with Formik
  const handleSubmit = async (
    values: ContactFormValues,
    { setSubmitting, resetForm }: FormikHelpers<ContactFormValues>
  ) => {
    // Check honeypot (should be empty)
    if (honeypot && honeypot.trim().length > 0) {
      console.warn('[Security] Honeypot triggered - possible bot');
      setStatus("error");
      setGeneralError("There was an issue with your submission. Please try again.");
      setSubmitting(false);
      return;
    }
    
    // Calculate time spent on form
    const timeSpent = Date.now() - formOpenTime;
    
    // Check if submitted too quickly (less than 3 seconds = likely bot)
    if (timeSpent < 3000) {
      console.warn('[Security] Form submitted too quickly - possible bot');
      setShowTurnstile(true);
      setGeneralError("Please complete the verification below.");
      setSubmitting(false);
      return;
    }
    
    // Require Turnstile if shown and no token
    if (showTurnstile && !turnstileToken) {
      setGeneralError("Please complete the security verification.");
      setSubmitting(false);
      return;
    }

    if (!emailjsLoaded) {
      setGeneralError("Email service is still loading. Please try again in a moment.");
      setSubmitting(false);
      return;
    }

    setStatus("submitting");
    
    // Track form submission IMMEDIATELY (HIGH PRIORITY - never miss)
    console.log('[ContactForm] ✉️ Submitting form - tracking form_submit [HIGH PRIORITY]');
    trackEvent('form_submit').catch(err => {
      console.error('[ContactForm] Form submit tracking failed:', err);
      // Retry in background - don't block submission
      setTimeout(() => trackEvent('form_submit'), 1000);
    });

    try {
      // Get user agent and IP (IP will be set on server side for security)
      const userAgent = navigator.userAgent;

      // Submit to database with all protection data
      const result = await createSubmission({
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        message: values.message.trim(),
        userAgent,
        honeypot,
        timeSpent,
        turnstileToken: turnstileToken || undefined,
        fingerprint: fingerprint || undefined,
      });

      if (!result.success) {
        setStatus("error");
        setGeneralError(result.error || "Failed to submit form. Please try again later.");
        setSubmitting(false);
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
            to_email: values.email,
            to_name: values.name,
            from_name: "Gaurav Patil",
            message: values.message,
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
            from_name: values.name,
            from_email: values.email,
            message: values.message,
            to_name: "Gaurav",
          },
          PUBLIC_KEY
        );
      } catch (emailError) {
        console.error("Error sending admin notification:", emailError);
      }

      setStatus("success");
      setShowSuccessModal(true);
      resetForm(); // Reset form fields

      // Auto-close after 1.5 minutes (90 seconds) silently
      const timer = setTimeout(() => {
        onClose();
      }, 90000);
      setAutoCloseTimer(timer);
    } catch (error) {
      console.error("Error submitting form:", error);
      setStatus("error");
      setGeneralError("An unexpected error occurred. Please try again later.");
    } finally {
      setSubmitting(false);
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

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoCloseTimer) {
        clearTimeout(autoCloseTimer);
      }
    };
  }, [autoCloseTimer]);

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
                  Submitted Successfully!
                </motion.h3>
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-xs sm:text-sm text-white-200 mb-4 leading-relaxed"
                >
                  You will receive an automated email from Gaurav in the inbox you submitted. 
                  If you don&apos;t see it, please check the spam folder for{" "}
                  <span className="text-purple font-semibold">
                    gauravbackendservices
                  </span>.
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
                <Formik
                  initialValues={contactFormInitialValues}
                  validationSchema={contactFormSchema}
                  onSubmit={handleSubmit}
                  validateOnChange={true}
                  validateOnBlur={true}
                >
                  {({ isSubmitting, errors: formikErrors, touched, values }) => (
                    <Form className="p-4 sm:p-5 space-y-3">
                      {/* General Error */}
                      {generalError && (
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
                          <p className="text-xs text-red-400">{generalError}</p>
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
                        <Field name="name">
                          {({ field }: any) => (
                            <motion.input
                              {...field}
                              whileFocus={{ scale: 1.01 }}
                              transition={{ duration: 0.2 }}
                              type="text"
                              id="name"
                              disabled={isSubmitting}
                              placeholder="John Doe"
                              className={`w-full px-3 py-2 text-sm bg-black-200 border ${
                                formikErrors.name && touched.name ? "border-red-500" : "border-white/10"
                              } rounded-lg text-white placeholder-white-100 focus:outline-none focus:border-purple focus:ring-2 focus:ring-purple/20 transition-all disabled:opacity-50`}
                            />
                          )}
                        </Field>
                        <ErrorMessage name="name">
                          {(msg) => (
                            <motion.p 
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-xs text-red-400 mt-0.5"
                            >
                              {msg}
                            </motion.p>
                          )}
                        </ErrorMessage>
                      </div>

                      {/* Email Field */}
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-xs font-medium text-white mb-1"
                        >
                          Your Email *
                        </label>
                        <Field name="email">
                          {({ field }: any) => (
                            <motion.input
                              {...field}
                              whileFocus={{ scale: 1.01 }}
                              transition={{ duration: 0.2 }}
                              type="email"
                              id="email"
                              disabled={isSubmitting}
                              placeholder="john@example.com"
                              className={`w-full px-3 py-2 text-sm bg-black-200 border ${
                                formikErrors.email && touched.email ? "border-red-500" : "border-white/10"
                              } rounded-lg text-white placeholder-white-100 focus:outline-none focus:border-purple focus:ring-2 focus:ring-purple/20 transition-all disabled:opacity-50`}
                            />
                          )}
                        </Field>
                        <ErrorMessage name="email">
                          {(msg) => (
                            <motion.p 
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-xs text-red-400 mt-0.5"
                            >
                              {msg}
                            </motion.p>
                          )}
                        </ErrorMessage>
                      </div>

                      {/* Message Field */}
                      <div>
                        <label
                          htmlFor="message"
                          className="block text-xs font-medium text-white mb-1"
                        >
                          Your Message *
                        </label>
                        <Field name="message">
                          {({ field }: any) => (
                            <motion.textarea
                              {...field}
                              whileFocus={{ scale: 1.01 }}
                              transition={{ duration: 0.2 }}
                              id="message"
                              disabled={isSubmitting}
                              rows={3}
                              placeholder="Tell me about your project or idea..."
                              className={`w-full px-3 py-2 text-sm bg-black-200 border ${
                                formikErrors.message && touched.message ? "border-red-500" : "border-white/10"
                              } rounded-lg text-white placeholder-white-100 focus:outline-none focus:border-purple focus:ring-2 focus:ring-purple/20 transition-all resize-none disabled:opacity-50`}
                            />
                          )}
                        </Field>
                        <ErrorMessage name="message">
                          {(msg) => (
                            <motion.p 
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-xs text-red-400 mt-0.5"
                            >
                              {msg}
                            </motion.p>
                          )}
                        </ErrorMessage>
                        <div className="flex justify-between items-center mt-0.5">
                          <p className="text-xs text-white-100">
                            {values.message.length}/{MAX_MESSAGE_LENGTH}
                          </p>
                        </div>
                      </div>

                      {/* Honeypot Field - Hidden from users, visible to bots */}
                      <div className="hidden" aria-hidden="true">
                        <label htmlFor="website">Website (leave empty)</label>
                        <input
                          type="text"
                          id="website"
                          name="website"
                          value={honeypot}
                          onChange={(e) => setHoneypot(e.target.value)}
                          tabIndex={-1}
                          autoComplete="off"
                        />
                      </div>

                      {/* Turnstile Widget - Shown when suspicious activity detected */}
                  {showTurnstile && TURNSTILE_SITE_KEY && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="flex flex-col items-center gap-2 p-3 bg-purple/10 border border-purple/20 rounded-lg"
                    >
                      <div className="flex items-center gap-2 text-xs text-white-200">
                        <Shield className="w-4 h-4 text-purple" />
                        <span>Security verification required</span>
                      </div>
                      <div ref={turnstileRef}>
                        <TurnstileWidget
                          siteKey={TURNSTILE_SITE_KEY}
                          onVerify={(token) => {
                            setTurnstileToken(token);
                            setGeneralError("");
                          }}
                          onError={(error) => {
                            console.error('[Turnstile] Error:', error);
                            setGeneralError("Verification failed. Please refresh and try again.");
                          }}
                          theme="dark"
                          size="normal"
                        />
                      </div>
                    </motion.div>
                  )}

                      {/* Submit Button */}
                      <motion.button
                        type="submit"
                        disabled={isSubmitting}
                        whileHover={!isSubmitting ? { scale: 1.02 } : {}}
                        whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                        className="w-full px-4 py-2.5 text-sm bg-purple hover:bg-purple/80 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-purple/30"
                      >
                        {isSubmitting ? (
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
                    </Form>
                  )}
                </Formik>
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
