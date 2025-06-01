import { doc, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "./firebase";
import { UAParser } from "ua-parser-js";

// Core visitor logger
export const logVisitor = async (sessionDuration = 0) => {
  try {
    const ipRes = await fetch("https://api.ipify.org?format=json");
    const { ip } = await ipRes.json();
    const ipDocRef = doc(db, "visitors", ip);

    const parser = new UAParser();
    const result = parser.getResult();

    const now = new Date();
    const newSession = {
      timestamp: now.toISOString(),
      duration: sessionDuration,
    };

    const docSnap = await getDoc(ipDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data();

      // ⛔ Banned? Stop everything.
      if (data.banned) {
        return { banned: true };
      }

      // 📝 Update sessions only
      await updateDoc(ipDocRef, {
        sessions: arrayUnion(newSession),
        // optionally update device/browser if they change
        device: result.device.type || "desktop",
        os: result.os.name || "unknown",
        browser: result.browser.name || "unknown",
        userAgent: result.ua,
      });
    } else {
      // 🆕 New IP — create doc
      await setDoc(ipDocRef, {
        ip,
        device: result.device.type || "desktop",
        os: result.os.name || "unknown",
        browser: result.browser.name || "unknown",
        userAgent: result.ua,
        banned: false,
        sessions: [newSession],
      });
    }

    return { banned: false };
  } catch (err) {
    console.error("Failed to log visitor", err);
    return { error: true };
  }
};
