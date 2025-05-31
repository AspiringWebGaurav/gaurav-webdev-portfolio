"use client";

import useAuthGuard from "@/lib/hooks/useAuthGuard";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import DashboardNavbar from "@/components/admin/DashboardNavbar";
import Loader from "@/components/Loader";

interface VisitorLog {
  id: string;
  ip: string;
  userAgent: string;
  timestamp: string;
  city?: string;
  country?: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { loading, authorized } = useAuthGuard();
  const [logs, setLogs] = useState<VisitorLog[]>([]);

  useEffect(() => {
    if (authorized) {
      loadLogs();
    }
  }, [authorized]);

  const loadLogs = async () => {
    const snapshot = await getDocs(collection(db, "visitorLogs"));
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as VisitorLog[];
    setLogs(data);
  };

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/admin/login");
  };

  if (loading)
    return (
      <div>
        <Loader />
      </div>
    );
  if (!authorized) return null;

  return (
    <main className="p-6">
      <DashboardNavbar />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-6">
        {/* Visitors Card */}
        <a
          href="/admin/visitors"
          target="_blank"
          rel="noopener noreferrer"
          className="block p-6 bg-white rounded-2xl shadow-md hover:shadow-xl transition duration-300"
        >
          <h2 className="text-xl font-semibold mb-2">Visitors</h2>
          <p className="text-gray-600">
            View website visitor logs and details.
          </p>
        </a>

        {/* Add more cards here as needed */}
        {/* Example: Analytics, Users, Messages etc. */}
      </div>
    </main>
  );
}
