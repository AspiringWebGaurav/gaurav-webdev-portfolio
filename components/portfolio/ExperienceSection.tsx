import React from "react";
import { Button } from "@/components/ui/MovingBorders";
import type { ExperienceDocument } from "@/types/portfolio";
import { SEED_EXPERIENCE } from "@/lib/dal/repositories/seed-data";

interface ExperienceSectionProps {
  experience?: ExperienceDocument[];
}

export const ExperienceSection = ({ experience = SEED_EXPERIENCE }: ExperienceSectionProps) => {
  const sortedExperience = [...experience].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <section className="py-20 w-full">
      <h2 id="experience-heading" className="heading">
        My <span className="text-[#7C3AED] dark:text-purple">work experience</span>
      </h2>

      <div className="w-full mt-8 sm:mt-12 grid lg:grid-cols-4 sm:grid-cols-2 grid-cols-1 gap-6 sm:gap-10">
        {sortedExperience.map((card, idx) => (
          <Button
            key={card.id}
            duration={10000 + (idx % 4) * 2500}
            borderRadius="1.75rem"
            className="flex-1 text-slate-900 dark:text-white border-slate-200/90 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none"
          >
            <div className="flex lg:flex-row flex-col lg:items-center p-4 py-6 sm:p-5 lg:p-10 gap-3 sm:gap-2">
              <img
                src={card.thumbnailUrl}
                alt={card.title}
                loading="lazy"
                decoding="async"
                className="lg:w-32 md:w-20 w-16 object-contain"
              />
              <div className="lg:ms-5">
                <h3 className="text-start text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                  {card.title}
                </h3>
                {card.company && (
                  <p className="text-start text-[#7C3AED] dark:text-purple text-xs font-mono mt-1 font-semibold">
                    {card.company} {card.period ? `• ${card.period}` : ""}
                  </p>
                )}
                <p className="text-start text-slate-600 dark:text-white-100 mt-3 font-medium text-sm leading-relaxed">
                  {card.description}
                </p>
              </div>
            </div>
          </Button>
        ))}
      </div>
    </section>
  );
};
