// lib/firebase-utils.ts
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getDeviceInfo, DeviceInfo } from "./device-utils";
import { nanoid } from "nanoid";
import { db, auth } from "./firebase";

export type SessionData = {
  rayId: string;
  uid: string | null;
  timestamp: any;
  device: DeviceInfo;
};

export async function saveVisitorSession(): Promise<SessionData> {
  const auth = getAuth();
  const user = auth.currentUser;
  const rayId = nanoid(12);
  const device = getDeviceInfo();

  const data: SessionData = {
    rayId,
    uid: user ? user.uid : null,
    timestamp: serverTimestamp(),
    device,
  };

  const sessionRef = doc(db, "sessions", rayId);
  await setDoc(sessionRef, data);

  return data;
}
