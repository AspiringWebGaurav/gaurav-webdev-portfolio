"use client";

import { useState, useEffect } from "react";
import { FaLocationArrow } from "react-icons/fa6";
import { PinContainer } from "./ui/3d-pin";
import { Project } from "@/types/project";
import Image from "next/image";
import ImageSlideshow from "./ui/ImageSlideshow";

const RecentProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/projects");
        if (!response.ok) {
          throw new Error("Failed to fetch projects");
        }

        const data = await response.json();

        // Convert date strings back to Date objects and filter active projects
        const activeProjects = data.projects
          .filter((p: any) => p.isActive)
          .map((p: any) => ({
            ...p,
            createdAt: new Date(p.createdAt),
            updatedAt: new Date(p.updatedAt),
          }))
          .sort((a: Project, b: Project) => a.order - b.order);

        setProjects(activeProjects);
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load projects"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="py-20" id="projects">
        <h1 className="heading">
          A small selection of{" "}
          <span className="text-purple">recent projects</span>
        </h1>
        <div className="flex items-center justify-center p-4 mt-10 min-h-[300px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white-100 text-lg">Loading projects...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="py-20" id="projects">
        <h1 className="heading">
          A small selection of{" "}
          <span className="text-purple">recent projects</span>
        </h1>
        <div className="flex items-center justify-center p-4 mt-10 min-h-[300px]">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <p className="text-white-100 text-lg mb-2">
              Failed to load projects
            </p>
            <p className="text-gray-400 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (projects.length === 0) {
    return (
      <div className="py-20" id="projects">
        <h1 className="heading">
          A small selection of{" "}
          <span className="text-purple">recent projects</span>
        </h1>
        <div className="flex items-center justify-center p-4 mt-10 min-h-[300px]">
          <div className="text-center">
            <div className="text-6xl mb-4">📁</div>
            <p className="text-white-100 text-lg mb-2">
              No projects to display yet
            </p>
            <p className="text-gray-400 text-sm">
              Check back soon for exciting projects!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Projects display with 2x2 grid layout
  return (
    <div className="py-20" id="projects">
      <h1 className="heading">
        A small selection of{" "}
        <span className="text-purple">recent projects</span>
      </h1>
      <div className="flex flex-wrap items-center justify-center p-4 gap-x-24 gap-y-3 sm:gap-y-8 mt-10">
        {projects.map(({ id, title, des, img, images, iconLists, link }) => {
          // Convert to arrays if they're objects with numeric keys (Firestore issue)
          const projectImages = (() => {
            // Check if images exists and has content
            if (images && Array.isArray(images) && images.length > 0) return images;
            if (images && typeof images === 'object' && Object.keys(images).length > 0) {
              return Object.values(images);
            }
            // Fallback to main img field
            return img ? [img] : [];
          })();
          
          // Ensure iconLists is always an array
          const icons = Array.isArray(iconLists) 
            ? iconLists 
            : (typeof iconLists === 'object' ? Object.values(iconLists) : []);

          return (
            <div
              className="sm:h-[41rem] h-[32rem] lg:min-h-[32.5rem] flex items-center justify-center sm:w-[570px] w-[80vw]"
              key={id}
            >
              <PinContainer title="visit">
                <div className="relative flex items-center justify-center sm:w-[570px] w-[80vw] overflow-hidden sm:h-[40vh] h-[30vh] mb-10">
                  <div
                    className="relative w-full h-full overflow-hidden lg:rounded-3xl"
                    style={{ backgroundColor: "#13162D" }}
                  >
                    <Image
                      src="/bg.png"
                      alt="background"
                      fill
                      sizes="(max-width: 640px) 80vw, 570px"
                      className="object-cover"
                      priority={false}
                    />
                  </div>
                  <div className="absolute inset-0 z-10">
                    <ImageSlideshow
                      images={projectImages}
                      alt={title}
                      interval={5000}
                      transitionDuration={1500}
                      sizes="(max-width: 640px) 80vw, 570px"
                    />
                  </div>
                </div>

                <h1 className="font-bold lg:text-2xl md:text-xl text-base line-clamp-1">
                  {title}
                </h1>

                <p
                  className="lg:text-xl lg:font-normal font-light text-sm line-clamp-2"
                  style={{
                    color: "#BEC1DD",
                    margin: "1vh 0",
                  }}
                >
                  {des}
                </p>

                <div className="flex items-center justify-between mt-7 mb-3">
                  <div className="flex items-center">
                    {icons.map((icon, index) => (
                      <div
                        key={index}
                        className="border border-white/[.2] rounded-full bg-black lg:w-10 lg:h-10 w-8 h-8 flex justify-center items-center"
                        style={{
                          transform: `translateX(-${5 * index + 2}px)`,
                        }}
                      >
                        <Image
                          src={icon}
                          alt={`Tech icon ${index + 1}`}
                          width={32}
                          height={32}
                          className="p-2"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-center items-center">
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex lg:text-xl md:text-xs text-sm text-purple"
                    >
                      Check Live Site
                      <FaLocationArrow className="ms-3" color="#CBACF9" />
                    </a>
                  </div>
                </div>
              </PinContainer>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentProjects;
