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
    <div className="pb-12 pt-28 md:pb-16 md:pt-36 relative">
      {/* Spotlights */}
      <div className="pointer-events-none select-none">
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

      {/* Grid Pattern Background */}
      <div
        className="h-screen w-full dark:bg-black-100 bg-white dark:bg-grid-white/[0.03] bg-grid-black-100/[0.2]
       absolute top-0 left-0 flex items-center justify-center pointer-events-none"
      >
        <div
          className="absolute pointer-events-none inset-0 flex items-center justify-center dark:bg-black-100
         bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"
        />
      </div>

      <div className="flex justify-center relative my-20 z-10">
        <div className="max-w-[89vw] md:max-w-3xl lg:max-w-[64vw] flex flex-col items-center justify-center">
          {/* Eyebrow Badge Pill (Clean, centered, no green dot) */}
          <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-[#0E1328]/90 border border-white/10 text-[11px] font-mono uppercase tracking-[0.2em] text-[#C1C2D3] mb-4 shadow-xs">
            <span className="text-center">{data.eyebrow || SEED_HERO.eyebrow}</span>
          </div>

          <TextGenerateEffect
            as="h1"
            words={data.headingWords || SEED_HERO.headingWords}
            className="text-center text-[40px] md:text-5xl lg:text-6xl"
          />

          <p className="text-center md:tracking-wider mb-6 text-sm md:text-lg lg:text-xl text-white-200 max-w-2xl leading-relaxed">
            {data.description || SEED_HERO.description}
          </p>

          {/* Action CTAs - Perfectly Aligned Twin Actions */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
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
              className="relative inline-flex h-12 overflow-hidden rounded-xl p-[1.5px] border border-white/[0.18] hover:border-purple/60 transition-all duration-300 focus:outline-hidden group select-none shadow-[0_0_20px_rgba(203,172,249,0.08)] hover:shadow-[0_0_20px_rgba(203,172,249,0.2)] cursor-pointer"
            >
              <span className="inline-flex h-full w-full items-center justify-center rounded-[10px] bg-[#04071D] group-hover:bg-[#070B28] px-7 text-sm font-medium text-white backdrop-blur-3xl gap-2 transition-colors duration-200">
                <FaEnvelope className="w-3.5 h-3.5 text-purple" />
                <span>Get in Touch</span>
              </span>
            </a>
          </div>

          {/* Tech Badges / Stack Strip - Market Standards (Firebase, Firestore, Redis, etc.) */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 max-w-3xl text-[11px] font-mono text-[#C1C2D3]/80">
            <span className="px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.08] hover:border-purple/30 transition-colors">Next.js 15 &amp; React 19</span>
            <span className="px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.08] hover:border-purple/30 transition-colors">TypeScript</span>
            <span className="px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.08] hover:border-purple/30 transition-colors">Firebase &amp; Cloud Firestore</span>
            <span className="px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.08] hover:border-purple/30 transition-colors">Upstash Redis</span>
            <span className="px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.08] hover:border-purple/30 transition-colors">Rust &amp; Tauri</span>
            <span className="px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.08] hover:border-purple/30 transition-colors">PostgreSQL / SQL</span>
            <span className="px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.08] hover:border-purple/30 transition-colors">Node.js &amp; WebSockets</span>
            <span className="px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.08] hover:border-purple/30 transition-colors">Docker &amp; Cloudflare</span>
            <span className="px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.08] hover:border-purple/30 transition-colors">Mail &amp; API Automation</span>
          </div>

          {/* Dynamic Scroll-Down Indicator */}
          <motion.div
            style={{
              opacity: indicatorOpacity,
              y: indicatorY,
              scale: indicatorScale,
            }}
            className="mt-8 md:mt-10 flex flex-col items-center gap-2 cursor-pointer select-none group"
            onClick={handleScrollToAbout}
          >
            <span className="text-[10px] md:text-xs font-mono uppercase tracking-[0.25em] text-[#BEC1DD]/60 group-hover:text-purple transition-colors duration-300">
              {data.scrollText || SEED_HERO.scrollText}
            </span>
            <div className="w-5 h-8 md:w-6 md:h-9 rounded-full border border-white/20 group-hover:border-purple/50 flex justify-center items-start p-1 transition-colors duration-300">
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
              <FaChevronDown className="w-3 h-3 text-[#BEC1DD]/40 group-hover:text-purple transition-colors duration-300" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
