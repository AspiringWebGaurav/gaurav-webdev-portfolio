"use client";
import { useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import {
  showBanToast,
  showUnbanToast,
  showProcessingToast,
} from "@/components/ToastSystem";
import { useRouter } from "next/navigation";

export default function VisitorStatusWatcher() {
  const router = useRouter();
  const lastStatus = useRef(null); // ✅ Track last seen status

  console.log("👀 VisitorStatusWatcher mounted");

  useEffect(() => {
    const cookies = document.cookie.split(";").reduce((acc, curr) => {
      const [k, v] = curr.trim().split("=");
      acc[k] = v;
      return acc;
    }, {});
    const uuid = cookies.uuid;

    console.log("🍪 Cookies parsed:", cookies);
    console.log("🔍 UUID found:", uuid);

    if (!uuid) {
      console.warn("❌ No UUID found in cookies. Listener not started.");
      return;
    }

    const docRef = doc(db, "visitors", uuid);
    console.log("👂 Listening to Firestore doc:", docRef.path);

    const unsub = onSnapshot(docRef, (snapshot) => {
      if (!snapshot.exists()) {
        console.warn("❌ Visitor doc not found in Firestore");
        return;
      }

      const data = snapshot.data();
      const currentStatus = data.status;

      console.log("📡 Firestore status update:", data);

      // ✅ Skip toast on first load
      if (lastStatus.current === null) {
        lastStatus.current = currentStatus;
        return;
      }

      // ✅ React only to actual status changes
      if (currentStatus !== lastStatus.current) {
        if (currentStatus === "banned") {
          showBanToast();
          setTimeout(() => {
            showProcessingToast("🔁 Redirecting to ban page...");
            setTimeout(() => {
              router.refresh();
              router.push("/ban");
            }, 1500);
          }, 2000);
        }

        if (currentStatus === "active") {
          showUnbanToast();
          setTimeout(() => {
            showProcessingToast("🔄 Redirecting to homepage...");
            setTimeout(() => {
              router.refresh();
              router.push("/");
            }, 1500);
          }, 2000);
        }

        lastStatus.current = currentStatus;
      }
    });

    return () => {
      console.log("🧹 Cleaning up Firestore listener");
      unsub();
    };
  }, []);

  return null;
}
