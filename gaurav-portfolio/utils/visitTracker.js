// utils/visitTracker.js
import { doc, runTransaction } from "firebase/firestore";
import { db } from "@/utils/firebase"; // adjust path if firebase config is elsewhere

export const getNextVisitId = async () => {
  const counterRef = doc(db, "metadata", "visitCounter");

  try {
    const newVisitId = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);

      if (!counterDoc.exists()) {
        transaction.set(counterRef, { value: 1 });
        return 1;
      }

      const current = counterDoc.data().value || 0;
      const next = current + 1;
      transaction.update(counterRef, { value: next });
      return next;
    });

    return newVisitId;
  } catch (err) {
    console.error("Failed to get next visit ID:", err);
    return null;
  }
};
