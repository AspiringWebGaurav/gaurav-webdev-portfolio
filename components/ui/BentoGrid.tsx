"use client";
import { useState } from "react";
import { IoCopyOutline } from "react-icons/io5";
import { FaLocationArrow } from "react-icons/fa6";
import { MessageCircle } from "lucide-react";

// Using lottie-react instead of deprecated react-lottie
import Lottie from "lottie-react";

import { cn } from "@/lib/utils";
import { useChatBubbleControl } from "@/contexts/ChatBubbleControlContext";

import { BackgroundGradientAnimation } from "./GradientBg";
import GridGlobe from "./GridGlobe";
import animationData from "@/data/confetti.json";
import MagicButton from "./MagicButton";

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
        // change gap-4 to gap-8, change grid-cols-3 to grid-cols-5, remove md:auto-rows-[18rem], add responsive code
        "grid grid-cols-1 md:grid-cols-6 lg:grid-cols-5 md:grid-row-7 gap-4 lg:gap-8 mx-auto",
        className
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  id,
  title,
  description,
  //   remove unecessary things here
  img,
  imgClassName,
  titleClassName,
  spareImg,
  techStacks,
  onContactClick,
}: {
  className?: string;
  id: number;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  img?: string;
  imgClassName?: string;
  titleClassName?: string;
  spareImg?: string;
  techStacks?: string[];
  onContactClick?: () => void;
}) => {
  // Use the chat bubble control context
  const { openBubble } = useChatBubbleControl();
  
  // Default tech stacks to prevent hydration issues
  const defaultTechStacks = ["ReactJS", "Express", "Typescript", "VueJS", "NuxtJS", "GraphQL"];
  
  const allTechStacks = techStacks && techStacks.length > 0 ? techStacks : defaultTechStacks;
  
  // Split into 4 columns
  const itemsPerColumn = Math.ceil(allTechStacks.length / 4);
  const column1 = allTechStacks.slice(0, itemsPerColumn);
  const column2 = allTechStacks.slice(itemsPerColumn, itemsPerColumn * 2);
  const column3 = allTechStacks.slice(itemsPerColumn * 2, itemsPerColumn * 3);
  const column4 = allTechStacks.slice(itemsPerColumn * 3);

  return (
    <div
      className={cn(
        // remove p-4 rounded-3xl dark:bg-black dark:border-white/[0.2] bg-white  border border-transparent, add border border-white/[0.1] overflow-hidden relative
        "row-span-1 relative overflow-hidden rounded-3xl border border-white/[0.1] group/bento hover:shadow-xl transition duration-200 shadow-input dark:shadow-none justify-between flex flex-col space-y-4",
        className
      )}
      style={{
        //   add these two
        //   you can generate the color from here https://cssgradient.io/
        background: "rgb(4,7,29)",
        backgroundColor:
          "linear-gradient(90deg, rgba(4,7,29,1) 0%, rgba(12,14,35,1) 100%)",
      }}
    >
      {/* add img divs */}
      <div className={`${id === 6 && "flex justify-center"} h-full`}>
        <div className="w-full h-full absolute">
          {img && (
            <img
              src={img}
              alt={img}
              className={cn(imgClassName, "object-cover object-center ")}
            />
          )}
        </div>
        <div
          className={`absolute right-0 -bottom-5 ${
            id === 5 && "w-full opacity-80"
          } `}
        >
          {spareImg && (
            <img
              src={spareImg}
              alt={spareImg}
              //   width={220}
              className="object-cover object-center w-full h-full"
            />
          )}
        </div>
        {id === 6 && (
          // add background animation , remove the p tag
          <BackgroundGradientAnimation>
            {/* <div className="absolute z-50 inset-0 flex items-center justify-center text-white font-bold px-4 pointer-events-none text-3xl text-center md:text-4xl lg:text-7xl"></div> */}
          </BackgroundGradientAnimation>
        )}

        <div
          className={cn(
            titleClassName,
            "group-hover/bento:translate-x-2 transition duration-200 relative md:h-full min-h-40 flex flex-col px-5 p-5 lg:p-10"
          )}
        >
          {/* change the order of the title and des, font-extralight, remove text-xs text-neutral-600 dark:text-neutral-300 , change the text-color */}
          <div className="font-sans font-extralight md:max-w-32 md:text-xs lg:text-base text-sm text-[#C1C2D3] z-10">
            {description}
          </div>
          {/* add text-3xl max-w-96 , remove text-neutral-600 dark:text-neutral-300*/}
          {/* remove mb-2 mt-2 */}
          <div
            className={`font-sans text-lg lg:text-3xl max-w-96 font-bold z-10`}
          >
            {title}
          </div>

          {/* for the github 3d globe */}
          {id === 2 && <GridGlobe />}

          {/* Tech stack list div - Updated positioning for mobile */}
          {id === 3 && (
            <div className="flex gap-1 lg:gap-2 w-fit absolute -right-20 lg:-right-16">
              {/* Column 1 */}
              <div className="flex flex-col gap-3 md:gap-3 lg:gap-8">
                {column1.map((item, i) => (
                  <span
                    key={i}
                    className="lg:py-4 lg:px-3 py-2 px-3 text-xs lg:text-base opacity-50 
                    lg:opacity-100 rounded-lg text-center bg-[#10132E]"
                  >
                    {item}
                  </span>
                ))}
                <span className="lg:py-4 lg:px-3 py-4 px-3 rounded-lg text-center bg-[#10132E]"></span>
              </div>
              
              {/* Column 2 */}
              <div className="flex flex-col gap-3 md:gap-3 lg:gap-8">
                <span className="lg:py-4 lg:px-3 py-4 px-3 rounded-lg text-center bg-[#10132E]"></span>
                {column2.map((item, i) => (
                  <span
                    key={i}
                    className="lg:py-4 lg:px-3 py-2 px-3 text-xs lg:text-base opacity-50 
                    lg:opacity-100 rounded-lg text-center bg-[#10132E]"
                  >
                    {item}
                  </span>
                ))}
              </div>
              
              {/* Column 3 */}
              <div className="flex flex-col gap-3 md:gap-3 lg:gap-8">
                {column3.map((item, i) => (
                  <span
                    key={i}
                    className="lg:py-4 lg:px-3 py-2 px-3 text-xs lg:text-base opacity-50 
                    lg:opacity-100 rounded-lg text-center bg-[#10132E]"
                  >
                    {item}
                  </span>
                ))}
                <span className="lg:py-4 lg:px-3 py-4 px-3 rounded-lg text-center bg-[#10132E]"></span>
              </div>
              
              {/* Column 4 */}
              <div className="flex flex-col gap-3 md:gap-3 lg:gap-8">
                <span className="lg:py-4 lg:px-3 py-4 px-3 rounded-lg text-center bg-[#10132E]"></span>
                {column4.map((item, i) => (
                  <span
                    key={i}
                    className="lg:py-4 lg:px-3 py-2 px-3 text-xs lg:text-base opacity-50 
                    lg:opacity-100 rounded-lg text-center bg-[#10132E]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
          {id === 6 && (
            <div className="mt-3 sm:mt-5 relative z-10">
              {/* Two buttons side by side */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4">
                {/* Button 1: Let's get in touch - Opens contact form */}
                <div className="flex-1 w-full">
                  <MagicButton
                    title="Let's get in touch"
                    icon={<FaLocationArrow />}
                    position="left"
                    handleClick={onContactClick}
                    otherClasses="!bg-[#161A31] !mt-0"
                  />
                </div>

                {/* Button 2: Chat with me - Opens chat bubble in chat mode */}
                <div className="flex-1 w-full">
                  <MagicButton
                    title="Chat with me"
                    icon={<MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                    position="left"
                    handleClick={() => openBubble('chat')}
                    otherClasses="!bg-[#161A31] !mt-0"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
