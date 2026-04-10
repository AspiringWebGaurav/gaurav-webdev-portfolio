"use client";

import { useState, useEffect } from "react";
import { gridItems } from "@/data";
import { BentoGrid, BentoGridItem } from "./ui/BentoGrid";
import ContactFormModal from "./ContactFormModal";

interface TechStack {
  id: string;
  name: string;
  order: number;
  isActive: boolean;
}

// No default tech stacks - fetch from API only

const Grid = () => {
  const [dynamicTitle, setDynamicTitle] = useState<string | null>(null);
  const [techStacks, setTechStacks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const handleContactClick = () => {
    setIsContactModalOpen(true);
  };

  useEffect(() => {
    setMounted(true);
    
    const fetchCurrentlyWorking = async () => {
      try {
        const response = await fetch("/api/currently-working", { cache: "no-store" });
        if (response.ok) {
          const data = await response.json();
          if (data.item && data.item.headingTitle) {
            setDynamicTitle(`Currently building ${data.item.headingTitle}`);
          }
        }
      } catch (error) {
        console.error("Error fetching currently working:", error);
        // Keep default title on error
      }
    };

    const fetchTechStacks = async () => {
      try {
        const response = await fetch("/api/tech-stacks", { cache: "no-store" });
        if (response.ok) {
          const data = await response.json();
          if (data.items && Array.isArray(data.items) && data.items.length > 0) {
            // Get only active items, sorted by order
            const activeTechStacks = data.items
              .filter((item: TechStack) => item.isActive)
              .sort((a: TechStack, b: TechStack) => a.order - b.order)
              .map((item: TechStack) => item.name);
            
            if (activeTechStacks.length > 0) {
              setTechStacks(activeTechStacks);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching tech stacks:", error);
        // Keep default tech stacks on error
      }
    };

    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchCurrentlyWorking(), fetchTechStacks()]);
      setLoading(false);
    };
    loadData();
  }, []);

  return (
    <section id="about">
      <BentoGrid className="w-full py-20">
        {gridItems.map(
          ({
            id,
            title,
            description,
            className,
            img,
            imgClassName,
            titleClassName,
            spareImg,
          }) => (
            <BentoGridItem
              id={id}
              key={id}
              title={id === 5 ? (dynamicTitle || "Working on something exciting...") : title}
              description={description}
              className={className}
              img={img}
              imgClassName={imgClassName}
              titleClassName={titleClassName}
              spareImg={spareImg}
              techStacks={id === 3 ? (techStacks.length > 0 ? techStacks : undefined) : undefined}
              onContactClick={id === 6 ? handleContactClick : undefined}
            />
          )
        )}
      </BentoGrid>

      {/* Contact Form Modal - Rendered at Grid level */}
      <ContactFormModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />
    </section>
  );
};

export default Grid;
