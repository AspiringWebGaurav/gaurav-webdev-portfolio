"use client";

import React from "react";
import {
  IoMailOutline,
  IoLocationOutline,
  IoGlobeOutline,
  IoLogoGithub,
  IoLogoLinkedin,
} from "react-icons/io5";
import type { ResumeData } from "@/types/resume";

interface ResumePaperViewProps {
  data: ResumeData;
  isUnlocked: boolean;
}

export const ResumePaperView: React.FC<ResumePaperViewProps> = ({
  data,
  isUnlocked,
}) => {
  const { basics, skillCategories, experience, projects, education, certifications } = data;

  return (
    <div className="relative w-full flex flex-col items-center justify-start pt-3 xs:pt-4 sm:pt-6 pb-6 sm:pb-8 px-2 xs:px-3 sm:px-4 md:px-6 select-text">
      {/* The Physical A4 Paper Document Container */}
      <div className="w-full flex justify-center">
        <article
          id="resume-document-page"
          className={`relative w-full max-w-[850px] bg-[#FFFFFF] dark:bg-[#0E0E12] text-[#0F172A] dark:text-zinc-100 font-sans px-4 xs:px-6 sm:px-8 md:px-11 lg:px-12 pt-6 xs:pt-7 sm:pt-9 md:pt-10 pb-6 sm:pb-8 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.06)] rounded-sm print:m-0 print:p-8 print:shadow-none print:max-w-none print:min-h-0 print:rounded-none transition-all duration-300 ${
            !isUnlocked ? "filter blur-sm pointer-events-none select-none" : "filter-none"
          }`}
          style={{
            fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          }}
        >
          {/* 1. Header & Identity */}
          <header className="border-b border-slate-200 dark:border-zinc-800 pb-4 sm:pb-5 mb-4 sm:mb-5">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 sm:gap-2">
              <div>
                <h1 className="text-2xl xs:text-3xl sm:text-3xl md:text-[34px] font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                  {basics.name}
                </h1>
                <p className="text-xs xs:text-sm sm:text-base md:text-[15.5px] font-semibold text-[#4F46E5] dark:text-[#818CF8] mt-1 sm:mt-1.5">
                  {basics.label}
                </p>
              </div>

              {/* Contact meta strip (Fluid wrap on mobile, neat right-aligned column on tablet/desktop) */}
              <div className="flex flex-wrap sm:flex-col sm:items-end gap-x-3 gap-y-1.5 sm:gap-y-1 text-xs sm:text-[13px] md:text-[13.5px] text-slate-600 dark:text-zinc-400 font-medium">
                <span className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors">
                  <IoMailOutline className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-zinc-500" />
                  <a href={`mailto:${basics.email}`} className="hover:underline break-all sm:break-normal">
                    {basics.email}
                  </a>
                </span>
                <span className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors">
                  <IoGlobeOutline className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-zinc-500" />
                  <a href={basics.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {basics.website.replace("https://", "")}
                  </a>
                </span>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white transition-colors">
                    <IoLogoGithub className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-zinc-500" />
                    <a href={basics.github} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      GitHub
                    </a>
                  </span>
                  <span className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white transition-colors">
                    <IoLogoLinkedin className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-zinc-500" />
                    <a href={basics.linkedin} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      LinkedIn
                    </a>
                  </span>
                  <span className="inline-flex items-center gap-1 text-slate-500 dark:text-zinc-400 shrink-0">
                    <IoLocationOutline className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-zinc-500" />
                    {basics.location}
                  </span>
                </div>
              </div>
            </div>

            {/* Summary paragraph */}
            {basics.summary && (
              <p className="text-xs sm:text-[13.5px] md:text-[14px] text-slate-700 dark:text-zinc-300 leading-relaxed mt-3 sm:mt-4 text-left sm:text-justify">
                {basics.summary}
              </p>
            )}
          </header>

          {/* 2. Main Structured Sections */}
          <div className="space-y-4 sm:space-y-5">
            {/* Technical Skills */}
            <section>
              <h2 className="text-xs sm:text-[13px] md:text-[13.5px] font-bold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-200 dark:border-zinc-800 pb-1.5 mb-2.5">
                Technical Skills
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 md:gap-x-6 gap-y-1.5 text-xs sm:text-[13px] md:text-[13.5px]">
                {skillCategories.map((cat, idx) => (
                  <div key={idx} className="leading-snug break-words">
                    <strong className="text-slate-900 dark:text-white font-semibold">{cat.category}: </strong>
                    <span className="text-slate-600 dark:text-zinc-400">{cat.skills.join(", ")}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Experience */}
            <section>
              <h2 className="text-xs sm:text-[13px] md:text-[13.5px] font-bold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-200 dark:border-zinc-800 pb-1.5 mb-3">
                Experience
              </h2>
              <div className="space-y-3.5 sm:space-y-4">
                {experience.map((exp) => (
                  <div key={exp.id}>
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-0.5 sm:gap-2 font-semibold text-slate-900 dark:text-white leading-tight">
                      <div>
                        <span className="text-slate-900 dark:text-white font-bold text-xs sm:text-sm md:text-[15px]">{exp.role}</span>
                        <span className="text-slate-400 dark:text-zinc-500 font-normal"> · </span>
                        <span className="text-[#4F46E5] dark:text-[#818CF8] font-semibold text-xs sm:text-sm md:text-[15px]">{exp.company}</span>
                      </div>
                      <span className="text-[11px] sm:text-xs md:text-[13px] text-slate-500 dark:text-zinc-400 font-normal sm:text-right shrink-0 mt-0.5 sm:mt-0">
                        {exp.startDate} – {exp.endDate}
                      </span>
                    </div>
                    <ul className="list-disc list-outside ml-4 sm:ml-5 mt-1.5 space-y-1 text-xs sm:text-[13px] md:text-[13.5px] text-slate-700 dark:text-zinc-300 leading-relaxed">
                      {exp.highlights.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {/* Projects (Responsive: Titles, demo badges & tags stack naturally on mobile) */}
            <section>
              <h2 className="text-xs sm:text-[13px] md:text-[13.5px] font-bold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-200 dark:border-zinc-800 pb-1.5 mb-2.5">
                Projects
              </h2>
              <div className="space-y-3.5 sm:space-y-3">
                {projects.map((proj) => (
                  <div key={proj.id} className="pt-0.5">
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-2">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="text-slate-900 dark:text-white font-bold text-xs sm:text-sm md:text-[15px]">
                          {proj.name}
                        </span>
                        {proj.liveUrl && (
                          <a
                            href={proj.liveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#6366F1] dark:text-[#818CF8] font-mono text-[10px] sm:text-[11px] md:text-[12px] hover:underline px-1 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 inline-flex items-center"
                          >
                            [Live Demo]
                          </a>
                        )}
                        {proj.githubUrl && (
                          <a
                            href={proj.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-500 dark:text-zinc-400 font-mono text-[10px] sm:text-[11px] md:text-[12px] hover:underline px-1 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 inline-flex items-center"
                          >
                            [GitHub]
                          </a>
                        )}
                      </div>
                      <span className="text-[10px] sm:text-[11px] md:text-[12px] font-mono text-slate-500 dark:text-zinc-400 sm:text-right shrink-0">
                        {proj.techStack.slice(0, 4).join(" · ")}
                      </span>
                    </div>
                    <p className="text-xs sm:text-[13px] md:text-[13.5px] text-slate-600 dark:text-zinc-400 mt-1">{proj.description}</p>
                    <ul className="list-disc list-outside ml-4 sm:ml-5 mt-1 space-y-0.5 text-xs sm:text-[13px] md:text-[13.5px] text-slate-700 dark:text-zinc-300 leading-snug">
                      {proj.highlights.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {/* Education & Certifications Row (1 column on mobile, 2 columns on tablet/desktop) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-1">
              {/* Education */}
              <section>
                <h2 className="text-xs sm:text-[13px] md:text-[13.5px] font-bold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-200 dark:border-zinc-800 pb-1.5 mb-2">
                  Education
                </h2>
                {education.map((edu) => (
                  <div key={edu.id} className="text-xs sm:text-[13px] md:text-[13.5px]">
                    <div className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm md:text-[14.5px]">{edu.degree}</div>
                    <div className="text-slate-700 dark:text-zinc-300 mt-0.5">{edu.institution}</div>
                    <div className="text-slate-500 dark:text-zinc-400 text-[11px] sm:text-xs md:text-[12.5px] mt-0.5">
                      {edu.startDate} – {edu.endDate} {edu.honors ? `· ${edu.honors}` : ""}
                    </div>
                  </div>
                ))}
              </section>

              {/* Certifications */}
              <section>
                <h2 className="text-xs sm:text-[13px] md:text-[13.5px] font-bold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-200 dark:border-zinc-800 pb-1.5 mb-2">
                  Certifications
                </h2>
                <div className="space-y-1.5 text-xs sm:text-[13px] md:text-[13.5px]">
                  {certifications.map((cert) => (
                    <div key={cert.id} className="leading-tight">
                      <div className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm md:text-[14px]">{cert.name}</div>
                      <div className="text-slate-500 dark:text-zinc-400 text-[11px] sm:text-xs md:text-[12.5px] mt-0.5">
                        {cert.issuer} ({cert.date})
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </article>
      </div>

      {/* Print Anti-Tamper Notice (Only shows when user attempts Ctrl+P while unauthenticated) */}
      {!isUnlocked && (
        <div className="hidden print:flex flex-col items-center justify-center min-h-[400px] text-center p-10 font-sans text-slate-900">
          <h2 className="text-2xl font-bold mb-3">👀 Nice try, get a life noob 😂</h2>
          <p className="text-sm text-slate-600 max-w-md">
            This resume is protected by server-side verification. Enter your email and verify your OTP at resume.gauravpatil.site to view, print, or download the real resume.
          </p>
        </div>
      )}

      {/* Global Print Media Rules */}
      <style jsx global>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          @page {
            size: A4;
            margin: 10mm;
          }
          nav, button, .print\\:hidden {
            display: none !important;
          }
          #resume-document-page {
            ${!isUnlocked ? "display: none !important;" : ""}
            box-shadow: none !important;
            padding: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            min-height: auto !important;
            transform: none !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
        }
      `}</style>
    </div>
  );
};
