"use client";
import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { IoCopyOutline } from "react-icons/io5";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

import { cn } from "@/lib/utils";

import { BackgroundGradientAnimation } from "./GradientBg";
import GridGlobe from "./GridGlobe";
import animationData from "@/data/confetti.json";
import MagicButton from "./MagicButton";
import type { BentoCardType, BentoGridSpanVariant, BentoVisualLayout } from "@/types/portfolio";

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-6 lg:grid-cols-5 md:grid-row-7 gap-4 lg:gap-8 mx-auto",
        className
      )}
    >
      {children}
    </div>
  );
};

export interface BentoGridItemProps {
  className?: string;
  id: number | string;
  slotIndex?: number;
  cardType?: BentoCardType;
  gridSpanVariant?: BentoGridSpanVariant;
  visualLayout?: BentoVisualLayout;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  img?: string;
  imgClassName?: string;
  titleClassName?: string;
  spareImg?: string;
  techStackLeft?: string[];
  techStackRight?: string[];
  ctaEmail?: string;
}

export const BentoGridItem = ({
  className,
  id,
  slotIndex,
  cardType,
  title,
  description,
  img,
  imgClassName,
  titleClassName,
  spareImg,
  techStackLeft = ["ReactJS", "Express", "Typescript"],
  techStackRight = ["VueJS", "NuxtJS", "GraphQL"],
  ctaEmail = "hello@gauravpatil.site",
}: BentoGridItemProps) => {
  const numericId = typeof id === "number" ? id : slotIndex || parseInt(String(id).replace(/\D/g, ""), 10) || 1;
  const isType = (type: BentoCardType, fallbackId: number) => cardType === type || numericId === fallbackId;

  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleCopy = async () => {
    const text = ctaEmail || "hello@gauravpatil.site";
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, 3000);
    } catch (err) {
      console.error("Failed to copy email:", err);
    }
  };

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className={cn(
        "row-span-1 relative overflow-hidden rounded-3xl border border-slate-200/90 dark:border-white/[0.1] bg-white dark:bg-[#04071D] text-slate-900 dark:text-white group/bento hover:shadow-xl transition-all duration-200 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_24px_rgba(0,0,0,0.03)] dark:shadow-none justify-between flex flex-col space-y-4",
        className
      )}
    >
      <div className={`${isType("contact_cta", 6) && "flex justify-center"} h-full`}>
        <div className="w-full h-full absolute">
          {img && (
            <>
              {isType("collaboration", 1) ? (
                <>
                  {/* Separate image optimized for white/light theme */}
                  <img
                    src="/b1-light.webp"
                    alt={typeof title === "string" ? title : "Collaboration preview"}
                    loading="lazy"
                    decoding="async"
                    className={cn(
                      imgClassName,
                      "object-cover object-center w-full h-full block dark:hidden"
                    )}
                  />
                  {/* Original image for dark theme */}
                  <img
                    src={img}
                    alt={typeof title === "string" ? title : "Collaboration preview"}
                    loading="lazy"
                    decoding="async"
                    className={cn(
                      imgClassName,
                      "object-cover object-center w-full h-full hidden dark:block"
                    )}
                  />
                </>
              ) : isType("current_project", 5) ? (
                <>
                  {/* Light Theme: Crisp, Pixel-Perfect Studio Code Window */}
                  <div className="block dark:hidden absolute right-0 bottom-0 md:w-[25rem] w-64 translate-x-2 translate-y-2 pointer-events-none select-none z-0">
                    <div className="rounded-2xl border border-slate-200/90 bg-white/95 shadow-[0_12px_36px_rgba(15,23,42,0.08),0_1px_3px_rgba(15,23,42,0.04)] backdrop-blur-xl p-4 sm:p-5 overflow-hidden font-mono text-[11px] sm:text-xs">
                      {/* Window Header */}
                      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-sans font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] animate-pulse" />
                          <span>workflow.ts</span>
                        </div>
                      </div>
                      {/* Code Lines with Syntax Highlighting */}
                      <div className="space-y-1.5 text-slate-800">
                        <div className="flex gap-3">
                          <span className="text-slate-300 select-none w-3 text-right">1</span>
                          <span className="text-slate-400 italic">{"// Building scalable systems & automation"}</span>
                        </div>
                        <div className="flex gap-3">
                          <span className="text-slate-300 select-none w-3 text-right">2</span>
                          <span>
                            <span className="text-[#7C3AED] font-semibold">import</span>{" "}
                            <span className="text-indigo-600 font-medium">PlatformEngine</span>{" "}
                            <span className="text-[#7C3AED] font-semibold">from</span>{" "}
                            <span className="text-emerald-600">&apos;@/core/engine&apos;</span>;
                          </span>
                        </div>
                        <div className="flex gap-3">
                          <span className="text-slate-300 select-none w-3 text-right">3</span>
                          <span className="text-slate-400 select-none">&nbsp;</span>
                        </div>
                        <div className="flex gap-3">
                          <span className="text-slate-300 select-none w-3 text-right">4</span>
                          <span className="text-slate-400 italic">{"// Scheduled mail & queue pipelines"}</span>
                        </div>
                        <div className="flex gap-3">
                          <span className="text-slate-300 select-none w-3 text-right">5</span>
                          <span>
                            <span className="text-[#7C3AED] font-semibold">import</span>{" "}
                            <span className="text-slate-800">{`{ `}</span>
                            <span className="text-amber-600 font-medium">Queue</span>
                            <span className="text-slate-800">{`, `}</span>
                            <span className="text-amber-600 font-medium">MailDispatcher</span>
                            <span className="text-slate-800">{` }`}</span>{" "}
                            <span className="text-[#7C3AED] font-semibold">from</span>{" "}
                            <span className="text-emerald-600">&apos;@/lib/workers&apos;</span>;
                          </span>
                        </div>
                        <div className="flex gap-3">
                          <span className="text-slate-300 select-none w-3 text-right">6</span>
                          <span className="text-slate-400 select-none">&nbsp;</span>
                        </div>
                        <div className="flex gap-3">
                          <span className="text-slate-300 select-none w-3 text-right">7</span>
                          <span>
                            <span className="text-[#7C3AED] font-semibold">const</span>{" "}
                            <span className="text-indigo-600 font-medium">service</span>{" "}
                            <span className="text-slate-500">=</span>{" "}
                            <span className="text-[#7C3AED] font-semibold">new</span>{" "}
                            <span className="text-indigo-600 font-medium">PlatformEngine</span>
                            <span className="text-slate-800">({`{ status: `}</span>
                            <span className="text-emerald-600">&apos;active&apos;</span>
                            <span className="text-slate-800">{` }`})</span>;
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Original image for dark theme (100% untouched) */}
                  <img
                    src={img}
                    alt={img}
                    loading="lazy"
                    decoding="async"
                    className={cn(
                      imgClassName,
                      "object-cover object-center hidden dark:block"
                    )}
                  />
                </>
              ) : (
                <img
                  src={img}
                  alt={img}
                  loading="lazy"
                  decoding="async"
                  className={cn(
                    imgClassName,
                    "object-cover object-center"
                  )}
                />
              )}
            </>
          )}
          {isType("collaboration", 1) && (
            <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/20 to-transparent dark:hidden z-[1] pointer-events-none" />
          )}
        </div>
        {spareImg && (
          <div
            className={`absolute right-0 -bottom-5 hidden dark:block ${
              isType("current_project", 5) ? "w-full opacity-80" : ""
            } `}
          >
            <img
              src={spareImg}
              alt={spareImg}
              loading="lazy"
              decoding="async"
              className="object-cover object-center w-full h-full"
            />
          </div>
        )}
        {isType("contact_cta", 6) && (
          <div className="hidden dark:block">
            <BackgroundGradientAnimation />
          </div>
        )}

        <div
          className={cn(
            titleClassName,
            "group-hover/bento:translate-x-2 transition duration-200 relative md:h-full min-h-40 flex flex-col px-5 p-5 lg:p-10"
          )}
        >
          <div
            className={cn(
              "font-sans font-normal text-xs md:text-sm text-slate-500 dark:text-[#C1C2D3] z-10 tracking-wide mb-1",
              isType("tech_stack", 3) && "max-w-[140px] sm:max-w-[170px] lg:max-w-[200px]"
            )}
          >
            {description}
          </div>
          <div
            className={cn(
              "font-sans text-lg lg:text-3xl font-bold z-10 leading-tight text-slate-900 dark:text-white",
              isType("tech_stack", 3)
                ? "max-w-[130px] sm:max-w-[160px] lg:max-w-[200px]"
                : "max-w-96"
            )}
          >
            {title}
          </div>

          {/* 3D Globe */}
          {isType("globe_timezone", 2) && <GridGlobe />}

          {/* Tech stack list */}
          {isType("tech_stack", 3) && (() => {
            const LEFT_STACK = (techStackLeft && techStackLeft.length >= 4)
              ? techStackLeft.slice(0, 4)
              : ["Next.js 16", "React 19", "TypeScript", "WebRTC"];
            const RIGHT_STACK = (techStackRight && techStackRight.length >= 4)
              ? techStackRight.slice(0, 4)
              : ["Rust & Tauri", "TailwindCSS", "Node.js", "Firestore"];

            return (
              <div className="flex gap-2 lg:gap-3.5 w-fit absolute -right-2 sm:right-0 lg:right-2 top-1/2 -translate-y-1/2 origin-right scale-[0.85] sm:scale-90 lg:scale-[0.95]">
                <div className="flex flex-col gap-2 md:gap-2.5">
                  {LEFT_STACK.map((item, i) => (
                    <span
                      key={i}
                      className="py-1.5 px-3 lg:py-2 lg:px-3.5 text-xs lg:text-sm rounded-xl text-center bg-slate-100 dark:bg-[#10132E] border border-slate-200/90 dark:border-white/[0.08] text-slate-800 dark:text-white font-medium shadow-2xs whitespace-nowrap transition-colors"
                    >
                      {item}
                    </span>
                  ))}
                </div>
                <div className="flex flex-col gap-2 md:gap-2.5 mt-2 lg:mt-3">
                  {RIGHT_STACK.map((item, i) => (
                    <span
                      key={i}
                      className="py-1.5 px-3 lg:py-2 lg:px-3.5 text-xs lg:text-sm rounded-xl text-center bg-slate-100 dark:bg-[#10132E] border border-slate-200/90 dark:border-white/[0.08] text-slate-800 dark:text-white font-medium shadow-2xs whitespace-nowrap transition-colors"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Contact CTA */}
          {isType("contact_cta", 6) && (
            <div className="mt-5 relative">
              <div className="absolute -bottom-5 right-0 block">
                <Lottie
                  animationData={animationData}
                  loop={copied}
                  autoplay={copied}
                  style={{ height: 200, width: 400 }}
                />
              </div>

              <MagicButton
                title={copied ? "Email is Copied!" : "Copy my email address"}
                icon={<IoCopyOutline />}
                position="left"
                handleClick={handleCopy}
                otherClasses="!bg-white dark:!bg-[#161A31] text-slate-900 dark:text-white font-semibold"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
