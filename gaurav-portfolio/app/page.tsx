"use client";

import { useEffect } from "react";
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
import VisitorStatusWatcher from "@/components/VisitorStatusWatcher"; // ✅ ADD THIS

export default function Home() {
  useEffect(() => {
    const logVisit = async () => {
      try {
        const cookies = document.cookie.split(";").reduce((acc, curr) => {
          const [k, v] = curr.trim().split("=");
          acc[k] = v;
          return acc;
        }, {} as Record<string, string>);

        const uuid = cookies.uuid;
        const visitId = cookies.visitId;

        if (!uuid || !visitId) {
          console.warn("❌ Missing UUID or Visit ID from cookies");
          return;
        }

        let ip = "unknown";
        try {
          const res = await fetch("https://ipapi.co/json");
          const data = await res.json();
          ip = data.ip || "unknown";
        } catch (err) {
          console.warn("⚠️ Could not fetch IP:", err);
        }

        const parser = new UAParser();
        const ua = parser.getResult();

        const payload = {
          uuid,
          visitId,
          ip,
          device: ua.device.type || "desktop",
          os: `${ua.os.name} ${ua.os.version}`,
          timestamp: new Date().toISOString(),
        };

        console.log("📡 Sending visit payload:", payload);

        const res = await fetch("/api/log-visit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const result = await res.json();
        console.log("✅ Visit log result:", result);
      } catch (err) {
        console.error("🔥 Error logging visit:", err);
      }
    };

    logVisit();
  }, []);

  return (
    <main className="relative bg-black-100 flex justify-center items-center flex-col mx-auto sm:px-10 px-5 overflow-clip">
      <VisitorStatusWatcher /> {/* ✅ MOUNT THIS */}
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
