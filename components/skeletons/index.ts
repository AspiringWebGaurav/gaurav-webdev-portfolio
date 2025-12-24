// Core skeleton components
export { Skeleton } from "./core/Skeleton";
export { SkeletonText } from "./core/SkeletonText";
export { SkeletonCircle } from "./core/SkeletonCircle";
export { SkeletonButton } from "./core/SkeletonButton";
export { SkeletonImage } from "./core/SkeletonImage";
export { SkeletonCard } from "./core/SkeletonCard";
export { SkeletonGlobe } from "./core/SkeletonGlobe";
export { SkeletonMovingBorder } from "./core/SkeletonMovingBorder";
export { SkeletonPinContainer } from "./core/SkeletonPinContainer";

// Section skeletons
export { FloatingNavSkeleton } from "./sections/FloatingNavSkeleton";
export { HeroSkeleton } from "./sections/HeroSkeleton";
export { GridSkeleton } from "./sections/GridSkeleton";
export { CurrentlyWorkingSkeleton } from "./sections/CurrentlyWorkingSkeleton";
export { RecentProjectsSkeleton } from "./sections/RecentProjectsSkeleton";
export { ClientsSkeleton } from "./sections/ClientsSkeleton";
export { ExperienceSkeleton } from "./sections/ExperienceSkeleton";
export { ApproachSkeleton } from "./sections/ApproachSkeleton";
export { FooterSkeleton } from "./sections/FooterSkeleton";
export { VisitorTrackerSkeleton } from "./sections/VisitorTrackerSkeleton";
export { default as MaintenanceGateSkeleton } from "./sections/MaintenanceGateSkeleton";
export { default as MaintenancePageSkeleton } from "./sections/MaintenancePageSkeleton";

// Wrapper components
export { WithSkeleton } from "./wrappers/WithSkeleton";
export { withAutoSkeleton } from "./wrappers/withAutoSkeleton";
export {
  SkeletonProvider,
  useSkeletonProvider,
  useSkeletonSync,
} from "./wrappers/SkeletonProvider";
