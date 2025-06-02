"use client";
import VisitorStatusWatcher from "@/components/VisitorStatusWatcher"; // ✅ Add this

export default function BanPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-black text-white text-center px-6">
      <VisitorStatusWatcher /> {/* ✅ Mount here too */}
      <h1 className="text-4xl font-bold mb-4">🚫 You’ve Been Banned</h1>
      <p className="text-lg text-red-400 mb-2">
        Access to this portfolio has been restricted.
      </p>
      <p className="text-sm text-gray-400">
        If you believe this was a mistake, please contact the admin.
      </p>
    </div>
  );
}
