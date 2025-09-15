"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import emailjs from "@emailjs/browser";
import { FaTimes, FaEnvelope, FaUser, FaPen } from "react-icons/fa";

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

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>();

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      // --- emailjs calls (unchanged) ---
      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
        {
          from_name: data.name,
          from_email: data.email,
          message: data.message,
          to_email: "your-email@gmail.com",
        },
        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
      );

      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
        process.env.NEXT_PUBLIC_EMAILJS_USER_TEMPLATE_ID!,
        {
          to_name: data.name,
          to_email: data.email,
          from_name: "Gaurav Patil",
        },
        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
      );

      setSubmitStatus("success");
      reset();

      /* NEW → close modal immediately & delegate nice popup to Footer */
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
    } catch (err) {
      console.error("Email send failed:", err);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
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
              className="w-full bg-gradient-to-r from-purple to-pink-500 text-white py-3 px-6 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>Sending&nbsp;Message...</span>
                </>
              ) : (
                <>
                  <FaEnvelope />
                  <span>Send&nbsp;Message</span>
                </>
              )}
            </button>
            <p className="text-white/40 text-xs text-center mt-4">
              Your information is secure and will only be used to contact you
              back.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default ContactModal;
