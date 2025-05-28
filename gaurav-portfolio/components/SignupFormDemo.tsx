"use client";
import React, { useRef, useState, useEffect } from "react";
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
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [turnstilePassed, setTurnstilePassed] = useState(false);
  const [recaptchaPassed, setRecaptchaPassed] = useState(false);
  const [captchaKey, setCaptchaKey] = useState(0);

  const isFormFilled = () => {
    const fnameInput = document.getElementById(
      "firstname"
    ) as HTMLInputElement | null;
    const lnameInput = document.getElementById(
      "lastname"
    ) as HTMLInputElement | null;
    const emailInput = document.getElementById(
      "email"
    ) as HTMLInputElement | null;
    const msgInput = document.getElementById(
      "message"
    ) as HTMLTextAreaElement | null;

    return (
      fnameInput?.value.trim() &&
      lnameInput?.value.trim() &&
      emailInput?.value.trim() &&
      msgInput?.value.trim()
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    if (!recaptchaToken || !turnstileToken) {
      toast.error("CAPTCHA may not be ready. Please wait or refresh it.");
      setRecaptchaPassed(false);
      setTurnstilePassed(false);
      setCaptchaKey((k) => k + 1); // force re-render both
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
      recaptchaToken, // ✅ use current state
      turnstileToken, // ✅ use current state
    };

    const start = Date.now();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // ⏱️ 10s timeout

      const res = await fetch("/api/send-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        signal: controller.signal,
      });

      clearTimeout(timeout); // 🧹 Clear timeout once fetch completes

      const timeTaken = Date.now() - start;
      const delay = Math.max(0, 3000 - timeTaken);
      await new Promise((resolve) => setTimeout(resolve, delay));

      if (!res.ok) {
        const errorRes = await res.json();
        throw new Error(errorRes.message || "Failed to send message");
      }

      toast.success("✅ Message sent successfully!");
      setSubmittedData(formData);
      setShowModal(true);
      formRef.current?.reset();
      setCaptchaKey((prev) => prev + 1);
      setRecaptchaToken(null);
      setTurnstileToken(null);
      setRecaptchaPassed(false);
      setTurnstilePassed(false);
    } catch (error: any) {
      if (error.name === "AbortError") {
        toast.error("⏱️ Request timed out. Please try again.");
      } else {
        toast.error("❌ Failed to send message. " + error.message);
      }
      setCaptchaKey((prev) => prev + 1);
      setRecaptchaToken(null);
      setTurnstileToken(null);
      setRecaptchaPassed(false);
      setTurnstilePassed(false);
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
  useEffect(() => {
    const checkForm = () => {
      const fnameInput = document.getElementById(
        "firstname"
      ) as HTMLInputElement | null;
      const lnameInput = document.getElementById(
        "lastname"
      ) as HTMLInputElement | null;
      const emailInput = document.getElementById(
        "email"
      ) as HTMLInputElement | null;
      const msgInput = document.getElementById(
        "message"
      ) as HTMLTextAreaElement | null;

      const isFilled =
        fnameInput?.value.trim() &&
        lnameInput?.value.trim() &&
        emailInput?.value.trim() &&
        msgInput?.value.trim();

      setShowCaptcha(!!isFilled);
    };

    document.getElementById("firstname")?.addEventListener("input", checkForm);
    document.getElementById("lastname")?.addEventListener("input", checkForm);
    document.getElementById("email")?.addEventListener("input", checkForm);
    document.getElementById("message")?.addEventListener("input", checkForm);

    return () => {
      document
        .getElementById("firstname")
        ?.removeEventListener("input", checkForm);
      document
        .getElementById("lastname")
        ?.removeEventListener("input", checkForm);
      document.getElementById("email")?.removeEventListener("input", checkForm);
      document
        .getElementById("message")
        ?.removeEventListener("input", checkForm);
    };
  }, []);
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
        {showCaptcha && (
          <div className="mb-6 flex justify-center">
            {!turnstilePassed ? (
              <div className="w-full sm:w-[280px] h-[78px] flex justify-center items-center border border-gray-700 rounded-md bg-white dark:bg-black">
                <Turnstile
                  key={`turnstile-${captchaKey}`} // ✅ ensures fresh reload
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY as string}
                  ref={turnstileRef}
                  onSuccess={(token) => {
                    setTurnstileToken(token);
                    setTurnstilePassed(true);
                  }}
                />
              </div>
            ) : !recaptchaPassed ? (
              <div className="w-full sm:w-[280px] h-[78px] flex justify-center items-center border border-gray-700 rounded-md bg-white dark:bg-black">
                <ReCAPTCHA
                  key={`recaptcha-${captchaKey}`} // ✅ ensures fresh reload
                  sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY as string}
                  ref={recaptchaRef}
                  onChange={(token) => {
                    setRecaptchaToken(token);
                    setRecaptchaPassed(true);
                  }}
                />
              </div>
            ) : null}
          </div>
        )}

        {/* Submit Button Section */}
        {(!showCaptcha || (turnstilePassed && recaptchaPassed)) && (
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
        )}
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
