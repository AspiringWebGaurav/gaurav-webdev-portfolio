"use client";

import { useState, useEffect } from "react";
import { FaLocationArrow } from "react-icons/fa6";
import { FaGithub } from "react-icons/fa";
import { PinContainer } from "./ui/3d-pin";
import { CurrentlyWorking as CurrentlyWorkingType } from "@/types/currentlyWorking";
import Image from "next/image";
import ImageSlideshow from "./ui/ImageSlideshow";
import MagicButton from "./ui/MagicButton";

const CurrentlyWorking = () => {
  const [item, setItem] = useState<CurrentlyWorkingType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBlog, setShowBlog] = useState(false);

  useEffect(() => {
    const fetchCurrentlyWorking = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/currently-working");
        if (!response.ok) {
          throw new Error("Failed to fetch currently working");
        }

        const data = await response.json();

        if (data.item) {
          // Convert date strings back to Date objects
          const itemWithDates = {
            ...data.item,
            createdAt: new Date(data.item.createdAt),
            updatedAt: new Date(data.item.updatedAt),
          };
          setItem(itemWithDates);
        } else {
          setItem(null);
        }
      } catch (err) {
        console.error("Error fetching currently working:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load currently working"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentlyWorking();
  }, []);

  // Navigate to projects section
  const handleSneakPeek = () => {
    const projectsSection = document.getElementById("projects");
    if (projectsSection) {
      projectsSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Don't render anything if loading, error, or no item
  if (loading || error || !item) {
    return null;
  }

  const projectImages =
    item.images && item.images.length > 0 ? item.images : [];

  return (
    <div className="py-10">
      {/* Heading Section */}
      <h1 className="heading">
        Currently Working -{" "}
        <span className="text-purple">{item.headingTitle}</span>
      </h1>

      {/* The Inside Scoop Card - Full information display */}
      <div className="w-full py-10">
        <div className="flex flex-wrap items-center justify-center p-4 gap-x-24 gap-y-3 sm:gap-y-8">
          <div className="sm:h-[41rem] h-[32rem] lg:min-h-[32.5rem] flex items-center justify-center sm:w-[570px] w-[80vw]">
            {/* Removed PinContainer to disable tilt effect */}
            <div className="flex flex-col w-full">
              <div className="relative flex items-center justify-center sm:w-[570px] w-[80vw] overflow-hidden sm:h-[40vh] h-[30vh] mb-10">
                {/* The Inside Scoop Badge */}
                <div className="absolute top-4 left-4 z-20">
                  <div className="bg-purple-600 text-white text-xs px-3 py-1.5 rounded-full font-semibold shadow-lg">
                    <span>🔍 The Inside Scoop</span>
                  </div>
                </div>

                {/* Blog Notification Badge */}
                {item.showBlogNotification && item.blogContent && (
                  <div className="absolute top-4 right-4 z-20">
                    <button
                      onClick={() => setShowBlog(!showBlog)}
                      className="bg-purple text-white text-xs px-3 py-1.5 rounded-full font-semibold shadow-lg hover:bg-purple/80 transition-all flex items-center gap-1"
                    >
                      <span>📖</span>
                      <span>Read Blog</span>
                    </button>
                  </div>
                )}

                {/* Background */}
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

                {/* Images Slideshow */}
                {projectImages.length > 0 ? (
                  <div className="absolute inset-0 z-10">
                    <ImageSlideshow
                      images={projectImages}
                      alt={item.title}
                      interval={5000}
                      transitionDuration={1500}
                      sizes="(max-width: 640px) 80vw, 570px"
                    />
                  </div>
                ) : (
                  <div className="absolute inset-0 z-10 flex items-center justify-center text-white/50">
                    <p className="text-sm">No images available</p>
                  </div>
                )}
              </div>

              {/* Title */}
              <h1 className="font-bold lg:text-2xl md:text-xl text-base line-clamp-1">
                {item.title}
              </h1>

              {/* Description */}
              <p
                className="lg:text-xl lg:font-normal font-light text-sm line-clamp-2"
                style={{
                  color: "#BEC1DD",
                  margin: "1vh 0",
                }}
              >
                {item.description}
              </p>

              {/* Tech Icons and Links */}
              <div className="flex items-center justify-between mt-7 mb-3">
                <div className="flex items-center">
                  {item.iconLists.map((icon, index) => (
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

                <div className="flex justify-center items-center gap-3">
                  {item.githubLink && (
                    <a
                      href={item.githubLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-purple hover:text-purple/80 transition-colors"
                      title="GitHub Repository"
                    >
                      <FaGithub size={24} color="#CBACF9" />
                    </a>
                  )}

                  {item.liveLink && (
                    <a
                      href={item.liveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex lg:text-xl md:text-xs text-sm text-purple hover:text-purple/80 transition-colors"
                    >
                      Check Link
                      <FaLocationArrow className="ms-3" color="#CBACF9" />
                    </a>
                  )}
                </div>
              </div>

              {/* Sneak Peek Button */}
              <div className="flex items-center justify-center w-full mt-4">
                <MagicButton
                  title="Sneak Peek"
                  icon={<FaLocationArrow />}
                  position="right"
                  handleClick={handleSneakPeek}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Blog Modal */}
      {showBlog && item.blogContent && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowBlog(false)}
        >
          <div
            className="bg-slate-900 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-3xl font-bold text-white">{item.title}</h2>
              <button
                onClick={() => setShowBlog(false)}
                className="text-white hover:text-purple transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                {item.blogContent}
              </p>
            </div>

            {/* Links in blog footer */}
            {(item.githubLink || item.liveLink) && (
              <div className="mt-8 pt-6 border-t border-gray-700 flex gap-4">
                {item.githubLink && (
                  <a
                    href={item.githubLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-purple hover:text-purple/80 transition-colors"
                  >
                    <FaGithub size={20} />
                    <span>View on GitHub</span>
                  </a>
                )}
                {item.liveLink && (
                  <a
                    href={item.liveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-purple hover:text-purple/80 transition-colors"
                  >
                    <FaLocationArrow />
                    <span>Check Live Link</span>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrentlyWorking;
