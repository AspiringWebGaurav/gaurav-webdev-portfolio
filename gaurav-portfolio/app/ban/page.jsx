"use client";
import BanOverlay from "@/components/BanOverlay";

export default function BanPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white relative">
      <div className="text-center z-10">
        <h1 className="text-4xl font-bold mb-4 text-red-500 animate-pulse">
          🚫 You Have Been Banned from Gaurav!
        </h1>
        <p className="text-lg text-gray-300 max-w-xl mx-auto">
          Access to the portfolio is temporarily restricted. Please wait for the
          admin to unban you. This screen will automatically update if your ban
          is lifted.
        </p>
      </div>
      {/* Always render overlay logic */}
      <BanOverlay type="banned" />
    </div>
  );
}
