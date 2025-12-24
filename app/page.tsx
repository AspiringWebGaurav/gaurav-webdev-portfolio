import Hero from "@/components/Hero";
import { FloatingNav } from "./../components/ui/FloatingNav";
import { FaHome } from "react-icons/fa";
import Grid from "@/components/Grid";
import CurrentlyWorking from "@/components/CurrentlyWorking";
import RecentProjects from "@/components/RecentProjects";
import { navItems } from "@/data";
import Clients from "@/components/Clients";
import Experience from "@/components/Experience";
import Approach from "@/components/Approach";
import Footer from "@/components/Footer";
import BugHunt from "@/components/BugHunt";

// Skeleton wrapper and components
import { WithSkeleton } from "@/components/skeletons";
import {
  FloatingNavSkeleton,
  HeroSkeleton,
  GridSkeleton,
  CurrentlyWorkingSkeleton,
  RecentProjectsSkeleton,
  ClientsSkeleton,
  ExperienceSkeleton,
  ApproachSkeleton,
  FooterSkeleton,
} from "@/components/skeletons";

export default function Home() {
  return (
    <main className="relative bg-black-100 flex justify-center items-center flex-col mx-auto sm:px-10 px-5 overflow-clip">
      <div className="w-full">
        {/* Floating Navigation with Skeleton - Maintains fixed positioning */}
        <WithSkeleton skeleton={<FloatingNavSkeleton />} preserveFixed>
          <FloatingNav navItems={navItems} />
        </WithSkeleton>

        {/* Hero Section with Skeleton */}
        <section id="hero">
          <WithSkeleton skeleton={<HeroSkeleton />}>
            <Hero />
          </WithSkeleton>
        </section>

        {/* About/Grid Section with Skeleton */}
        <section id="about">
          <WithSkeleton skeleton={<GridSkeleton />}>
            <Grid />
          </WithSkeleton>
        </section>

        {/* Currently Working Section with Skeleton */}
        <section id="currently-working">
          <WithSkeleton skeleton={<CurrentlyWorkingSkeleton />}>
            <CurrentlyWorking />
          </WithSkeleton>
        </section>

        {/* Projects Section with Skeleton */}
        <section id="projects">
          <WithSkeleton skeleton={<RecentProjectsSkeleton />}>
            <RecentProjects />
          </WithSkeleton>
        </section>

        {/* Testimonials Section with Skeleton */}
        <section id="testimonials">
          <WithSkeleton skeleton={<ClientsSkeleton />}>
            <Clients />
          </WithSkeleton>
        </section>

        {/* Experience Section with Skeleton */}
        <section id="experience">
          <WithSkeleton skeleton={<ExperienceSkeleton />}>
            <Experience />
          </WithSkeleton>
        </section>

        {/* Approach Section with Skeleton */}
        <section id="approach">
          <WithSkeleton skeleton={<ApproachSkeleton />}>
            <Approach />
          </WithSkeleton>
        </section>

        {/* Bug Hunt Section (No skeleton - empty section) */}
        <section id="bug-hunt">
          <BugHunt />
        </section>

        {/* Footer/Contact Section with Skeleton */}
        <section id="contact">
          <WithSkeleton skeleton={<FooterSkeleton />}>
            <Footer />
          </WithSkeleton>
        </section>
      </div>
    </main>
  );
}
