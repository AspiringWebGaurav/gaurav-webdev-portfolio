"use client";
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { FaTimes, FaEnvelope, FaUser, FaPen, FaShieldAlt } from "react-icons/fa";
import TurnstileInline, { TurnstileInlineRef } from "./TurnstileInline";
import { ContactFormResponse } from "@/lib/types/turnstile";

interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  /* NEW → lets Footer know when to popup success notification */
  onSuccess?: (userName: string) => void;
}

const ContactModal = ({ isOpen, onClose, onSuccess }: ContactModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [turnstileError, setTurnstileError] = useState<string>("");
  
  // Turnstile ref for accessing widget methods
  const turnstileRef = useRef<TurnstileInlineRef>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>();

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    setSubmitStatus("idle");
    setTurnstileError("");

    try {
      console.log('[ContactModal] Getting Turnstile verification...');
      
      // Get Turnstile token first
      let turnstileToken: string;
      try {
        if (!turnstileRef.current) {
          throw new Error('Turnstile widget not available');
        }
        
        turnstileToken = await turnstileRef.current.getToken();
        console.log('[ContactModal] Turnstile token obtained');
      } catch (turnstileErr) {
        console.error('[ContactModal] Turnstile verification failed:', turnstileErr);
        setTurnstileError('Security verification failed. Please try again.');
        setIsSubmitting(false);
        return;
      }

      console.log('[ContactModal] Submitting contact form with verification...');
      
      // Submit to our API with Turnstile token
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formData: data,
          token: turnstileToken,
        }),
      });

      const result: ContactFormResponse = await response.json();

      if (result.success) {
        console.log('[ContactModal] Contact form submitted successfully');
        setSubmitStatus("success");
        reset();

        // Reset Turnstile widget for potential future use
        if (turnstileRef.current) {
          turnstileRef.current.reset();
        }

        /* Close modal immediately & delegate nice popup to Footer */
        if (onSuccess) {
          onClose();
          onSuccess(data.name);
        } else {
          // fallback to old auto-close
          setTimeout(() => {
            onClose();
            setSubmitStatus("idle");
          }, 3000);
        }
      } else {
        console.warn('[ContactModal] Contact form submission failed:', result.errors);
        setSubmitStatus("error");
        
        // Reset Turnstile widget on server error
        if (turnstileRef.current) {
          turnstileRef.current.reset();
        }
      }
    } catch (err) {
      console.error("Contact form submission failed:", err);
      setSubmitStatus("error");
      
      // Reset Turnstile widget on network error
      if (turnstileRef.current) {
        turnstileRef.current.reset();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Turnstile verification errors
  const handleTurnstileError = (error: string) => {
    console.warn('[ContactModal] Turnstile error:', error);
    setTurnstileError(error);
  };

  // Clear Turnstile error when user interacts with form
  const clearTurnstileError = () => {
    if (turnstileError) {
      setTurnstileError("");
    }
  };

  if (!isOpen) return null;

  /* --- THE REST OF YOUR JSX IS 100 % UNCHANGED --- */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-black-100 border border-white/[0.2] rounded-2xl p-6 sm:p-8 w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal" /* screen-reader name */
          title="Close modal" /* tooltip & backup for a11y linters */
          className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors z-10"
        >
          <FaTimes size={20} />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Let's Get in Touch
          </h2>
          <p className="text-white/60 text-sm sm:text-base">
            Send me a message and I'll get back to you soon!
          </p>
        </div>

        {submitStatus === "success" && (
          <div className="text-center py-8">
            <div className="text-green-500 text-4xl mb-4 animate-bounce">✓</div>
            <h3 className="text-white text-lg font-semibold mb-2">
              Message Sent Successfully!
            </h3>
            <p className="text-white/60 text-sm">
              Thanks for reaching out. I'll contact you soon!
            </p>
            <div className="mt-4 text-white/40 text-xs">
              This modal will close automatically...
            </div>
          </div>
        )}

        {submitStatus !== "success" && (
          /* your existing form exactly as provided */
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name Field */}
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Your Name
              </label>
              <div className="relative">
                <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  {...register("name", {
                    required: "Name is required",
                    minLength: {
                      value: 2,
                      message: "Name must be at least 2 characters",
                    },
                  })}
                  type="text"
                  placeholder="Enter your full name"
                  className="w-full pl-10 pr-4 py-3 bg-black-200 border border-white/[0.2] rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple focus:ring-1 focus:ring-purple transition-all"
                />
              </div>
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>
            {/* Email Field */}
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Email Address
              </label>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Please enter a valid email address",
                    },
                  })}
                  type="email"
                  placeholder="your.email@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-black-200 border border-white/[0.2] rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple focus:ring-1 focus:ring-purple transition-all"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>
            {/* Message Field */}
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Your Message
              </label>
              <div className="relative">
                <FaPen className="absolute left-3 top-4 text-white/40" />
                <textarea
                  {...register("message", {
                    required: "Message is required",
                    minLength: {
                      value: 10,
                      message: "Message must be at least 10 characters",
                    },
                  })}
                  rows={5}
                  placeholder="Tell me about your project or how I can help you..."
                  className="w-full pl-10 pr-4 py-3 bg-black-200 border border-white/[0.2] rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple focus:ring-1 focus:ring-purple transition-all resize-none"
                />
              </div>
              {errors.message && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.message.message}
                </p>
              )}
            </div>

            {/* Turnstile Security Verification */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-white/80 text-sm">
                <FaShieldAlt className="text-cyan-400" />
                <span>Security Verification</span>
              </div>
              <TurnstileInline
                ref={turnstileRef}
                onError={handleTurnstileError}
                onExpire={() => setTurnstileError("Verification expired. Please try again.")}
                className="w-full"
                theme="dark"
                size="normal"
              />
              {turnstileError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <p className="text-red-400 text-sm text-center">{turnstileError}</p>
                </div>
              )}
            </div>

            {/* Error State */}
            {submitStatus === "error" && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
                <p className="text-red-500 text-sm">
                  Failed to send message. Please try again or contact me
                  directly.
                </p>
              </div>
            )}
            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              onFocus={clearTurnstileError}
              className="w-full bg-gradient-to-r from-purple to-pink-500 text-white py-3 px-6 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>Verifying & Sending...</span>
                </>
              ) : (
                <>
                  <FaShieldAlt className="text-cyan-300" />
                  <FaEnvelope />
                  <span>Send&nbsp;Message</span>
                </>
              )}
            </button>
            <p className="text-white/40 text-xs text-center mt-4">
              Your information is secure and will only be used to contact you back.
              <br />
              <span className="text-cyan-400/60">Protected by security verification.</span>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default ContactModal;
