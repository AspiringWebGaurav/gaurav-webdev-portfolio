"use client";
import React, { useRef, useState } from "react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/navigation";
import ReCAPTCHA from "react-google-recaptcha";
import { Turnstile } from "@marsidev/react-turnstile";

export function SignupFormDemo() {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submittedData, setSubmittedData] = useState<{
    firstname: string;
    lastname: string;
    email: string;
    message: string;
  } | null>(null);
  // RECAPTCHA and TURNSTILE
  const recaptchaRef = useRef<any>(null);
  const turnstileRef = useRef<any>(null);

  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const isFormFilled = () => {
    const fname = (document.getElementById("firstname") as HTMLInputElement)
      .value;
    const lname = (document.getElementById("lastname") as HTMLInputElement)
      .value;
    const email = (document.getElementById("email") as HTMLInputElement).value;
    const msg = (document.getElementById("message") as HTMLTextAreaElement)
      .value;
    return fname && lname && email && msg;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const start = Date.now();

    // Recap
    const recaptcha = recaptchaRef.current?.getValue();
    const turnstile = turnstileRef.current?.getResponse();

    if (!recaptcha || !turnstile) {
      toast.error("Please complete both CAPTCHA verifications.");
      setLoading(false);
      return;
    }

    const formData = {
      firstname: (document.getElementById("firstname") as HTMLInputElement)
        .value,
      lastname: (document.getElementById("lastname") as HTMLInputElement).value,
      email: (document.getElementById("email") as HTMLInputElement).value,
      message: (document.getElementById("message") as HTMLTextAreaElement)
        .value,
      recaptchaToken: recaptcha,
      turnstileToken: turnstile,
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
      setSubmittedData(formData);
      setShowModal(true);
    } catch (error) {
      toast.error("❌ Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditAndResend = () => {
    if (submittedData) {
      (document.getElementById("firstname") as HTMLInputElement).value =
        submittedData.firstname;
      (document.getElementById("lastname") as HTMLInputElement).value =
        submittedData.lastname;
      (document.getElementById("email") as HTMLInputElement).value =
        submittedData.email;
      (document.getElementById("message") as HTMLTextAreaElement).value =
        submittedData.message;
    }
    setShowModal(false);
  };

  const handleNewMessage = () => {
    formRef.current?.reset();
    setShowModal(false);
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

        {/* CAPTCHA Section: Visible only when form is filled */}
        {isFormFilled() && (
          <div className="mb-6 space-y-4">
            <ReCAPTCHA
              sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY as string}
              ref={recaptchaRef}
              onChange={setRecaptchaToken}
            />
            <Turnstile
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY as string}
              ref={turnstileRef}
              onSuccess={setTurnstileToken}
            />
          </div>
        )}

        {/* Submit Button Section */}
        <div className="fixed bottom-0 left-0 w-full px-4 py-4 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 sm:static sm:p-0">
          <button
            type="submit"
            disabled={loading || !recaptchaToken || !turnstileToken}
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

      {showModal && submittedData && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center animate-fade-in"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white dark:bg-black p-6 rounded-lg shadow-xl max-w-lg w-full m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold mb-4 text-center">
              🎉 Message Delivered
            </h3>
            <div className="text-sm space-y-2 bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
              <p>
                <strong>Name:</strong> {submittedData.firstname}{" "}
                {submittedData.lastname}
              </p>
              <p>
                <strong>Email:</strong> {submittedData.email}
              </p>
              <p>
                <strong>Message:</strong> {submittedData.message}
              </p>
            </div>
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              A confirmation email has been sent to{" "}
              <strong>{submittedData.email}</strong> from{" "}
              <strong>gauravbackendservices@outlook.com</strong>.
              <br />
              If it's not in your inbox, please check your spam or junk folder.
              <br />
              It includes a beautiful short overview of Gaurav’s tech,
              background & projects.
            </div>

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm font-medium">
              <button
                onClick={handleEditAndResend}
                className="bg-yellow-500 text-white py-2 px-3 rounded hover:bg-yellow-400"
              >
                ✏️ Edit & Resend
              </button>
              <button
                onClick={handleNewMessage}
                className="bg-gray-800 text-white py-2 px-3 rounded hover:bg-gray-700"
              >
                🆕 New Message
              </button>
              <button
                onClick={() => router.push("/")}
                className="bg-blue-600 text-white py-2 px-3 rounded hover:bg-blue-500"
              >
                🏠 Go to Home
              </button>
              <button
                onClick={() => router.push("/resume")}
                className="bg-purple-600 text-white py-2 px-3 rounded hover:bg-purple-500 col-span-1"
              >
                📄 View Resume
              </button>
              <button
                onClick={() => router.push("/projects")}
                className="bg-green-600 text-white py-2 px-3 rounded hover:bg-green-500 col-span-1"
              >
                💡 Explore Projects
              </button>
            </div>
          </div>
        </div>
      )}
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
