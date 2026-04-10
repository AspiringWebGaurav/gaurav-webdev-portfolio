"use client";

import React, { useState, useEffect } from "react";
import { Button } from "./ui/MovingBorders";
import { WorkExperience } from "@/types/workExperience";

const Experience = () => {
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkExperiences = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/work-experience", { cache: "no-store" });

        if (!response.ok) {
          throw new Error("Failed to fetch work experiences");
        }

        const data = await response.json();

        // Filter only active experiences and sort by order
        const activeExperiences = data.workExperiences
          .filter((exp: WorkExperience) => exp.isActive)
          .sort((a: WorkExperience, b: WorkExperience) => a.order - b.order);

        setWorkExperiences(activeExperiences);
      } catch (err) {
        console.error("Error fetching work experiences:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load work experiences"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchWorkExperiences();
  }, []);

  if (loading) {
    return (
      <div className="py-20 w-full">
        <h1 className="heading">
          My <span className="text-purple">work experience</span>
        </h1>
        <div className="w-full mt-12 flex items-center justify-center">
          <div className="animate-pulse text-white-100">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 w-full">
        <h1 className="heading">
          My <span className="text-purple">work experience</span>
        </h1>
        <div className="w-full mt-12 flex items-center justify-center">
          <div className="text-red-500">Error: {error}</div>
        </div>
      </div>
    );
  }

  if (workExperiences.length === 0) {
    return null; // Don't show section if no experiences
  }

  return (
    <div className="py-20 w-full">
      <h1 className="heading">
        My <span className="text-purple">work experience</span>
      </h1>

      <div className="w-full mt-12 grid lg:grid-cols-4 grid-cols-1 gap-10">
        {workExperiences.map((card) => (
          <Button
            key={card.id}
            duration={Math.floor(Math.random() * 10000) + 10000}
            borderRadius="1.75rem"
            style={{
              background: "rgb(4,7,29)",
              backgroundColor:
                "linear-gradient(90deg, rgba(4,7,29,1) 0%, rgba(12,14,35,1) 100%)",
              borderRadius: `calc(1.75rem* 0.96)`,
            }}
            className="flex-1 text-black dark:text-white border-neutral-200 dark:border-slate-800"
          >
            <div className="flex lg:flex-row flex-col lg:items-center p-3 py-6 md:p-5 lg:p-10 gap-2">
              <img
                src={card.thumbnail}
                alt={card.title}
                className="lg:w-32 md:w-20 w-16"
              />
              <div className="lg:ms-5">
                <h1 className="text-start text-xl md:text-2xl font-bold">
                  {card.title}
                </h1>
                {card.company && (
                  <p className="text-start text-white-200 mt-1 text-sm">
                    {card.company}
                  </p>
                )}
                <p className="text-start text-white-100 mt-3 font-semibold">
                  {card.desc}
                </p>
                {(card.duration || card.location) && (
                  <div className="text-start text-white-200 mt-2 text-sm">
                    {card.duration && <span>{card.duration}</span>}
                    {card.duration && card.location && <span> • </span>}
                    {card.location && <span>{card.location}</span>}
                  </div>
                )}
              </div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default Experience;
