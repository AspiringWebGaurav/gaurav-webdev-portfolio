"use client";

import { useEffect, useState } from "react";
import { FaCheckCircle, FaEnvelope, FaTimes } from "react-icons/fa";

interface SuccessNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
}

const SuccessNotification = ({
  isOpen,
  onClose,
  userName,
}: SuccessNotificationProps) => {
  /* —————————————————  STATE  ————————————————— */
  const [count, setCount] = useState(15);
  const [pulse, setPulse] = useState(false);

  /* —————————————————  EFFECTS  ————————————————— */
  /* countdown */
  useEffect(() => {
    if (!isOpen) return;

    setCount(15);
    const id = setInterval(() => {
      setPulse(true); // make number pop
      setTimeout(() => setPulse(false), 180);
      setCount((c) => c - 1);
    }, 1_000);

    return () => clearInterval(id);
  }, [isOpen]);

  /* auto-close at 0 */
  useEffect(() => {
    if (isOpen && count === 0) onClose();
  }, [count, isOpen, onClose]);

  /* —————————————————  EARLY RETURN  ————————————————— */
  if (!isOpen) return null;

  /* —————————————————  JSX  ————————————————— */
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm px-2">
      <article className="relative isolate w-full max-w-md rounded-3xl border border-green-200 bg-gradient-to-b from-emerald-50/90 to-white/90 shadow-2xl ring-1 ring-black/5 overflow-hidden">
        {/* decorative blurred blob */}
        <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-green-300/30 blur-3xl" />

        {/* close X */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close notification"
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <FaTimes size={18} />
        </button>

        {/* content */}
        <div className="px-8 pt-12 pb-10 flex flex-col items-center text-center space-y-6">
          {/* big check */}
          <div className="flex items-center justify-center h-20 w-20 rounded-full bg-green-100 shadow-inner">
            <FaCheckCircle className="text-green-600 text-4xl" />
          </div>

          {/* headline */}
          <h2 className="text-2xl font-extrabold tracking-tight text-gray-800">
            Thank you, {userName}!<span className="ml-1.5">🎉</span>
          </h2>

          {/* body copy */}
          <p className="text-gray-700 leading-relaxed max-w-xs">
            Your message has been sent successfully. I’ll reply within
            <br />
            <span className="font-semibold">2 – 4 hours.</span>
          </p>

          {/* email note */}
          <div className="flex items-center gap-2 text-blue-600 text-sm font-medium">
            <FaEnvelope /> Check your inbox for a confirmation email
          </div>

          {/* ---- countdown ring ---- */}
          <section className="flex flex-col items-center gap-4">
            <p className="text-sm text-gray-600">Auto-closing in</p>

            <div className="relative h-28 w-28">
              {/* ring background */}
              <svg
                className="absolute inset-0 h-full w-full rotate-[-90deg]"
                viewBox="0 0 36 36"
              >
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  stroke="#E5E7EB"
                  strokeWidth="4"
                  fill="none"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  stroke="url(#grad)"
                  strokeWidth="4"
                  strokeDasharray={`${(15 - count) * (100 / 15)} 100`}
                  strokeLinecap="round"
                  fill="none"
                />
                <defs>
                  <linearGradient id="grad" x1="1" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#A855F7" />
                    <stop offset="100%" stopColor="#EC4899" />
                  </linearGradient>
                </defs>
              </svg>

              {/* number */}
              <div
                className={`absolute inset-0 flex items-center justify-center text-4xl font-bold transition-transform ${
                  pulse
                    ? "scale-125 text-purple-700"
                    : "scale-100 text-purple-600"
                }`}
              >
                {count}
              </div>
            </div>
          </section>

          {/* buttons */}
          <div className="flex w-full justify-center gap-4 pt-2">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg bg-gray-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 transition-colors"
            >
              Close now
            </button>
            <button
              onClick={() => setCount(15)}
              className="flex-1 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 transition-colors"
            >
              Keep open
            </button>
          </div>
        </div>
      </article>
    </div>
  );
};

export default SuccessNotification;
