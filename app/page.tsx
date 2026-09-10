import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { HeroSection } from "@/components/portfolio/HeroSection";

export const metadata: Metadata = {
  title: "Gaurav Patil — Full Stack Developer & Software Engineer",
  description:
    "Official portfolio of Gaurav Patil, a Full Stack Developer & Software Engineer based in India specializing in Next.js, React, TypeScript, and modern scalable web architecture.",
  alternates: {
    canonical: "https://gauravpatil.site",
  },
  openGraph: {
    title: "Gaurav Patil — Full Stack Developer & Software Engineer",
    description:
      "Official portfolio of Gaurav Patil, a Full Stack Developer & Software Engineer based in India specializing in Next.js, React, TypeScript, and modern scalable web architecture.",
    url: "https://gauravpatil.site",
    siteName: "Gaurav Patil Portfolio",
    images: [
      {
        url: "https://gauravpatil.site/og-image.png",
        width: 1200,
        height: 630,
        alt: "Gaurav Patil — Production Software Engineer",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gaurav Patil — Full Stack Developer & Software Engineer",
    description:
      "Official portfolio of Gaurav Patil, a Full Stack Developer & Software Engineer based in India specializing in Next.js, React, TypeScript, and modern scalable web architecture.",
    creator: "@gauravpatil",
    images: ["https://gauravpatil.site/og-image.png"],
  },
};
import { FloatingNav } from "@/components/ui/FloatingNav";
import ScrollToTop from "@/components/ui/ScrollToTop";
import { LivePortfolioSync } from "@/components/portfolio/LivePortfolioSync";
import { getPortfolioData } from "@/lib/public-data/getPortfolioData";
import { PortfolioJsonLd } from "@/components/seo/JsonLd";

import {
  GridSectionSkeleton,
  ProjectsSectionSkeleton,
  TestimonialsSectionSkeleton,
  ExperienceSectionSkeleton,
  ApproachSectionSkeleton,
  FooterSectionSkeleton,
} from "@/components/portfolio/skeletons";
import { AssistantBubbleSkeleton, AssistantErrorBoundary } from "@/components/assistant";

// Dynamically chunk and defer below-the-fold modules with dedicated skeletons
const GridSection = dynamic(
  () => import("@/components/portfolio/GridSection").then((m) => m.GridSection),
  { loading: () => <GridSectionSkeleton /> }
);
const ProjectsSection = dynamic(
  () => import("@/components/portfolio/ProjectsSection").then((m) => m.ProjectsSection),
  { loading: () => <ProjectsSectionSkeleton /> }
);
const TestimonialsSection = dynamic(
  () => import("@/components/portfolio/TestimonialsSection").then((m) => m.TestimonialsSection),
  { loading: () => <TestimonialsSectionSkeleton /> }
);
const ExperienceSection = dynamic(
  () => import("@/components/portfolio/ExperienceSection").then((m) => m.ExperienceSection),
  { loading: () => <ExperienceSectionSkeleton /> }
);
const ApproachSection = dynamic(
  () => import("@/components/portfolio/ApproachSection").then((m) => m.ApproachSection),
  { loading: () => <ApproachSectionSkeleton /> }
);
const FooterSection = dynamic(
  () => import("@/components/portfolio/FooterSection").then((m) => m.FooterSection),
  { loading: () => <FooterSectionSkeleton /> }
);
const AssistantBubble = dynamic(
  () => import("@/components/assistant").then((m) => m.AssistantBubble),
  { loading: () => <AssistantBubbleSkeleton /> }
);

export default async function Home() {
  const data = await getPortfolioData();

  const formattedNav = (data.navigation || []).map((item) => ({
    name: item.name,
    link: item.link,
  }));

  return (
    <main className="relative bg-black-100 flex justify-center items-center flex-col mx-auto sm:px-10 px-5 overflow-clip">
      <PortfolioJsonLd />
      <LivePortfolioSync />
      <div className="max-w-7xl w-full">
        <FloatingNav navItems={formattedNav} />

        {/* Critical first fold */}
        <HeroSection data={data.hero} />

        {/* Below-the-fold modules */}
        <div id="about" className="w-full scroll-mt-24 sm:scroll-mt-28">
          <GridSection cards={data.cards} />
        </div>

        <div id="projects" className="w-full scroll-mt-24 sm:scroll-mt-28">
          <ProjectsSection projects={data.projects} />
        </div>

        <div id="testimonials" className="w-full scroll-mt-24 sm:scroll-mt-28">
          <TestimonialsSection
            testimonials={data.testimonials}
            clients={data.clients}
          />
        </div>

        <div id="experience" className="w-full scroll-mt-24 sm:scroll-mt-28">
          <ExperienceSection experience={data.experience} />
        </div>

        <div id="approach" className="w-full scroll-mt-24 sm:scroll-mt-28">
          <ApproachSection phases={data.phases} />
        </div>

        <div id="contact" className="w-full scroll-mt-24 sm:scroll-mt-28">
          <FooterSection
            cta={data.cta}
            footer={data.footer}
            socialLinks={data.socialLinks}
          />
        </div>

        <ScrollToTop />
        <AssistantErrorBoundary>
          <AssistantBubble config={data.assistant} />
        </AssistantErrorBoundary>
      </div>
    </main>
  );
}
