"use client";

import React, { useState, useEffect } from "react";
import { X, Send, CheckCircle, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Formik, Form, Field, ErrorMessage, FormikHelpers } from "formik";
import { useContactSubmissions } from "@/contexts/ContactSubmissionContext";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";
import TurnstileWidget from "@/components/TurnstileWidget";
import { generateDeviceFingerprint } from "@/lib/deviceFingerprint";
import { useRouter } from "next/navigation";
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

type SubmissionStatus = "idle" | "submitting" | "success" | "error";

const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "";
const TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || "";
const USER_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_USER_TEMPLATE_ID || "";
const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "";

export default function ContactPage() {
  const router = useRouter();
  const { createSubmission } = useContactSubmissions();
  const { trackEvent } = useVisitorTracking();
  const [status, setStatus] = useState<SubmissionStatus>("idle");
  const [generalError, setGeneralError] = useState<string>("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [formOpenTime, setFormOpenTime] = useState<number>(0);
  const [showTurnstile, setShowTurnstile] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);

  useEffect(() => {
    trackEvent("contact_open");
    setFormOpenTime(Date.now());
    const fp = generateDeviceFingerprint();
    setFingerprint(fp);
  }, [trackEvent]);

  const handleSubmit = async (
    values: ContactFormValues,
    { setSubmitting, resetForm }: FormikHelpers<ContactFormValues>
  ) => {
    setStatus("submitting");
    setGeneralError("");

    try {
      if (honeypot) {
        setStatus("error");
        setGeneralError("Spam detected. Submission blocked.");
        setSubmitting(false);
        return;
      }

      const timeSpent = Date.now() - formOpenTime;
      if (timeSpent < 3000) {
        setShowTurnstile(true);
        setStatus("error");
        setGeneralError("Please complete the verification.");
        setSubmitting(false);
        return;
      }

      const userAgent = navigator.userAgent;

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
        
        // Check if it's a rate limit error with cooldown info
        if (result.error?.includes("cooldown") || result.error?.includes("wait")) {
          const cooldownMatch = result.error.match(/(\d+)\s*(minute|hour|second)/i);
          if (cooldownMatch) {
            const time = parseInt(cooldownMatch[1]);
            const unit = cooldownMatch[2].toLowerCase();
            const seconds = unit.startsWith('hour') ? time * 3600 : 
                           unit.startsWith('minute') ? time * 60 : time;
            setCooldownRemaining(seconds);
            
            // Start countdown
            const interval = setInterval(() => {
              setCooldownRemaining(prev => {
                if (prev <= 1) {
                  clearInterval(interval);
                  return 0;
                }
                return prev - 1;
              });
            }, 1000);
          }
        }
        
        setGeneralError(result.error || "Failed to submit form. Please try again later.");
        setSubmitting(false);
        return;
      }

      const emailjs = (await import("@emailjs/browser")).default;

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
      }

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
      resetForm();
    } catch (error) {
      console.error("Error submitting form:", error);
      setStatus("error");
      setGeneralError("An unexpected error occurred. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatCooldownTime = (seconds: number): string => {
    if (seconds >= 3600) {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${mins}m`;
    } else if (seconds >= 60) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}m ${secs}s`;
    }
    return `${seconds}s`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="size-5" />
          <span>Back to Login</span>
        </button>

        <AnimatePresence mode="wait">
          {showSuccessModal ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center"
            >
              <div className="mb-6">
                <CheckCircle className="size-20 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Message Sent Successfully!
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Thank you for reaching out. We'll get back to you soon.
                </p>
              </div>
              <button
                onClick={() => router.push("/admin/login-demo")}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 transition-all"
              >
                Return to Login
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8"
            >
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Let's get in touch
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Have a question or want to work together? Send me a message!
                </p>
              </div>

              <Formik
                initialValues={contactFormInitialValues}
                validationSchema={contactFormSchema}
                onSubmit={handleSubmit}
              >
                {({ isSubmitting, errors, touched }) => (
                  <Form className="space-y-6">
                    {/* Honeypot Field */}
                    <input
                      type="text"
                      name="website"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                      style={{ display: "none" }}
                      tabIndex={-1}
                      autoComplete="off"
                    />

                    {/* Name Field */}
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Name
                      </label>
                      <Field
                        type="text"
                        id="name"
                        name="name"
                        placeholder="John Doe"
                        className={`w-full px-4 py-3 rounded-lg border ${
                          errors.name && touched.name
                            ? "border-red-500"
                            : "border-gray-300 dark:border-gray-600"
                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all`}
                        disabled={isSubmitting || status === "success"}
                      />
                      <ErrorMessage
                        name="name"
                        component="p"
                        className="mt-1 text-sm text-red-500"
                      />
                    </div>

                    {/* Email Field */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email
                      </label>
                      <Field
                        type="email"
                        id="email"
                        name="email"
                        placeholder="john@example.com"
                        className={`w-full px-4 py-3 rounded-lg border ${
                          errors.email && touched.email
                            ? "border-red-500"
                            : "border-gray-300 dark:border-gray-600"
                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all`}
                        disabled={isSubmitting || status === "success"}
                      />
                      <ErrorMessage
                        name="email"
                        component="p"
                        className="mt-1 text-sm text-red-500"
                      />
                    </div>

                    {/* Message Field */}
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Message
                      </label>
                      <Field
                        as="textarea"
                        id="message"
                        name="message"
                        rows={6}
                        placeholder="Your message here..."
                        className={`w-full px-4 py-3 rounded-lg border ${
                          errors.message && touched.message
                            ? "border-red-500"
                            : "border-gray-300 dark:border-gray-600"
                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none`}
                        disabled={isSubmitting || status === "success"}
                      />
                      <ErrorMessage
                        name="message"
                        component="p"
                        className="mt-1 text-sm text-red-500"
                      />
                    </div>

                    {/* Turnstile Widget */}
                    {showTurnstile && (
                      <div className="flex justify-center">
                        <TurnstileWidget
                          siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""}
                          onVerify={setTurnstileToken}
                          onError={() => setGeneralError("Verification failed. Please try again.")}
                          onExpire={() => setTurnstileToken(null)}
                        />
                      </div>
                    )}

                    {/* Error Message */}
                    {generalError && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                      >
                        <AlertCircle className="size-5 text-red-500 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-red-700 dark:text-red-400">{generalError}</p>
                          {cooldownRemaining > 0 && (
                            <p className="text-xs text-red-600 dark:text-red-500 mt-1">
                              Please wait {formatCooldownTime(cooldownRemaining)} before trying again.
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting || status === "success" || cooldownRemaining > 0}
                      className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="size-5 animate-spin" />
                          Sending...
                        </>
                      ) : cooldownRemaining > 0 ? (
                        <>Wait {formatCooldownTime(cooldownRemaining)}</>
                      ) : (
                        <>
                          <Send className="size-5" />
                          Send Message
                        </>
                      )}
                    </button>
                  </Form>
                )}
              </Formik>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
