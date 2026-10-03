"use client";

import React from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "motion/react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import type { PhaseDocument } from "@/types/portfolio";
import { SEED_PHASES } from "@/lib/dal/repositories/seed-data";

const CanvasRevealEffect = dynamic(
  () => import("@/components/ui/CanvasRevealEffect").then((mod) => mod.CanvasRevealEffect),
  { ssr: false }
);

interface ApproachSectionProps {
  phases?: PhaseDocument[];
}

interface ThemeModeConfig {
  containerClassName: string;
  colors?: number[][];
  dotSize?: number;
}

interface PhaseThemeConfig {
  dark: ThemeModeConfig;
  light: ThemeModeConfig;
  titleColor: string;
  descColor: string;
  iconColor: string;
  hoverBorder: string;
  hoverShadow: string;
}

const THEME_CONFIGS: Record<string, PhaseThemeConfig> = {
  emerald: {
    dark: {
      containerClassName: "bg-emerald-900 rounded-3xl overflow-hidden",
      colors: [[0, 255, 255]],
    },
    light: {
      containerClassName: "bg-gradient-to-b from-emerald-50 via-teal-50/50 to-white dark:bg-emerald-900 rounded-3xl overflow-hidden",
      colors: [
        [16, 185, 129],
        [5, 150, 105],
        [13, 148, 136],
      ],
      dotSize: 3,
    },
    titleColor: "text-emerald-950 dark:text-white",
    descColor: "text-emerald-900/80 dark:text-white/95",
    iconColor: "text-emerald-500 opacity-90 dark:opacity-40 dark:text-white",
    hoverBorder: "hover:border-emerald-500/60 dark:hover:border-purple/50",
    hoverShadow: "hover:shadow-[0_16px_40px_rgba(16,185,129,0.18)] dark:hover:shadow-xl",
  },
  pink: {
    dark: {
      containerClassName: "bg-pink-900 rounded-3xl overflow-hidden",
      colors: [
        [255, 166, 158],
        [221, 255, 247],
      ],
      dotSize: 2,
    },
    light: {
      containerClassName: "bg-gradient-to-b from-rose-50 via-pink-50/50 to-white dark:bg-pink-900 rounded-3xl overflow-hidden",
      colors: [
        [244, 63, 94],
        [225, 29, 72],
        [168, 85, 247],
      ],
      dotSize: 2.5,
    },
    titleColor: "text-rose-950 dark:text-white",
    descColor: "text-rose-900/80 dark:text-white/95",
    iconColor: "text-rose-500 opacity-90 dark:opacity-40 dark:text-white",
    hoverBorder: "hover:border-rose-500/60 dark:hover:border-purple/50",
    hoverShadow: "hover:shadow-[0_16px_40px_rgba(244,63,94,0.18)] dark:hover:shadow-xl",
  },
  sky: {
    dark: {
      containerClassName: "bg-sky-600 rounded-3xl overflow-hidden",
      colors: [[125, 211, 252]],
    },
    light: {
      containerClassName: "bg-gradient-to-b from-sky-50 via-cyan-50/50 to-white dark:bg-sky-600 rounded-3xl overflow-hidden",
      colors: [
        [14, 165, 233],
        [2, 132, 199],
        [59, 130, 246],
      ],
      dotSize: 3,
    },
    titleColor: "text-sky-950 dark:text-white",
    descColor: "text-sky-900/80 dark:text-white/95",
    iconColor: "text-sky-500 opacity-90 dark:opacity-40 dark:text-white",
    hoverBorder: "hover:border-sky-500/60 dark:hover:border-purple/50",
    hoverShadow: "hover:shadow-[0_16px_40px_rgba(14,165,233,0.18)] dark:hover:shadow-xl",
  },
  violet: {
    dark: {
      containerClassName: "bg-violet-900 rounded-3xl overflow-hidden",
      colors: [[196, 181, 253]],
    },
    light: {
      containerClassName: "bg-gradient-to-b from-purple-50 via-violet-50/50 to-white dark:bg-violet-900 rounded-3xl overflow-hidden",
      colors: [
        [147, 51, 234],
        [124, 58, 237],
        [79, 70, 229],
      ],
      dotSize: 3,
    },
    titleColor: "text-purple-950 dark:text-white",
    descColor: "text-purple-900/80 dark:text-white/95",
    iconColor: "text-purple-500 opacity-90 dark:opacity-40 dark:text-white",
    hoverBorder: "hover:border-purple-500/60 dark:hover:border-purple/50",
    hoverShadow: "hover:shadow-[0_16px_40px_rgba(147,51,234,0.18)] dark:hover:shadow-xl",
  },
  amber: {
    dark: {
      containerClassName: "bg-amber-900 rounded-3xl overflow-hidden",
      colors: [[252, 211, 77]],
    },
    light: {
      containerClassName: "bg-gradient-to-b from-amber-50 via-yellow-50/50 to-white dark:bg-amber-900 rounded-3xl overflow-hidden",
      colors: [
        [217, 119, 6],
        [245, 158, 11],
        [234, 88, 12],
      ],
      dotSize: 3,
    },
    titleColor: "text-amber-950 dark:text-white",
    descColor: "text-amber-900/80 dark:text-white/95",
    iconColor: "text-amber-500 opacity-90 dark:opacity-40 dark:text-white",
    hoverBorder: "hover:border-amber-500/60 dark:hover:border-purple/50",
    hoverShadow: "hover:shadow-[0_16px_40px_rgba(217,119,6,0.18)] dark:hover:shadow-xl",
  },
};

export const ApproachSection = ({ phases = SEED_PHASES }: ApproachSectionProps) => {
  const sortedPhases = [...phases].sort((a, b) => (a.order || 0) - (b.order || 0));
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = !mounted || resolvedTheme !== "light";

  return (
    <section className="w-full py-20">
      <h2 className="heading">
        My <span className="text-[#7C3AED] dark:text-purple">approach</span>
      </h2>
      <div className="my-20 flex flex-col lg:flex-row items-center justify-center w-full gap-6 lg:gap-8">
        {sortedPhases.map((phase) => {
          const theme = THEME_CONFIGS[phase.themeColor] || THEME_CONFIGS.emerald;
          const config = isDark ? theme.dark : theme.light;
          const speed = Math.max(0.1, Math.min(10.0, phase.animationSpeed || 3.0));

          return (
            <Card
              key={phase.id}
              title={phase.title}
              icon={<AceternityIcon order={phase.phaseBadge || `Phase ${phase.order}`} />}
              des={phase.description}
              themeConfig={theme}
              renderCanvas={() => (
                <CanvasRevealEffect
                  key={isDark ? "dark-canvas" : "light-canvas"}
                  animationSpeed={speed}
                  containerClassName={config.containerClassName}
                  colors={config.colors}
                  dotSize={config.dotSize}
                  isDark={isDark}
                />
              )}
            />
          );
        })}
      </div>
    </section>
  );
};

const Card = ({
  title,
  icon,
  children,
  renderCanvas,
  des,
  themeConfig,
}: {
  title: string;
  icon: React.ReactNode;
  children?: React.ReactNode;
  renderCanvas?: () => React.ReactNode;
  des: string;
  themeConfig?: PhaseThemeConfig;
}) => {
  const [hovered, setHovered] = React.useState(false);
  const [mobileActive, setMobileActive] = React.useState(false);

  const isRevealed = hovered || mobileActive;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => setMobileActive((prev) => !prev)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setMobileActive((prev) => !prev);
        }
      }}
      aria-expanded={isRevealed}
      className={cn(
        "border border-slate-200 dark:border-white/[0.2] bg-white dark:bg-[#04071D] group/canvas-card flex items-center justify-center max-w-sm w-full mx-auto p-4 relative lg:h-[35rem] min-h-[18rem] rounded-3xl cursor-pointer select-none touch-manipulation transition-all duration-300 shadow-[0_4px_24px_rgba(15,23,42,0.07),0_1px_3px_rgba(15,23,42,0.04)] dark:shadow-none hover:shadow-[0_16px_40px_rgba(15,23,42,0.12)] dark:hover:shadow-xl hover:border-[#7C3AED]/50 dark:hover:border-purple/50 active:scale-[0.99]",
        isRevealed && themeConfig?.hoverBorder,
        isRevealed && themeConfig?.hoverShadow
      )}
    >
      <Icon className={cn("absolute h-8 w-8 -top-2.5 -left-2.5 text-slate-300 dark:text-white opacity-40 dark:opacity-40 pointer-events-none transition-colors duration-300", isRevealed && themeConfig?.iconColor)} />
      <Icon className={cn("absolute h-8 w-8 -bottom-2.5 -left-2.5 text-slate-300 dark:text-white opacity-40 dark:opacity-40 pointer-events-none transition-colors duration-300", isRevealed && themeConfig?.iconColor)} />
      <Icon className={cn("absolute h-8 w-8 -top-2.5 -right-2.5 text-slate-300 dark:text-white opacity-40 dark:opacity-40 pointer-events-none transition-colors duration-300", isRevealed && themeConfig?.iconColor)} />
      <Icon className={cn("absolute h-8 w-8 -bottom-2.5 -right-2.5 text-slate-300 dark:text-white opacity-40 dark:opacity-40 pointer-events-none transition-colors duration-300", isRevealed && themeConfig?.iconColor)} />

      <AnimatePresence>
        {isRevealed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="h-full w-full absolute inset-0 pointer-events-none overflow-hidden rounded-3xl"
          >
            {renderCanvas ? renderCanvas() : children}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-20 px-6 sm:px-10 pointer-events-none">
        <div
          className={`text-center absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 min-w-40 mx-auto flex items-center justify-center transition-all duration-300 ${
            isRevealed ? "opacity-0 -translate-y-4 scale-95" : "opacity-100 translate-y-0 scale-100"
          }`}
        >
          {icon}
        </div>
        <h3
          className={cn(
            "text-center text-2xl sm:text-3xl relative z-10 font-bold transition-all duration-300",
            isRevealed ? "opacity-100 -translate-y-2" : "opacity-0 translate-y-2",
            isRevealed && (themeConfig?.titleColor || "text-slate-900 dark:text-white")
          )}
        >
          {title}
        </h3>
        <p
          className={cn(
            "text-xs sm:text-sm relative z-10 mt-4 text-center transition-all duration-300 leading-relaxed font-medium",
            isRevealed ? "opacity-100 -translate-y-2" : "opacity-0 translate-y-2",
            isRevealed && (themeConfig?.descColor || "text-slate-700 dark:text-white/95")
          )}
        >
          {des}
        </p>
      </div>
    </div>
  );
};

const AceternityIcon = ({ order }: { order: string }) => {
  return (
    <div>
      <div className="relative inline-flex overflow-hidden rounded-full p-[1.5px] border border-slate-200/90 dark:border-white/20 shadow-sm dark:shadow-md">
        <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#7C3AED_50%,#E2CBFF_100%)] opacity-80" />
        <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-white dark:bg-slate-950 px-5 py-2.5 text-[#7C3AED] dark:text-purple backdrop-blur-3xl font-bold text-xl sm:text-2xl transition-colors">
          {order}
        </span>
      </div>
    </div>
  );
};

export const Icon = ({
  className,
  ...rest
}: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className={className}
      {...rest}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
    </svg>
  );
};
