"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { logVisitor } from "@/utils/logVisitor";
import Hero from "@/components/Hero";
import { FloatingNav } from "./../components/ui/FloatingNav";
import { navItems } from "@/data";
import Grid from "@/components/Grid";
import RecentProjects from "@/components/RecentProjects";
import Clients from "@/components/Clients";
import Experience from "@/components/Experience";
import Approach from "@/components/Approach";
import Footer from "@/components/Footer";
import { db } from "@/utils/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const start = Date.now();

    const banURL =
      process.env.NODE_ENV === "development"
        ? "http://localhost:5173/ban"
        : "https://gaurav-portfolio-admin-services.netlify.app/ban";

    let unsub: any;

    const monitorBanStatus = async () => {
      try {
        const ipRes = await fetch("https://api.ipify.org?format=json");
        const { ip } = await ipRes.json();

        const docRef = doc(db, "visitors", ip);
        unsub = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists() && docSnap.data().banned === true) {
            window.location.href = banURL;
          }
        });
      } catch (err) {
        console.error("Failed to set up ban listener:", err);
      }
    };

    logVisitor(0).then((res) => {
      if (res?.banned) {
        window.location.href = banURL;
      } else {
        monitorBanStatus();

        const handleBeforeUnload = () => {
          const duration = Math.floor((Date.now() - start) / 1000);
          logVisitor(duration);
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => {
          window.removeEventListener("beforeunload", handleBeforeUnload);
          if (unsub) unsub();
        };
      }
    });
  }, [router]);

  return (
    <main className="relative bg-black-100 flex justify-center items-center flex-col mx-auto sm:px-10 px-5 overflow-clip">
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
  );
}
