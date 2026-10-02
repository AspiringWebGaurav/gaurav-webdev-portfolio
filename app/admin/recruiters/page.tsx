import React from "react";
import { AdminPageContainer, AdminSuspense } from "@/components/admin";
import { recruiterRepository } from "@/lib/dal/repositories/recruiter.repository";
import { RecruiterRosterTable } from "@/components/admin/recruiters/RecruiterRosterTable";
import { RecruiterActivityFeed } from "@/components/admin/recruiters/RecruiterActivityFeed";
import { FaUserCheck, FaBuilding, FaEye, FaBolt } from "react-icons/fa";

export const dynamic = "force-dynamic";

export default async function AdminRecruitersPage() {
  const [profilesRes, activityRes] = await Promise.all([
    recruiterRepository.getAllProfiles(200),
    recruiterRepository.getRecentActivity(50),
  ]);

  const profiles = profilesRes.data || [];
  const activities = activityRes.data || [];

  const totalVisits = profiles.reduce((sum, p) => sum + (p.totalVisits || 1), 0);
  const uniqueCompanies = new Set(profiles.map((p) => p.company.trim().toLowerCase())).size;

  return (
    <AdminPageContainer
      breadcrumb="RECRUITER PORTAL"
      subtitle="contact.gauravpatil.site Management"
      title="Verified Recruiter Roster & Activity"
    >
      <AdminSuspense fallbackTitle="Recruiter Hub">
        <div className="space-y-6">
          {/* Executive Metrics Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-lg bg-white border border-gray-200 shadow-2xs">
              <div className="flex items-center justify-between text-gray-400 mb-1">
                <span className="text-xs font-medium uppercase font-mono">Verified Recruiters</span>
                <FaUserCheck className="text-purple-600 text-sm" />
              </div>
              <div className="text-2xl font-bold font-mono text-gray-900">{profiles.length}</div>
              <div className="text-[11px] text-gray-500 mt-0.5">Authenticated via Email OTP</div>
            </div>

            <div className="p-4 rounded-lg bg-white border border-gray-200 shadow-2xs">
              <div className="flex items-center justify-between text-gray-400 mb-1">
                <span className="text-xs font-medium uppercase font-mono">Organizations</span>
                <FaBuilding className="text-blue-600 text-sm" />
              </div>
              <div className="text-2xl font-bold font-mono text-gray-900">{uniqueCompanies}</div>
              <div className="text-[11px] text-gray-500 mt-0.5">Companies represented</div>
            </div>

            <div className="p-4 rounded-lg bg-white border border-gray-200 shadow-2xs">
              <div className="flex items-center justify-between text-gray-400 mb-1">
                <span className="text-xs font-medium uppercase font-mono">Total Portal Visits</span>
                <FaEye className="text-emerald-600 text-sm" />
              </div>
              <div className="text-2xl font-bold font-mono text-gray-900">{totalVisits}</div>
              <div className="text-[11px] text-gray-500 mt-0.5">Across all sessions</div>
            </div>

            <div className="p-4 rounded-lg bg-white border border-gray-200 shadow-2xs">
              <div className="flex items-center justify-between text-gray-400 mb-1">
                <span className="text-xs font-medium uppercase font-mono">Logged Actions</span>
                <FaBolt className="text-amber-500 text-sm" />
              </div>
              <div className="text-2xl font-bold font-mono text-gray-900">{activities.length}</div>
              <div className="text-[11px] text-gray-500 mt-0.5">Recent engagement events</div>
            </div>
          </div>

          {/* Recruiter Roster Table */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-800 uppercase font-mono tracking-wider">
                Recruiter Roster
              </h2>
              <span className="text-xs text-gray-400">
                Sorted by most recent activity
              </span>
            </div>
            <RecruiterRosterTable initialProfiles={profiles} />
          </div>

          {/* Activity Stream */}
          <div>
            <RecruiterActivityFeed events={activities} />
          </div>
        </div>
      </AdminSuspense>
    </AdminPageContainer>
  );
}
