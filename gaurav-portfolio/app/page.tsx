// app/page.tsx
"use client";
import { useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/utils/firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { UAParser } from "ua-parser-js";
import Hero from "@/components/Hero";
import { FloatingNav } from "../components/ui/FloatingNav";
import { navItems } from "@/data";
import Grid from "@/components/Grid";
import RecentProjects from "@/components/RecentProjects";
import Clients from "@/components/Clients";
import Experience from "@/components/Experience";
import Approach from "@/components/Approach";
import Footer from "@/components/Footer";

export default function Home() {
  useEffect(() => {
    const logVisit = async () => {
      try {
        const ipRes = await fetch("https://ipapi.co/json");
        const ipData = await ipRes.json();
        const ip = ipData.ip;

        const visitorsRef = collection(db, "visitors");
        const q = query(visitorsRef, where("ip", "==", ip));
        const existing = await getDocs(q);

        if (existing.empty) {
          const uuid = uuidv4() + "-" + btoa(ip).replace(/=+$/, "");
          const parser = new UAParser();
          const ua = parser.getResult();

          await addDoc(visitorsRef, {
            uuid,
            ip,
            timestamp: new Date().toISOString(),
            device: ua.device.type || "desktop",
            os: ua.os.name + " " + ua.os.version,
            status: "active",
          });
        }
      } catch (err) {
        console.error("Error logging visitor:", err);
      }
    };

    logVisit();
  }, []);

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
