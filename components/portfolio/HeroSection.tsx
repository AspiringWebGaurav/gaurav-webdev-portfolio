"use client";

import { FaLocationArrow, FaChevronDown, FaEnvelope } from "react-icons/fa6";
import { motion, useScroll, useTransform } from "motion/react";

import MagicButton from "@/components/ui/MagicButton";
import { Spotlight } from "@/components/ui/Spotlight";
import { TextGenerateEffect } from "@/components/ui/TextGenerateEffect";
import type { HeroDocument } from "@/types/portfolio";
import { SEED_HERO } from "@/lib/dal/repositories/seed-data";

interface HeroSectionProps {
  data?: HeroDocument;
}

export const HeroSection = ({ data = SEED_HERO }: HeroSectionProps) => {
  const { scrollY } = useScroll();
  const indicatorOpacity = useTransform(scrollY, [0, 100], [1, 0]);
  const indicatorY = useTransform(scrollY, [0, 100], [0, 20]);
  const indicatorScale = useTransform(scrollY, [0, 100], [1, 0.9]);

  const handleScrollTo = (targetId: string, link: string) => {
    window.dispatchEvent(
      new CustomEvent("nav-scroll-start", {
        detail: { link },
      })
    );
    document
      .getElementById(targetId)
      ?.scrollIntoView({ behavior: "smooth" });
    window.history.replaceState(null, "", link);
  };

  const handleScrollToAbout = () => {
    handleScrollTo("about", "/about");
  };

  return (
    <div className="min-h-screen min-h-[100dvh] w-full flex flex-col justify-center items-center relative pt-20 sm:pt-24 pb-10 sm:pb-14">
      {/* Spotlights (Dark Mode: Lightweight radial ambient on mobile, high-fidelity SVGs on sm+) */}
      <div className="pointer-events-none select-none hidden dark:block">
        <div className="block sm:hidden absolute top-0 inset-x-0 h-[60vh] bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.18),transparent_70%)] pointer-events-none" />
        <div className="hidden sm:block">
          <Spotlight
            className="-top-40 -left-10 md:-left-32 md:-top-20 h-screen"
            fill="white"
          />
          <Spotlight
            className="h-[80vh] w-[50vw] top-10 left-full"
            fill="purple"
          />
          <Spotlight className="left-80 top-28 h-[80vh] w-[50vw]" fill="blue" />
        </div>
      </div>

      {/* Grid Pattern Background */}
      <div
        className="h-full w-full dark:bg-black-100 bg-[#FAFAFA] dark:bg-grid-white/[0.03] bg-[radial-gradient(#CBD5E1_1px,transparent_1px)] [background-size:24px_24px]
       absolute inset-0 flex items-center justify-center pointer-events-none transition-colors duration-200"
      >
        <div
          className="absolute pointer-events-none inset-0 flex items-center justify-center dark:bg-black-100
         bg-[#FAFAFA] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] transition-colors duration-200"
        />
      </div>

      <div className="flex justify-center relative z-10 w-full my-auto py-4 sm:py-6">
        <div className="max-w-[89vw] md:max-w-5xl lg:max-w-[920px] flex flex-col items-center justify-center">
          {/* Eyebrow Badge Pill (Clean, centered, subtle mono hierarchy) */}
          <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-purple-50/80 dark:bg-white/[0.04] border border-purple-200/60 dark:border-white/10 text-[11px] font-mono uppercase tracking-[0.22em] text-[#7C3AED] dark:text-[#C1C2D3] mb-4 sm:mb-5 shadow-xs backdrop-blur-md transition-colors duration-200">
            <span className="text-center">{data.eyebrow || SEED_HERO.eyebrow}</span>
          </div>

          <TextGenerateEffect
            as="h1"
            words={data.headingWords || SEED_HERO.headingWords}
            className="text-center text-[34px] sm:text-[42px] md:text-5xl lg:text-6xl tracking-tight"
          />

          <p className="text-center mt-2 sm:mt-3 mb-7 sm:mb-8 text-sm sm:text-base md:text-lg lg:text-[19px] text-slate-600 dark:text-[#C1C2D3] max-w-4xl lg:max-w-[920px] leading-relaxed tracking-normal transition-colors duration-200">
            I&apos;m{" "}
            <span className="text-slate-900 dark:text-white font-semibold">Gaurav Patil</span> &mdash; a{" "}
            <span className="text-[#7C3AED] dark:text-purple/90 font-medium">Full Stack Software Engineer &amp; Systems Developer</span>, building high&#8209;throughput web architectures,<br className="hidden md:inline" />{" "}
            native Rust &amp; Tauri desktop applications, and scalable cloud backends<br className="hidden md:inline" />{" "}
            with Next.js, Firebase/Firestore, and Redis.
          </p>

          {/* Action CTAs - Perfectly Aligned Twin Actions */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href={data.ctaLink || SEED_HERO.ctaLink}
              onClick={(e) => {
                const link = data.ctaLink || SEED_HERO.ctaLink;
                if (link.startsWith("#")) {
                  e.preventDefault();
                  const targetId = link.replace("#", "");
                  handleScrollTo(targetId, link);
                }
              }}
              className="inline-flex items-center"
            >
              <MagicButton
                title={data.ctaTitle || SEED_HERO.ctaTitle}
                icon={<FaLocationArrow />}
                position="right"
                containerClasses="m-0 md:mt-0 w-auto"
              />
            </a>

            <a
              href="#contact"
              onClick={(e) => {
                e.preventDefault();
                handleScrollTo("contact", "/#contact");
              }}
              className="relative inline-flex h-12 overflow-hidden rounded-xl p-[1.5px] border border-slate-300 dark:border-white/[0.18] hover:border-purple/60 transition-all duration-300 focus:outline-hidden group select-none shadow-[0_4px_16px_rgba(0,0,0,0.04)] dark:shadow-[0_0_20px_rgba(203,172,249,0.08)] hover:shadow-[0_4px_20px_rgba(124,58,237,0.12)] cursor-pointer"
            >
              <span className="inline-flex h-full w-full items-center justify-center rounded-[10px] bg-white dark:bg-[#04071D] group-hover:bg-slate-50 dark:group-hover:bg-[#070B28] px-7 text-sm font-medium text-slate-800 dark:text-white backdrop-blur-3xl gap-2 transition-colors duration-200">
                <FaEnvelope className="w-3.5 h-3.5 text-[#7C3AED] dark:text-purple" />
                <span>Get in Touch</span>
              </span>
            </a>
          </div>

          {/* Dynamic Scroll-Down Indicator (Placed directly below CTAs with a balanced, cohesive gap) */}
          <motion.div
            style={{
              opacity: indicatorOpacity,
              y: indicatorY,
              scale: indicatorScale,
            }}
            className="mt-8 sm:mt-10 md:mt-12 flex flex-col items-center gap-2 cursor-pointer select-none group"
            onClick={handleScrollToAbout}
          >
            <span className="text-[10px] md:text-xs font-mono uppercase tracking-[0.25em] text-slate-500 dark:text-[#BEC1DD]/60 group-hover:text-purple transition-colors duration-300">
              {data.scrollText || SEED_HERO.scrollText}
            </span>
            <div className="w-5 h-8 md:w-6 md:h-9 rounded-full border border-slate-300 dark:border-white/20 group-hover:border-purple/50 flex justify-center items-start p-1 transition-colors duration-300">
              <motion.div
                animate={{
                  y: [0, 8, 0],
                  opacity: [0.8, 0.2, 0.8],
                }}
                transition={{
                  duration: 1.6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-purple"
              />
            </div>
            <motion.div
              animate={{
                y: [0, 3, 0],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <FaChevronDown className="w-3 h-3 text-slate-400 dark:text-[#BEC1DD]/40 group-hover:text-purple transition-colors duration-300" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
