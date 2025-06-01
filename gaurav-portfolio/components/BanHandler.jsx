"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/utils/firebase";
import { getVisitorId } from "@/utils/uuid";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BanOverlay from "./BanOverlay";
import { getEnvURL } from "@/utils/env";

export default function BanHandler() {
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    const visitorId = getVisitorId();
    const docRef = doc(db, "visitors", visitorId);

    const unsub = onSnapshot(docRef, (docSnap) => {
      if (!docSnap.exists()) return;

      const data = docSnap.data();

      if (data.banned === true && status !== "banned") {
        setStatus("banned");

        toast.info("🚫 You are being banned. Redirecting...", {
          autoClose: 2000,
          closeButton: false,
          hideProgressBar: true,
        });

        setTimeout(() => {
          window.location.href = `/ban`;
        }, 2000);
      }

      if (data.banned === false && window.location.href.includes("/ban")) {
        setStatus("unbanned");

        let countdown = 5;
        const toastId = toast.info(`🔓 Unbanning in Progress — ${countdown}`, {
          autoClose: false,
          closeButton: false,
          hideProgressBar: true,
        });

        const interval = setInterval(() => {
          countdown--;
          if (countdown > 0) {
            toast.update(toastId, {
              render: `🔓 Unbanning in Progress — ${countdown}`,
            });
          } else {
            clearInterval(interval);
            toast.dismiss(toastId);

            let enterCountdown = 3;
            const enterToastId = toast.info(
              `🚀 Entering Portfolio — ${enterCountdown}`,
              {
                autoClose: false,
                closeButton: false,
                hideProgressBar: true,
              }
            );

            const enterInterval = setInterval(() => {
              enterCountdown--;
              if (enterCountdown > 0) {
                toast.update(enterToastId, {
                  render: `🚀 Entering Portfolio — ${enterCountdown}`,
                });
              } else {
                clearInterval(enterInterval);
                toast.dismiss(enterToastId);
                window.location.href = `${getEnvURL("portfolio")}/`;
              }
            }, 1000);
          }
        }, 1000);
      }
    });

    return () => unsub();
  }, [status]);

  return (
    <>
      <ToastContainer />
      {status === "banned" && <BanOverlay type="banned" />}
      {status === "unbanned" && <BanOverlay type="unbanned" />}
    </>
  );
}
