"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

export default function BanGate({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const alreadyChecked = sessionStorage.getItem("banCheckDone");

    if (alreadyChecked) {
      setAllowed(true);
      return;
    }

    const uuid = Cookies.get("uuid");
    if (!uuid) {
      setAllowed(true);
      return;
    }

    setLoading(true);

    const checkStatus = async () => {
      try {
        const res = await fetch(`/check-status?uuid=${uuid}`);
        const data = await res.json();

        if (data.status === "banned") {
          window.location.href = `/ban?uuid=${uuid}`;
        } else {
          sessionStorage.setItem("banCheckDone", "true");
          setTimeout(() => {
            setAllowed(true);
            setLoading(false);
          }, 3000); // loader delay
        }
      } catch {
        sessionStorage.setItem("banCheckDone", "true");
        setTimeout(() => {
          setAllowed(true);
          setLoading(false);
        }, 3000);
      }
    };

    checkStatus();
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-white border-t-transparent" />
      </div>
    );
  }

  return allowed ? <>{children}</> : null;
}
