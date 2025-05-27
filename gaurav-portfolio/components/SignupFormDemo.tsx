"use client";
import React, { useRef, useState } from "react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export function SignupFormDemo() {
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const start = Date.now();

    const formData = {
      firstname: (document.getElementById("firstname") as HTMLInputElement)
        .value,
      lastname: (document.getElementById("lastname") as HTMLInputElement).value,
      email: (document.getElementById("email") as HTMLInputElement).value,
      message: (document.getElementById("message") as HTMLTextAreaElement)
        .value,
    };

    try {
      const res = await fetch(
        "https://portfoliomailsender.onrender.com/send-contact",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      const timeTaken = Date.now() - start;
      const delay = Math.max(0, 3000 - timeTaken);
      await new Promise((resolve) => setTimeout(resolve, delay));

      if (!res.ok) throw new Error("Failed to send message");

      toast.success("✅ Message sent successfully!");
      formRef.current?.reset();
    } catch (error) {
      toast.error("❌ Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
      <ToastContainer position="top-center" />
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="pb-32 pt-6 sm:pb-6 sm:pt-6"
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">
          Contact Form
        </h2>
        <p className="text-sm sm:text-base text-center mb-6 text-gray-400">
          Feel free to reach out — I'll get back to you as soon as possible.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <LabelInputContainer>
            <Label htmlFor="firstname">First name</Label>
            <Input id="firstname" placeholder="John" type="text" required />
          </LabelInputContainer>
          <LabelInputContainer>
            <Label htmlFor="lastname">Last name</Label>
            <Input id="lastname" placeholder="Doe" type="text" required />
          </LabelInputContainer>
        </div>

        <LabelInputContainer className="mb-4">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            placeholder="you@example.com"
            type="email"
            required
          />
        </LabelInputContainer>

        <LabelInputContainer className="mb-6">
          <Label htmlFor="message">Message</Label>
          <textarea
            id="message"
            placeholder="Write your message here..."
            rows={5}
            required
            className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm sm:text-base dark:bg-black dark:border-gray-700 dark:text-white"
          />
        </LabelInputContainer>

        {/* Sticky Footer Button */}
        <div className="fixed bottom-0 left-0 w-full px-4 py-4 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 sm:static sm:p-0">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white rounded-md py-3 font-semibold text-sm sm:text-base hover:bg-gray-800 transition flex items-center justify-center"
          >
            {loading ? (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              "Send Message →"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex w-full flex-col space-y-2", className)}>
      {children}
    </div>
  );
};

export default SignupFormDemo; 
