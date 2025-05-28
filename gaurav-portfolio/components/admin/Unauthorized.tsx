"use client";

import { ShieldAlert } from "lucide-react";
import { PlaceholdersAndVanishInput } from "../ui/placeholders-and-vanish-input";
import { Button } from "../ui/MovingBorders";
import { ThreeDMarquee } from "@/components/ui/3d-marquee";
import { useRouter } from "next/navigation";
import { FlipWords } from "./../ui/flip-words";
import { HoverBorderGradient } from "./../ui/hover-border-gradient";

type Props = {
  email: string;
  setEmail: (e: string) => void;
  password: string;
  setPassword: (e: string) => void;
  handleLogin: () => void;
  error: string;
};

const Unauthorized = ({
  email,
  setEmail,
  password,
  setPassword,
  handleLogin,
  error,
}: Props) => {
  const router = useRouter();

  const emailPlaceholders = [
    "Enter admin email",
    "admin@example.com",
    "gaurav@portfolio.com",
  ];
  const passwordPlaceholders = [
    "Enter password",
    "Your secure key",
    "••••••••",
  ];

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleEmailSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  const handlePasswordSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleLogin();
  };

  const goHome = () => {
    router.push("/");
  };

  const images = [
    "https://assets.aceternity.com/cloudinary_bkp/3d-card.png",
    "https://assets.aceternity.com/animated-modal.png",
    "https://assets.aceternity.com/animated-testimonials.webp",
    "https://assets.aceternity.com/cloudinary_bkp/Tooltip_luwy44.png",
    "https://assets.aceternity.com/github-globe.png",
    "https://assets.aceternity.com/glare-card.png",
    "https://assets.aceternity.com/layout-grid.png",
    "https://assets.aceternity.com/flip-text.png",
    "https://assets.aceternity.com/hero-highlight.png",
    "https://assets.aceternity.com/carousel.webp",
    "https://assets.aceternity.com/placeholders-and-vanish-input.png",
    "https://assets.aceternity.com/shooting-stars-and-stars-background.png",
    "https://assets.aceternity.com/signup-form.png",
    "https://assets.aceternity.com/cloudinary_bkp/stars_sxle3d.png",
    "https://assets.aceternity.com/spotlight-new.webp",
    "https://assets.aceternity.com/cloudinary_bkp/Spotlight_ar5jpr.png",
    "https://assets.aceternity.com/cloudinary_bkp/Parallax_Scroll_pzlatw_anfkh7.png",
    "https://assets.aceternity.com/tabs.png",
    "https://assets.aceternity.com/cloudinary_bkp/Tracing_Beam_npujte.png",
    "https://assets.aceternity.com/cloudinary_bkp/typewriter-effect.png",
    "https://assets.aceternity.com/glowing-effect.webp",
    "https://assets.aceternity.com/hover-border-gradient.png",
    "https://assets.aceternity.com/cloudinary_bkp/Infinite_Moving_Cards_evhzur.png",
    "https://assets.aceternity.com/cloudinary_bkp/Lamp_hlq3ln.png",
    "https://assets.aceternity.com/macbook-scroll.png",
    "https://assets.aceternity.com/cloudinary_bkp/Meteors_fye3ys.png",
    "https://assets.aceternity.com/cloudinary_bkp/Moving_Border_yn78lv.png",
    "https://assets.aceternity.com/multi-step-loader.png",
    "https://assets.aceternity.com/vortex.png",
    "https://assets.aceternity.com/wobble-card.png",
    "https://assets.aceternity.com/world-map.webp",
  ];
  // Flip Words
  const words = [
    "Unauthorized",
    "Access Denied",
    "Protected",
    "are you Admin?",
  ];
  // Go Back Home Button
  const AceternityLogo = () => {
    return (
      <svg
        width="66"
        height="65"
        viewBox="0 0 66 65"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-3 w-3 text-black dark:text-black"
      >
        <path
          d="M8 8.05571C8 8.05571 54.9009 18.1782 57.8687 30.062C60.8365 41.9458 9.05432 57.4696 9.05432 57.4696"
          stroke="currentColor"
          strokeWidth="15"
          strokeMiterlimit="3.86874"
          strokeLinecap="round"
        />
      </svg>
    );
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-4 sm:px-6 py-8 sm:py-12">
      {/* 3D marquee background */}
      <div className="absolute inset-0 z-0 h-full w-full">
        <ThreeDMarquee
          className="pointer-events-none absolute inset-0 h-full w-full"
          images={images}
        />
        <div className="absolute inset-0 z-10 h-full w-full bg-black/80 dark:bg-black/40" />
      </div>

      {/* Login form */}
      <div className="relative z-20 w-full max-w-md rounded-2xl bg-white/90 backdrop-blur-md p-6 sm:p-8 text-center shadow-lg border border-gray-200">
        <div className="flex justify-center mb-4 text-blue-500">
          <ShieldAlert className="h-8 w-8 sm:h-10 sm:w-10" />
        </div>

        <div className="flex justify-center items-center px-4">
          <div className="text-4xl mx-auto font-normal text-neutral-600">
            401
            <FlipWords words={words} className="text-red" /> <br />
          </div>
        </div>

        <p className="text-gray-600 text-sm sm:text-base mb-1 mt-4">
          Oops! You don&apos;t have permission to view this page.
        </p>
        <p className="text-gray-600 text-sm sm:text-base mb-4">
          This area is restricted to <strong>Gaurav (Portfolio Owner)</strong>{" "}
        </p>

        <PlaceholdersAndVanishInput
          placeholders={emailPlaceholders}
          onChange={handleEmailChange}
          onSubmit={handleEmailSubmit}
        />

        <div className="mt-4">
          <PlaceholdersAndVanishInput
            placeholders={passwordPlaceholders}
            onChange={handlePasswordChange}
            onSubmit={handlePasswordSubmit}
          />
        </div>

        {/* <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={handleLogin}
            className="w-full sm:w-auto px-6 py-2 rounded-md border border-black bg-white text-black text-sm hover:shadow-[4px_4px_0px_0px_rgba(0,0,0)] transition duration-200"
          >
            Verify Credentials
          </button>
        </div> */}

        {error && <p className="text-red-500 mt-2 py-2 text-sm">{error}</p>}

        <div className="mt-6 flex justify-center">
          <HoverBorderGradient
            containerClassName="rounded-full"
            as="button"
            onClick={goHome}
            className=" bg-white text-black  flex items-center space-x-2 px-6 py-2 text-sm sm:text-base"
          >
            <AceternityLogo />
            <span>Go back home</span>
          </HoverBorderGradient>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
