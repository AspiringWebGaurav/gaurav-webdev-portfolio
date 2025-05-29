// components/Loader.tsx
import React from "react";
import { TypewriterEffectSmooth } from "./ui/typewriter-effect";

const Loader: React.FC = () => {
  const words = [
    {
      text: "Transforming",
    },
    {
      text: "ideas",
    },
    {
      text: "into",
    },
    {
      text: "seamless",
    },
    {
      text: "UX",
      className: "text-blue-500 dark:text-blue-500",
    },
  ];
  return (
    <div className="h-screen w-screen bg-black/40 backdrop-blur-2xl flex flex-col items-center justify-center relative overflow-hidden">
      {/* Twinkle Star Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle,#7c3aed_1px,transparent_1px)] [background-size:20px_20px] opacity-10 animate-pulse" />

      {/* Orbit and Planet Container */}
      <div className="relative flex items-center justify-center w-32 h-32 z-10">
        {/* Orbit Ring */}
        <div className="absolute w-full h-full border-[1.5px] border-purple-600 rounded-full animate-orbitpulse opacity-70 shadow-[0_0_30px_#7c3aed]" />

        {/* Glowing Planet */}
        <div className="w-16 h-16 rounded-full shadow-[0_0_60px_rgba(139,92,246,0.8)] animate-colorpulse z-10" />
      </div>
      {/* Words below Loader */}
      {/* <div className="mt-4">
        <TypewriterEffectSmooth words={words} />
      </div> */}
    </div>
  );
};

export default Loader;
