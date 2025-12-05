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

export default function Home() {
  return (
    <main className="relative bg-black-100 flex justify-center items-center flex-col mx-auto sm:px-10 px-5 overflow-clip">
      <div className="w-full">
        <FloatingNav navItems={navItems} />
        <section id="hero">
          <Hero />
        </section>
        <section id="about">
          <Grid />
        </section>
        <section id="currently-working">
          <CurrentlyWorking />
        </section>
        <section id="projects">
          <RecentProjects />
        </section>
        <section id="testimonials">
          <Clients />
        </section>
        <section id="experience">
          <Experience />
        </section>
        <section id="approach">
          <Approach />
        </section>
        <section id="bug-hunt">
          <BugHunt />
        </section>
        <section id="contact">
          <Footer />
        </section>
      </div>
    </main>
  );
}
