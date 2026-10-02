"use client";

import React, { useState, useMemo } from "react";
import type { RecruiterProfile } from "@/types/recruiter";
import { formatSubmissionTimestamp } from "@/lib/email/brevo";
import { FaSearch, FaFileCsv, FaFileCode, FaBuilding, FaPhone, FaEnvelope } from "react-icons/fa";

interface RecruiterRosterTableProps {
  initialProfiles: RecruiterProfile[];
}

export function RecruiterRosterTable({ initialProfiles }: RecruiterRosterTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProfiles = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return initialProfiles;
    return initialProfiles.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.company.toLowerCase().includes(term) ||
        p.email.toLowerCase().includes(term) ||
        (p.phone && p.phone.toLowerCase().includes(term))
    );
  }, [initialProfiles, searchTerm]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden">
      {/* Controls Bar */}
      <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/50">
        <div className="relative w-full sm:w-72">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter by name, company, email..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <a
            href="/api/admin/recruiters/export?format=csv"
            className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 rounded-md text-xs font-medium text-gray-700 flex items-center gap-1.5 transition shadow-2xs"
            title="Download CSV"
          >
            <FaFileCsv className="text-green-600 text-sm" />
            <span>Export CSV</span>
          </a>

          <a
            href="/api/admin/recruiters/export?format=json"
            className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 rounded-md text-xs font-medium text-gray-700 flex items-center gap-1.5 transition shadow-2xs"
            title="Download JSON"
          >
            <FaFileCode className="text-blue-600 text-sm" />
            <span>Export JSON</span>
          </a>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase font-mono text-[10px]">
            <tr>
              <th className="py-2.5 px-4">Recruiter / Organization</th>
              <th className="py-2.5 px-4">Contact</th>
              <th className="py-2.5 px-3">Country</th>
              <th className="py-2.5 px-3 text-center">Visits</th>
              <th className="py-2.5 px-4">First Verified</th>
              <th className="py-2.5 px-4">Latest Activity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {filteredProfiles.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-400 text-xs">
                  {searchTerm ? "No recruiters matching your search." : "No verified recruiters recorded yet."}
                </td>
              </tr>
            ) : (
              filteredProfiles.map((p) => {
                const firstVerifiedStr = p.firstVerifiedAt
                  ? formatSubmissionTimestamp(new Date(p.firstVerifiedAt))
                  : "—";
                const lastActiveStr = p.lastActiveAt
                  ? formatSubmissionTimestamp(new Date(p.lastActiveAt))
                  : "—";

                return (
                  <tr key={p.id} className="hover:bg-gray-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900">{p.name}</div>
                      <div className="text-[11px] text-purple-700 flex items-center gap-1 mt-0.5">
                        <FaBuilding className="text-[10px]" />
                        <span>{p.company}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-gray-900 font-mono text-[11px]">
                        <FaEnvelope className="text-gray-400 text-[10px]" />
                        <a href={`mailto:${p.email}`} className="hover:underline">
                          {p.email}
                        </a>
                      </div>
                      {p.phone && (
                        <div className="flex items-center gap-1 text-gray-600 font-mono text-[11px] mt-0.5">
                          <FaPhone className="text-gray-400 text-[9px]" />
                          <a href={`tel:${p.phone}`} className="hover:underline">
                            {p.phone}
                          </a>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3 font-mono">
                      {p.countryCode ? (
                        <span className="px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200 text-gray-800 text-[10px]">
                          {p.countryCode}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center font-mono font-medium text-gray-900">
                      {p.totalVisits || 1}
                    </td>

                    <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">
                      {firstVerifiedStr}
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-gray-900 font-mono text-[11px]">{lastActiveStr}</div>
                      {p.lastAction && (
                        <div className="mt-0.5">
                          <span className="inline-block px-1.5 py-0.2 rounded bg-purple-50 border border-purple-200 text-purple-700 text-[10px] font-mono">
                            {p.lastAction}
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
