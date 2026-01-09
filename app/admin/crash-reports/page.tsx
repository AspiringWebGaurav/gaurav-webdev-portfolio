"use client";

import { CrashReportProvider } from "@/crash-report-mechanism/contexts/CrashReportContext";
import CrashReportsManager from "@/crash-report-mechanism/components/admin/CrashReportsManager";

export default function CrashReportsPage() {
  return (
    <CrashReportProvider>
      <div className="p-6">
        <CrashReportsManager />
      </div>
    </CrashReportProvider>
  );
}
