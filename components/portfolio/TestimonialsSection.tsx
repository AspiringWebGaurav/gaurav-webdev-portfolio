"use client";

import React from "react";
import { InfiniteMovingCards } from "@/components/ui/InfiniteMovingCards";
import type { TestimonialDocument, ClientDocument } from "@/types/portfolio";
import { SEED_TESTIMONIALS, SEED_CLIENTS } from "@/lib/dal/repositories/seed-data";
import { cn } from "@/lib/utils";

interface TestimonialsSectionProps {
  testimonials?: TestimonialDocument[];
  clients?: ClientDocument[];
}

export const TestimonialsSection = ({
  testimonials = SEED_TESTIMONIALS,
  clients = SEED_CLIENTS,
}: TestimonialsSectionProps) => {
  const activeTestimonials =
    testimonials && testimonials.length > 0
      ? testimonials
      : SEED_TESTIMONIALS;

  const formattedTestimonials = activeTestimonials.map((t) => {
    const isAnonymous =
      t.name.toLowerCase().includes("anonymous") ||
      t.name.toLowerCase().includes("confidential") ||
      (t.company && t.company.toLowerCase().includes("nda"));

    return {
      quote: t.quote,
      name: t.name,
      title: t.role && t.company ? `${t.role} · ${t.company}` : t.role || t.company,
      avatar: t.avatarUrl || "/profile.webp",
      isAnonymous: Boolean(isAnonymous),
      socialUrl: t.socialUrl,
    };
  });

  const activeClients =
    clients && clients.length > 0
      ? clients
      : SEED_CLIENTS;

  const sortedClients = [...activeClients].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <section className="py-20">
      <h2 className="heading">
        Kind words from <span className="text-purple">satisfied clients</span>
      </h2>

      <div className="flex flex-col items-center max-lg:mt-10">
        <div className="h-[50vh] md:h-[30rem] w-full rounded-md flex flex-col antialiased items-center justify-center relative overflow-hidden">
          <InfiniteMovingCards
            items={formattedTestimonials}
            direction="right"
            speed="slow"
          />
        </div>

        {/* Partner Organizations & Verified Commercial Engagements */}
        <div className="w-full mt-14 md:mt-20 flex flex-col items-center">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0E1328]/80 border border-white/10 text-[11px] font-mono uppercase tracking-[0.2em] text-[#C1C2D3]/70 mb-8 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Partner Organizations &amp; Commercial Contracts
          </div>

          <div className="grid grid-cols-2 gap-2.5 xs:gap-3 w-full max-w-sm xs:max-w-md sm:max-w-6xl sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-4 md:gap-8">
            {sortedClients.map((client, idx) => {
              const isLastOdd =
                sortedClients.length % 2 === 1 && idx === sortedClients.length - 1;

              const content = (
                <>
                  {client.iconUrl && (
                    <img
                      src={client.iconUrl}
                      alt={client.name}
                      loading="lazy"
                      decoding="async"
                      className="w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 object-contain shrink-0 transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                  {client.nameImgUrl ? (
                    <img
                      src={client.nameImgUrl}
                      alt={client.name}
                      loading="lazy"
                      decoding="async"
                      width={client.logoWidth || 140}
                      className="h-4.5 xs:h-5 sm:h-6 md:h-7 max-w-[95px] xs:max-w-[115px] sm:max-w-[160px] w-auto object-contain opacity-90 group-hover:opacity-100 transition-opacity"
                    />
                  ) : (
                    <span className="text-xs sm:text-sm font-semibold text-white/90 group-hover:text-white transition-colors truncate">
                      {client.name}
                    </span>
                  )}
                </>
              );

              const cardClasses = cn(
                "group flex items-center justify-center gap-1.5 xs:gap-2 sm:gap-3 px-2.5 xs:px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.07] hover:border-purple/40 transition-all duration-300 shadow-xs backdrop-blur-xs w-full sm:w-auto",
                isLastOdd && "col-span-2 max-w-[180px] xs:max-w-[200px] sm:max-w-none mx-auto sm:mx-0"
              );

              return client.websiteUrl ? (
                <a
                  key={client.id}
                  href={client.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cardClasses}
                  title={`View ${client.name} verified profile`}
                >
                  {content}
                </a>
              ) : (
                <div key={client.id} className={cardClasses}>
                  {content}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
