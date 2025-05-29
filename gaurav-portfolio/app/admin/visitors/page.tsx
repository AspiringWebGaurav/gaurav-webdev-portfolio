"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";

type Visitor = {
  rayId: string;
  uid: string | null;
  timestamp: Timestamp;
  device: {
    browser: string;
    os: string;
    deviceType: string;
  };
};

const getTimeOfDay = (hour: number): string => {
  if (hour >= 5 && hour < 11) return "morning";
  if (hour >= 11 && hour < 17) return "mid-day";
  return "night";
};

export default function VisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [currentRayId, setCurrentRayId] = useState<string | null>(null);
  const [deviceFilter, setDeviceFilter] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const pageSize = 10;

  useEffect(() => {
    const fetchData = async () => {
      const q = query(collection(db, "sessions"), orderBy("timestamp", "desc"));
      const snap = await getDocs(q);
      const all: Visitor[] = [];

      snap.forEach((doc) => {
        const d = doc.data() as Visitor;
        all.push(d);
      });

      setVisitors(all);
      setCurrentRayId(sessionStorage.getItem("rayId"));
    };

    fetchData();
  }, []);

  const filtered = visitors.filter((v) => {
    const hour = v.timestamp.toDate().getHours();
    const timeOfDay = getTimeOfDay(hour);

    return (
      (deviceFilter === "all" || v.device.deviceType === deviceFilter) &&
      (timeFilter === "all" || timeFilter === timeOfDay)
    );
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const current = visitors.find((v) => v.rayId === currentRayId);

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Visitor Sessions</h1>
        <Card className="bg-black border-white text-white shadow-lg">
          <CardContent className="py-2 px-4 text-lg font-semibold">
            Total: {visitors.length}
          </CardContent>
        </Card>
      </div>

      {current && (
        <Card className="border-green-600 bg-green-950 text-white shadow-md">
          <CardHeader>
            <CardTitle className="text-green-400">Live Session</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              <strong>Ray ID:</strong> {current.rayId}
            </p>
            <p>
              <strong>UID:</strong> {current.uid ?? "Anonymous"}
            </p>
            <p>
              <strong>Device:</strong> {current.device.browser} /{" "}
              {current.device.os} ({current.device.deviceType})
            </p>
            <p>
              <strong>Time:</strong>{" "}
              {current.timestamp?.toDate().toLocaleString()}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-4 items-center">
        <Select onValueChange={setDeviceFilter} defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter Device Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Devices</SelectItem>
            <SelectItem value="desktop">Desktop</SelectItem>
            <SelectItem value="mobile">Mobile</SelectItem>
            <SelectItem value="tablet">Tablet</SelectItem>
          </SelectContent>
        </Select>

        <Select onValueChange={setTimeFilter} defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter Time of Day" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Times</SelectItem>
            <SelectItem value="morning">Morning</SelectItem>
            <SelectItem value="mid-day">Mid-Day</SelectItem>
            <SelectItem value="night">Night</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {paginated.map((visitor) => (
          <Card key={visitor.rayId} className="bg-neutral-900 text-white">
            <CardContent className="p-4 space-y-2">
              <p>
                <strong>Ray ID:</strong> {visitor.rayId}
              </p>
              <p>
                <strong>UID:</strong> {visitor.uid ?? "Anonymous"}
              </p>
              <p>
                <strong>Device:</strong> {visitor.device.browser} /{" "}
                {visitor.device.os} ({visitor.device.deviceType})
              </p>
              <p>
                <strong>Time:</strong>{" "}
                {visitor.timestamp?.toDate().toLocaleString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-center items-center gap-4 mt-6">
        <Button
          variant="secondary"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </Button>
        <span className="text-white text-sm">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="secondary"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
