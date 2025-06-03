"use client";

import BanGate from "@/components/BanGate";
import Hero from "@/components/Hero";
import { FloatingNav } from "../components/ui/FloatingNav";
import { navItems } from "@/data";
import Grid from "@/components/Grid";
import RecentProjects from "@/components/RecentProjects";
import Clients from "@/components/Clients";
import Experience from "@/components/Experience";
import Approach from "@/components/Approach";
import Footer from "@/components/Footer";
import VisitorStatusWatcher from "@/components/VisitorStatusWatcher";

export default function Home() {
  return (
    <BanGate>
      <main className="relative bg-black-100 flex justify-center items-center flex-col mx-auto sm:px-10 px-5 overflow-clip">
        <VisitorStatusWatcher />
        <div>
          <h1 className="text-white max-w-7xl w-full">
            <FloatingNav navItems={navItems} />
            <Hero />
            <Grid />
            <RecentProjects />
            <Clients />
            <Experience />
            <Approach />
            <Footer />
          </h1>
        </div>
      </main>
    </BanGate>
  );
}
