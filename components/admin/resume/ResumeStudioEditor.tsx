"use client";

import React, { useState } from "react";
import {
  FaFloppyDisk,
  FaArrowUpRightFromSquare,
  FaFileLines,
  FaBriefcase,
  FaCode,
  FaGraduationCap,
  FaUser,
} from "react-icons/fa6";
import type { ResumeData } from "@/types/resume";

interface ResumeStudioEditorProps {
  initialData: ResumeData;
}

export const ResumeStudioEditor: React.FC<ResumeStudioEditorProps> = ({
  initialData,
}) => {
  const [data, setData] = useState<ResumeData>(initialData);
  const [activeTab, setActiveTab] = useState<"basics" | "skills" | "experience" | "projects" | "education">("basics");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus(null);

    try {
      const res = await fetch("/api/admin/resume", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Failed to save resume");
      }

      setData(json.data);
      setSaveStatus("Saved successfully to Firebase & Cache!");
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving";
      setSaveStatus(`Error: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center">
            <FaFileLines className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 font-admin-mono">Resume Content Studio</h2>
            <p className="text-xs text-gray-500">Live authoritative content for resume.gauravpatil.site</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saveStatus && (
            <span className={`text-xs font-medium px-2.5 py-1 rounded ${
              saveStatus.startsWith("Error") ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
            }`}>
              {saveStatus}
            </span>
          )}

          <a
            href="/resume"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors"
          >
            <span>Live Preview</span>
            <FaArrowUpRightFromSquare className="w-3 h-3 text-gray-400" />
          </a>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <FaFloppyDisk className="w-3.5 h-3.5" />
            <span>{isSaving ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      </div>

      {/* Portal Availability & Lifecycle Kill Switch */}
      <div className="p-4.5 rounded-xl bg-white border border-gray-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-gray-900 font-admin-mono flex items-center gap-2">
              <span>Portal Availability & Lifecycle Control</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                (data.status || "active") === "active"
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  : (data.status === "hired")
                  ? "bg-purple-100 text-purple-800 border border-purple-200"
                  : "bg-amber-100 text-amber-800 border border-amber-200"
              }`}>
                {(data.status || "active").toUpperCase()}
              </span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Control public availability of resume.gauravpatil.site. Suspend the portal or announce hire without redeploying.
            </p>
          </div>

          {/* Quick status selector */}
          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setData({ ...data, status: "active" })}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                (data.status || "active") === "active"
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              🟢 Active
            </button>
            <button
              type="button"
              onClick={() => setData({ ...data, status: "hired" })}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                data.status === "hired"
                  ? "bg-white text-purple-700 shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              💼 Hired
            </button>
            <button
              type="button"
              onClick={() => setData({ ...data, status: "suspended" })}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                data.status === "suspended"
                  ? "bg-white text-amber-700 shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              ⏸️ Suspend
            </button>
          </div>
        </div>

        {/* Custom status message input when not active */}
        {(data.status === "hired" || data.status === "suspended") && (
          <div className="pt-2 border-t border-gray-100 space-y-1 animate-in fade-in duration-150">
            <label className="text-xs font-semibold text-gray-700">
              Custom Status Message (Displayed publicly to visitors)
            </label>
            <input
              type="text"
              value={data.statusMessage || ""}
              onChange={(e) => setData({ ...data, statusMessage: e.target.value })}
              placeholder={
                data.status === "hired"
                  ? "e.g. Gaurav has accepted an offer and is no longer actively interviewing. Thank you!"
                  : "e.g. Resume access is temporarily paused. Please reach out via email or LinkedIn."
              }
              className="w-full text-xs px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-purple-500 font-sans"
            />
          </div>
        )}
      </div>

      {/* Editor Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-gray-200 pb-2 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => setActiveTab("basics")}
          className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors cursor-pointer ${
            activeTab === "basics" ? "bg-purple-100 text-purple-800 font-bold" : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <FaUser className="w-3.5 h-3.5" />
          <span>Basics & Summary</span>
        </button>
        <button
          onClick={() => setActiveTab("skills")}
          className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors cursor-pointer ${
            activeTab === "skills" ? "bg-purple-100 text-purple-800 font-bold" : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <FaCode className="w-3.5 h-3.5" />
          <span>Technical Skills</span>
        </button>
        <button
          onClick={() => setActiveTab("experience")}
          className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors cursor-pointer ${
            activeTab === "experience" ? "bg-purple-100 text-purple-800 font-bold" : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <FaBriefcase className="w-3.5 h-3.5" />
          <span>Work Experience</span>
        </button>
        <button
          onClick={() => setActiveTab("projects")}
          className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors cursor-pointer ${
            activeTab === "projects" ? "bg-purple-100 text-purple-800 font-bold" : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <FaFileLines className="w-3.5 h-3.5" />
          <span>Engineered Projects</span>
        </button>
        <button
          onClick={() => setActiveTab("education")}
          className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors cursor-pointer ${
            activeTab === "education" ? "bg-purple-100 text-purple-800 font-bold" : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <FaGraduationCap className="w-3.5 h-3.5" />
          <span>Education & Certs</span>
        </button>
      </div>

      {/* Editor Tab Content */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
        {/* 1. Basics */}
        {activeTab === "basics" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={data.basics.name}
                  onChange={(e) =>
                    setData({ ...data, basics: { ...data.basics, name: e.target.value } })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Professional Label / Title</label>
                <input
                  type="text"
                  value={data.basics.label}
                  onChange={(e) =>
                    setData({ ...data, basics: { ...data.basics, label: e.target.value } })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Primary Email</label>
                <input
                  type="email"
                  value={data.basics.email}
                  onChange={(e) =>
                    setData({ ...data, basics: { ...data.basics, email: e.target.value } })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={data.basics.location}
                  onChange={(e) =>
                    setData({ ...data, basics: { ...data.basics, location: e.target.value } })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">LinkedIn URL</label>
                <input
                  type="url"
                  value={data.basics.linkedin}
                  onChange={(e) =>
                    setData({ ...data, basics: { ...data.basics, linkedin: e.target.value } })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">GitHub URL</label>
                <input
                  type="url"
                  value={data.basics.github}
                  onChange={(e) =>
                    setData({ ...data, basics: { ...data.basics, github: e.target.value } })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Executive Summary</label>
              <textarea
                rows={4}
                value={data.basics.summary}
                onChange={(e) =>
                  setData({ ...data, basics: { ...data.basics, summary: e.target.value } })
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* 2. Technical Skills */}
        {activeTab === "skills" && (
          <div className="space-y-4">
            <p className="text-xs text-gray-500">Edit skill categories and comma-separated technologies.</p>
            {data.skillCategories.map((cat, idx) => (
              <div key={idx} className="p-3.5 rounded-lg border border-gray-200 bg-gray-50/50 space-y-2">
                <input
                  type="text"
                  value={cat.category}
                  onChange={(e) => {
                    const next = [...data.skillCategories];
                    next[idx].category = e.target.value;
                    setData({ ...data, skillCategories: next });
                  }}
                  className="w-full font-bold text-xs text-gray-800 bg-transparent border-b border-gray-300 focus:outline-none focus:border-purple-600 pb-1"
                />
                <input
                  type="text"
                  value={cat.skills.join(", ")}
                  onChange={(e) => {
                    const next = [...data.skillCategories];
                    next[idx].skills = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                    setData({ ...data, skillCategories: next });
                  }}
                  className="w-full text-xs text-gray-700 bg-white border border-gray-200 rounded p-2 focus:outline-none focus:border-purple-600"
                />
              </div>
            ))}
          </div>
        )}

        {/* 3. Work Experience */}
        {activeTab === "experience" && (
          <div className="space-y-5">
            {data.experience.map((exp, idx) => (
              <div key={exp.id} className="p-4 rounded-lg border border-gray-200 bg-gray-50/50 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600">Company</label>
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) => {
                        const next = [...data.experience];
                        next[idx].company = e.target.value;
                        setData({ ...data, experience: next });
                      }}
                      className="w-full text-xs font-bold border border-gray-300 rounded p-1.5"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600">Role / Title</label>
                    <input
                      type="text"
                      value={exp.role}
                      onChange={(e) => {
                        const next = [...data.experience];
                        next[idx].role = e.target.value;
                        setData({ ...data, experience: next });
                      }}
                      className="w-full text-xs border border-gray-300 rounded p-1.5"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600">Duration</label>
                    <input
                      type="text"
                      value={`${exp.startDate} - ${exp.endDate}`}
                      onChange={(e) => {
                        const next = [...data.experience];
                        const parts = e.target.value.split("-");
                        next[idx].startDate = parts[0]?.trim() || "";
                        next[idx].endDate = parts[1]?.trim() || "";
                        setData({ ...data, experience: next });
                      }}
                      className="w-full text-xs border border-gray-300 rounded p-1.5"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-600">Bullet Points (One per line)</label>
                  <textarea
                    rows={4}
                    value={exp.highlights.join("\n")}
                    onChange={(e) => {
                      const next = [...data.experience];
                      next[idx].highlights = e.target.value.split("\n").filter((l) => l.trim().length > 0);
                      setData({ ...data, experience: next });
                    }}
                    className="w-full text-xs border border-gray-300 rounded p-2"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 4. Projects */}
        {activeTab === "projects" && (
          <div className="space-y-4">
            {data.projects.map((proj, idx) => (
              <div key={proj.id} className="p-4 rounded-lg border border-gray-200 bg-gray-50/50 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600">Project Name</label>
                    <input
                      type="text"
                      value={proj.name}
                      onChange={(e) => {
                        const next = [...data.projects];
                        next[idx].name = e.target.value;
                        setData({ ...data, projects: next });
                      }}
                      className="w-full text-xs font-bold border border-gray-300 rounded p-1.5"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600">Tech Stack (comma-separated)</label>
                    <input
                      type="text"
                      value={proj.techStack.join(", ")}
                      onChange={(e) => {
                        const next = [...data.projects];
                        next[idx].techStack = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                        setData({ ...data, projects: next });
                      }}
                      className="w-full text-xs border border-gray-300 rounded p-1.5"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-600">Description</label>
                  <input
                    type="text"
                    value={proj.description}
                    onChange={(e) => {
                      const next = [...data.projects];
                      next[idx].description = e.target.value;
                      setData({ ...data, projects: next });
                    }}
                    className="w-full text-xs border border-gray-300 rounded p-1.5"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 5. Education */}
        {activeTab === "education" && (
          <div className="space-y-4">
            {data.education.map((edu, idx) => (
              <div key={edu.id} className="p-4 rounded-lg border border-gray-200 bg-gray-50/50 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600">Degree</label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => {
                        const next = [...data.education];
                        next[idx].degree = e.target.value;
                        setData({ ...data, education: next });
                      }}
                      className="w-full text-xs font-bold border border-gray-300 rounded p-1.5"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600">Institution</label>
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) => {
                        const next = [...data.education];
                        next[idx].institution = e.target.value;
                        setData({ ...data, education: next });
                      }}
                      className="w-full text-xs border border-gray-300 rounded p-1.5"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
