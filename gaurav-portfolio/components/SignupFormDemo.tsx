"use client";
import React, { useRef } from "react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";

export function SignupFormDemo() {
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Form submitted");
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
      <form
        ref={formRef}
        className="pb-32 pt-6 sm:pb-6 sm:pt-6"
        onSubmit={handleSubmit}
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
      </form>

      {/* Sticky Footer Button */}
      <div className="fixed bottom-0 left-0 w-full px-4 py-4 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 sm:static sm:p-0">
        <button
          form={formRef.current ? formRef.current.id : undefined}
          type="submit"
          className="w-full bg-black text-white rounded-md py-3 font-semibold text-sm sm:text-base hover:bg-gray-800 transition"
        >
          Send Message →
        </button>
      </div>
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
