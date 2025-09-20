import React from "react";
import { useRouter, useParams } from "next/navigation";
import { FaLocationArrow, FaQuestion } from "react-icons/fa6";
import { FaExternalLinkAlt } from "react-icons/fa";
import MagicButton from "./MagicButton";

interface ThreeButtonLayoutProps {
  // onAskDirectlyClick is now optional since we handle navigation internally
  onAskDirectlyClick?: () => void;
}

const ThreeButtonLayout: React.FC<ThreeButtonLayoutProps> = ({
  onAskDirectlyClick,
}) => {
  const router = useRouter();
  const params = useParams();

  const handleWorkspaceClick = () => {
    window.open("https://www.gauravworkspace.store", "_blank", "noopener,noreferrer");
  };

  const handleShowWorkClick = () => {
    const aboutElement = document.querySelector("#about");
    if (aboutElement) {
      aboutElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleAskDirectlyClick = () => {
    // Navigate to the dedicated Ask Me Anything page using current UUID
    const currentUUID = params.uuid as string;
    if (currentUUID) {
      router.push(`/${currentUUID}/ask-me-anything`);
    } else {
      // Fallback: call the original callback if provided (for backward compatibility)
      onAskDirectlyClick?.();
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-3 md:gap-4 w-full md:w-auto items-center justify-center mt-6 md:mt-10">
      {/* Show My Work Button */}
      <MagicButton
        title="Show my work"
        icon={<FaLocationArrow />}
        position="right"
        handleClick={handleShowWorkClick}
        otherClasses="w-full md:w-60"
      />
      
      {/* My WorkSpace Button */}
      <MagicButton
        title="My WorkSpace"
        icon={<FaExternalLinkAlt />}
        position="right"
        handleClick={handleWorkspaceClick}
        otherClasses="w-full md:w-60"
      />
      
      {/* Ask me Anything Directly Button */}
      <MagicButton
        title="Ask me Anything"
        icon={<FaQuestion />}
        position="right"
        handleClick={handleAskDirectlyClick}
        otherClasses="w-full md:w-60"
      />
    </div>
  );
};

export default ThreeButtonLayout;