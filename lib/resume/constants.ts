import type { ResumeData } from "@/types/resume";

export const RESUME_SESSION_COOKIE = "resume_session";
export const RESUME_SESSION_TTL_MINUTES = 30; // 30-minute anti-abuse / anti-tamper timeout
export const RESUME_SESSION_TTL_SECONDS = RESUME_SESSION_TTL_MINUTES * 60; // 1800 seconds
export const RESUME_SESSION_TTL_HOURS = 0.5; // Backwards-compatible reference
export const RESUME_OTP_TTL_SECONDS = 300; // 5 minutes
export const RESUME_MAX_OTP_ATTEMPTS = 5;

export const DEFAULT_RESUME_DATA: ResumeData = {
  basics: {
    name: "Gaurav Patil",
    label: "Full-Stack & Systems Software Engineer",
    email: "gaurav@gauravpatil.site",
    phone: "+1 (555) 669-3652",
    location: "Remote / Global",
    website: "https://gauravpatil.site",
    linkedin: "https://linkedin.com/in/gaurav-patil-profile",
    github: "https://github.com/AspiringWebGaurav",
    summary:
      "Production-focused Full-Stack & Systems Engineer with 3+ years of experience architecting fast, scalable distributed web applications, native desktop tools (Rust/Tauri), and enterprise edge architectures. Proven track record in high-availability platforms, sub-millisecond edge routing, zero-trust security gates, and resilient database synchronization.",
  },
  skillCategories: [
    {
      category: "Languages & Core",
      skills: ["TypeScript", "JavaScript (ESNext)", "Rust", "HTML5 / Semantic Web", "CSS3 / Modern Layouts", "SQL"],
    },
    {
      category: "Frontend & UI Engineering",
      skills: ["React 19", "Next.js 15/16 (App Router)", "TailwindCSS", "Framer Motion", "WebRTC", "Responsive Design", "Accessibility (a11y)"],
    },
    {
      category: "Backend & Systems",
      skills: ["Node.js", "Server Actions", "REST APIs", "WebSockets", "Tauri Native Desktop", "Microservices", "Event-Driven Architecture"],
    },
    {
      category: "Databases & Caching",
      skills: ["Firebase Realtime Database", "Cloud Firestore", "Upstash Redis", "PostgreSQL", "Atomic Transactions"],
    },
    {
      category: "Cloud, Edge & Security",
      skills: ["Cloudflare (Turnstile, Workers, Edge)", "Vercel Enterprise Edge", "OAuth 2.0 PKCE", "HMAC-SHA256 Encryption", "Brevo Transactional Pipeline"],
    },
    {
      category: "DevOps & Tooling",
      skills: ["Git & GitHub Actions", "TurboRepo", "Docker", "Playwright", "CI/CD Pipelines", "Vite", "Performance Optimization"],
    },
  ],
  experience: [
    {
      id: "exp_neosoft",
      company: "NeoSOFT",
      role: "Software Engineer",
      location: "Full-Time",
      startDate: "2022",
      endDate: "Present",
      isCurrent: true,
      highlights: [
        "Architect and maintain high-traffic enterprise web platforms using React, Next.js, and TypeScript with 99.98% uptime SLA.",
        "Engineer scalable RESTful and event-driven backend services with atomic transaction management across distributed databases.",
        "Spearhead performance optimization workflows reducing Largest Contentful Paint (LCP) by 42% across critical user journeys.",
        "Implement end-to-end security validations, CSRF protections, and strict rate-limiting policies defending against automated attacks.",
      ],
    },
    {
      id: "exp_freelance",
      company: "Independent Weekend Contracting",
      role: "Full-Stack & Systems Consultant",
      location: "Remote / Contract",
      startDate: "2023",
      endDate: "Present",
      isCurrent: true,
      highlights: [
        "Deliver bespoke web applications and edge infrastructure solutions for private clients under rigorous contractual SLAs.",
        "Developed custom ERP portals, edge link shorteners, and business automation platforms handling thousands of daily operations.",
        "Provide direct architectural advisory on database migration, Cloudflare security hardening, and real-time state synchronization.",
      ],
    },
    {
      id: "exp_opensource",
      company: "Open Source & Product Engineering",
      role: "Lead Software Architect",
      location: "Independent IP",
      startDate: "2024",
      endDate: "Present",
      isCurrent: true,
      highlights: [
        "Created Sendme.alt: A zero-cloud, peer-to-peer file transfer system (WebRTC + Rust/Tauri) handling large transfers with complete privacy.",
        "Architected Switchyy: A zero-downtime maintenance-mode edge orchestration tool for instant deployment transitions.",
        "Published DareToSend: A high-moderation anonymous feedback engine featuring automated AI content sanitization.",
      ],
    },
    {
      id: "exp_masai",
      company: "Masai School",
      role: "Full-Stack Web Trainee",
      location: "Intensive Program",
      startDate: "2021",
      endDate: "2022",
      isCurrent: false,
      highlights: [
        "Completed 1200+ hours of rigorous algorithmic and software development training covering full-stack architecture.",
        "Built production-ready collaborative platforms practicing Agile sprints, code reviews, and pair programming.",
      ],
    },
  ],
  projects: [
    {
      id: "proj_send2me",
      name: "Sendme.alt — Secure P2P File Transfer",
      description: "Direct peer-to-peer browser & desktop file transfer platform with zero cloud file storage.",
      techStack: ["Next.js", "React", "TypeScript", "WebRTC", "Rust", "Tauri", "TailwindCSS"],
      highlights: [
        "Built end-to-end WebRTC signaling and data channel streaming supporting multi-gigabyte files directly between peers.",
        "Packaged cross-platform native desktop application with Rust and Tauri maintaining minimal memory footprint (<35MB).",
      ],
      liveUrl: "https://send2me.eu.cc/",
      githubUrl: "https://github.com/AspiringWebGaurav/sendme.alt",
    },
    {
      id: "proj_switchyy",
      name: "Switchyy — Dynamic App Mode Orchestration",
      description: "Edge-based maintenance mode and feature switch system operating without application redeployments.",
      techStack: ["Next.js", "TypeScript", "Cloudflare Workers", "Upstash Redis", "TailwindCSS"],
      highlights: [
        "Eliminated maintenance disruption with sub-millisecond edge response toggles and automated route draining.",
        "Built administrative telemetry dashboard with encrypted state distribution and audit logs.",
      ],
      liveUrl: "https://switchyy.eu.cc/",
      githubUrl: "https://github.com/AspiringWebGaurav/switchy",
    },
    {
      id: "proj_gmp",
      name: "GMP — Enterprise Operations Management",
      description: "Comprehensive enterprise operations dashboard featuring fine-grained RBAC, task telemetry, and audit reporting.",
      techStack: ["Next.js", "React", "TypeScript", "Firebase RTDB", "Google OAuth PKCE"],
      highlights: [
        "Designed granular role-based authorization matrix ensuring confidential organizational operational control.",
        "Engineered real-time telemetry streaming and automated PDF export facilities.",
      ],
      liveUrl: "https://gauravmanagementportal.eu.cc/",
      githubUrl: "https://github.com/AspiringWebGaurav/GMP",
    },
  ],
  education: [
    {
      id: "edu_btech",
      institution: "Bachelor of Technology / Engineering",
      degree: "Bachelor of Technology",
      field: "Computer Science & Engineering",
      startDate: "2018",
      endDate: "2022",
      honors: "First Class with Distinction",
    },
  ],
  certifications: [
    {
      id: "cert_fullstack",
      name: "Full Stack Software Engineering Certification",
      issuer: "Masai School (1200+ Hours)",
      date: "2022",
    },
    {
      id: "cert_cloud",
      name: "Modern Web Architecture & Cloud Security",
      issuer: "Professional Software Engineering Track",
      date: "2023",
    },
  ],
  updatedAt: Date.now(),
  version: 1,
  status: "active",
  statusMessage: "",
};
