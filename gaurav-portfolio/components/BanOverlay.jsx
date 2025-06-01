import React from "react";

export default function BanOverlay({ type }) {
  const message =
    type === "banned"
      ? "🚫 You have been banned from Gaurav!"
      : "🎉 Congrats! You have been unbanned from Gaurav!";

  const bgColor = type === "banned" ? "bg-red-900/90" : "bg-green-900/90";

  return (
    <div
      className={`fixed top-0 left-0 w-full h-full z-[9999] ${bgColor} flex items-center justify-center text-white text-center px-4 transition-opacity duration-500`}
    >
      <div className="text-3xl md:text-4xl font-bold animate-pulse max-w-xl">
        {message}
        <p className="mt-2 text-base font-medium text-white/80 animate-fade">
          Please wait while we process...
        </p>
      </div>
    </div>
  );
}
