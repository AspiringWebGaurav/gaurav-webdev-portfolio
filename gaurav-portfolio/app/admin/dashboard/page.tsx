"use client";

import useAuthGuard from "@/lib/hooks/useAuthGuard";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import DashboardNavbar from "./../../../components/admin/DashboardNavbar";
import VisitorLogs from "./../../../components/admin/VisitorLogs";

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

  if (loading) return <div>Loading...</div>;
  if (!authorized) return null; // just in case

  return (
    <main className="p-6">
      <DashboardNavbar />
      <VisitorLogs />
    </main>
  );
}
