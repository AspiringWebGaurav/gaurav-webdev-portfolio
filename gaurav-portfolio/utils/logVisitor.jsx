import { doc, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "./firebase";
import { UAParser } from "ua-parser-js";
import { getVisitorId } from "./uuid"; // ✅ assumes you have uuid.js with localStorage logic

export const logVisitor = async (sessionDuration = 0) => {
  try {
    const visitorId = getVisitorId(); // UUID-based
    const docRef = doc(db, "visitors", visitorId);

    const ipRes = await fetch("https://api.ipify.org?format=json");
    const { ip } = await ipRes.json();

    const parser = new UAParser();
    const result = parser.getResult();

    const now = new Date();
    const newSession = {
      timestamp: now.toISOString(),
      duration: sessionDuration,
    };

    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();

      if (data.banned === true) {
        console.warn("[logVisitor] Visitor is banned. No update made.");
        return { banned: true };
      }

      await updateDoc(docRef, {
        sessions: arrayUnion(newSession),
        device: result.device.type || "desktop",
        os: result.os.name || "unknown",
        browser: result.browser.name || "unknown",
        userAgent: result.ua,
        ip, // still good to track
      });
    } else {
      await setDoc(docRef, {
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
