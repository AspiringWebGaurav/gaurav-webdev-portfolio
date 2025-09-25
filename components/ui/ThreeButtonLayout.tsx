import React from "react";
import { useParams } from "next/navigation";
import { FaLocationArrow, FaQuestion } from "react-icons/fa6";
import { FaExternalLinkAlt } from "react-icons/fa";
import MagicButton from "./MagicButton";
import EnhancedMagicButton from "./EnhancedMagicButton";
import { useSafeRouteNavigation } from "@/components/loading/LoadingProvider";
import { LoadingErrorBoundary } from "@/components/loading/LoadingErrorBoundary";

interface ThreeButtonLayoutProps {
  // Modal handler for instant Ask Me Anything opening
  onAskDirectlyClick?: () => void;
}

const ThreeButtonLayout: React.FC<ThreeButtonLayoutProps> = ({
  onAskDirectlyClick,
}) => {
  const params = useParams();
  const portfolioNav = useSafeRouteNavigation();

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
    // Use modal for instant opening (no loading delay)
    if (onAskDirectlyClick) {
      onAskDirectlyClick();
    } else {
      // Fallback to page navigation for backwards compatibility
      const currentUUID = params.uuid as string;
      if (currentUUID) {
        portfolioNav.navigateWithLoading(`/${currentUUID}/ask-me-anything`, {
          loadingType: 'navigation',
          message: 'Opening Ask Me Anything...'
        });
      }
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
      
      {/* Ask me Anything Directly Button - Instant modal opening */}
      <EnhancedMagicButton
        title="Ask me Anything"
        icon={<FaQuestion />}
        position="right"
        handleClick={handleAskDirectlyClick}
        otherClasses="w-full md:w-60"
        isLoading={false} // No loading needed for modal
        loadingText=""
      />
    </div>
  );
};

// Wrap with error boundary for additional safety
const ThreeButtonLayoutWithErrorBoundary: React.FC<ThreeButtonLayoutProps> = (props) => (
  <LoadingErrorBoundary
    fallback={
      <div className="flex flex-col md:flex-row gap-3 md:gap-4 w-full md:w-auto items-center justify-center mt-6 md:mt-10">
        {/* Fallback buttons without loading functionality */}
        <MagicButton
          title="Show my work"
          icon={<FaLocationArrow />}
          position="right"
          handleClick={() => {
            const aboutElement = document.querySelector("#about");
            if (aboutElement) {
              aboutElement.scrollIntoView({ behavior: "smooth" });
            }
          }}
          otherClasses="w-full md:w-60"
        />
        
        <MagicButton
          title="My WorkSpace"
          icon={<FaExternalLinkAlt />}
          position="right"
          handleClick={() => window.open("https://www.gauravworkspace.store", "_blank", "noopener,noreferrer")}
          otherClasses="w-full md:w-60"
        />
        
        <MagicButton
          title="Ask me Anything"
          icon={<FaQuestion />}
          position="right"
          handleClick={() => props.onAskDirectlyClick?.()}
          otherClasses="w-full md:w-60"
        />
      </div>
    }
  >
    <ThreeButtonLayout {...props} />
  </LoadingErrorBoundary>
);

export default ThreeButtonLayoutWithErrorBoundary;