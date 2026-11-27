import { unstable_cache } from "next/cache";
import { publicPortfolioRepository } from "@/lib/dal/repositories/public-portfolio.repository";
import { SEED_PORTFOLIO_PROJECTION } from "@/lib/dal/repositories/seed-data";
import { PROJECT_CASE_STUDIES, type ProjectCaseStudy } from "@/lib/data/case-studies";
import {
  DOWNEX_COMPARISON_ROWS,
  DOWNEX_DESKTOP_DOWNLOAD_URL,
  DOWNEX_EXTENSION_DOWNLOAD_URL,
  DOWNEX_FAQS,
  DOWNEX_GITHUB_URL,
  DOWNEX_ORIGIN,
  DOWNEX_PORTFOLIO_URL,
  DOWNEX_SHA256,
  DOWNEX_TOPIC_PAGES,
} from "@/lib/data/downex-seo";
import type { PublicPortfolioProjection } from "@/types/portfolio";

export type SubdomainKey =
  | "root"
  | "apps"
  | "services"
  | "downex"
  | "cp"
  | "sm"
  | "gpn"
  | "resume"
  | "contact"
  | "talk"
  | "self";

export const SUBDOMAIN_ORIGINS: Record<SubdomainKey, string> = {
  root: "https://gauravpatil.site",
  apps: "https://apps.gauravpatil.site",
  services: "https://services.gauravpatil.site",
  downex: "https://downex.apps.gauravpatil.site",
  cp: "https://cp.apps.gauravpatil.site",
  sm: "https://sm.apps.gauravpatil.site",
  gpn: "https://gpn.apps.gauravpatil.site",
  resume: "https://resume.services.gauravpatil.site",
  contact: "https://contact.services.gauravpatil.site",
  talk: "https://talk.services.gauravpatil.site",
  self: "https://self.gauravpatil.site",
};

export function resolvePortfolioSubdomainKey(rawHost: string): SubdomainKey {
  const host = (rawHost || "").toLowerCase().split(":")[0];

  if (
    host === "downex.apps.gauravpatil.site" ||
    host === "downex.gauravpatil.site" ||
    host.startsWith("downex.apps.localhost") ||
    host.startsWith("downex.localhost")
  ) {
    return "downex";
  }
  if (
    host === "cp.apps.gauravpatil.site" ||
    host.startsWith("cp.apps.localhost") ||
    host.startsWith("cp.localhost")
  ) {
    return "cp";
  }
  if (
    host === "sm.apps.gauravpatil.site" ||
    host.startsWith("sm.apps.localhost") ||
    host.startsWith("sm.localhost")
  ) {
    return "sm";
  }
  if (
    host === "gpn.apps.gauravpatil.site" ||
    host.startsWith("gpn.apps.localhost") ||
    host.startsWith("gpn.localhost")
  ) {
    return "gpn";
  }
  if (
    host === "apps.gauravpatil.site" ||
    host.startsWith("apps.localhost")
  ) {
    return "apps";
  }
  if (
    host === "resume.services.gauravpatil.site" ||
    host === "resume.gauravpatil.site" ||
    host.startsWith("resume.services.localhost") ||
    host.startsWith("resume.localhost")
  ) {
    return "resume";
  }
  if (
    host === "contact.services.gauravpatil.site" ||
    host === "contact.gauravpatil.site" ||
    host.startsWith("contact.services.localhost") ||
    host.startsWith("contact.localhost")
  ) {
    return "contact";
  }
  if (
    host === "talk.services.gauravpatil.site" ||
    host === "talk.gauravpatil.site" ||
    host.startsWith("talk.services.localhost") ||
    host.startsWith("talk.localhost")
  ) {
    return "talk";
  }
  if (
    host === "services.gauravpatil.site" ||
    host.startsWith("services.localhost")
  ) {
    return "services";
  }
  if (
    host === "self.gauravpatil.site" ||
    host.startsWith("self.localhost")
  ) {
    return "self";
  }
  return "root";
}

export const getAiPortfolioSnapshot = unstable_cache(
  async (): Promise<PublicPortfolioProjection> => {
    try {
      const res = await publicPortfolioRepository.getPublishedPortfolioData();
      return res.data || SEED_PORTFOLIO_PROJECTION;
    } catch {
      return SEED_PORTFOLIO_PROJECTION;
    }
  },
  ["portfolio-ai-context-v1"],
  {
    tags: [
      "portfolio-cms",
      "portfolio-hero",
      "portfolio-cards",
      "portfolio-projects",
      "portfolio-testimonials",
      "portfolio-experience",
      "portfolio-approach",
      "portfolio-social",
      "portfolio-seo",
    ],
    revalidate: 86400,
  }
);

function getOrderedTechStack(data: PublicPortfolioProjection): string[] {
  const stackCard = data.cards.find((c) => c.cardType === "tech_stack");
  const fromCard = [
    ...(stackCard?.techStackLeft || []),
    ...(stackCard?.techStackRight || []),
  ].filter(Boolean);

  if (fromCard.length > 0) return fromCard;
  return [
    "Next.js",
    "React 19",
    "TypeScript",
    "Rust & Tauri",
    "WebRTC",
    "Tailwind CSS",
    "Node.js",
    "Firebase / Firestore",
    "Upstash Redis",
    "Cloudflare R2",
  ];
}

function getPublishedProjects(data: PublicPortfolioProjection) {
  return [...(data.projects || [])]
    .filter((p) => p.isPublished !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

function getPublishedExperience(data: PublicPortfolioProjection) {
  return [...(data.experience || [])]
    .filter((e) => e.isPublished !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

function getPublishedPhases(data: PublicPortfolioProjection) {
  return [...(data.phases || [])]
    .filter((p) => p.isPublished !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

function getPublishedTestimonials(data: PublicPortfolioProjection) {
  return [...(data.testimonials || [])]
    .filter((t) => t.isPublished !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

function buildDownexSummaryBlock(): string {
  return [
    `## Downex — Simple Free Download Manager (Flagship Windows Utility)`,
    `- Official Portal: ${DOWNEX_ORIGIN}`,
    `- Portfolio Case Study: ${DOWNEX_PORTFOLIO_URL}/projects/downex-download-manager`,
    `- Direct Windows Installer: ${DOWNEX_DESKTOP_DOWNLOAD_URL}`,
    `- Manifest V3 Browser Extension: ${DOWNEX_EXTENSION_DOWNLOAD_URL}`,
    `- Source Code: ${DOWNEX_GITHUB_URL}`,
    `- Technical Specs: Built with Rust, Tokio async runtime, Tauri v2, React 19, and SQLite WAL. Features up to 32 parallel HTTP/1.1 range connections with tail-end work stealing, sequential 1-by-1 FIFO queue, automatic 4 GB RAM / heavy-load Eco optimization, Chrome/Edge/Brave link interception, zero ads, and zero telemetry (distinct from unrelated domains such as downex.app).`,
    `- Guides & Docs:`,
    ...DOWNEX_TOPIC_PAGES.map(
      (p) => `  - [${p.shortTitle}](${DOWNEX_ORIGIN}${p.slug}): ${p.summary}`
    ),
  ].join("\n");
}

function buildWindowsSuiteSummaryBlock(): string {
  return [
    `## PC Apps & Desktop Software Suite (${SUBDOMAIN_ORIGINS.apps})`,
    `- [Apps Suite Launchpad](${SUBDOMAIN_ORIGINS.apps}): Central directory of Gaurav Patil's Windows desktop utilities.`,
    `- [Downex — Simple Free Download Manager](${DOWNEX_ORIGIN}): Free, open-source 32-stream Windows 10/11 download manager and IDM alternative built in Rust + Tauri v2 with Chrome/Edge MV3 auto-catch and 1-by-1 queues.`,
    `- [CP Engine (Copy. Paste. Faster.)](${SUBDOMAIN_ORIGINS.cp}): Hardware-accelerated Win32 & Rust unbuffered file copy/move accelerator engineered for NVMe SSDs and large folder transfers on Windows 10/11 (Docs: ${SUBDOMAIN_ORIGINS.cp}/how-to-use, Terms: ${SUBDOMAIN_ORIGINS.cp}/terms, Privacy: ${SUBDOMAIN_ORIGINS.cp}/privacy, AOU: ${SUBDOMAIN_ORIGINS.cp}/aou).`,
    `- [ScheduleMe](${SUBDOMAIN_ORIGINS.sm}): Ultra-lightweight Windows power-action scheduler built in Rust + Tauri for automated shutdown, restart, and sleep timers with zero background CPU overhead (Docs: ${SUBDOMAIN_ORIGINS.sm}/docs).`,
    `- [GPN Notes Desktop & Web](${SUBDOMAIN_ORIGINS.gpn}): Real-time client-encrypted local-first workspace backed by Next.js and Yjs CRDT synchronization.`,
  ].join("\n");
}

export function buildLlmsTxt(rawHost: string, data: PublicPortfolioProjection): string {
  const key = resolvePortfolioSubdomainKey(rawHost);
  const heroDesc =
    data.hero?.description || SEED_PORTFOLIO_PROJECTION.hero.description;
  const projects = getPublishedProjects(data);
  const experience = getPublishedExperience(data);
  const stack = getOrderedTechStack(data);
  const studies = Object.values(PROJECT_CASE_STUDIES);

  if (key === "downex") {
    return `# Downex — Simple Free Download Manager for Windows
> Official portal: ${DOWNEX_ORIGIN}
> Author: Gaurav Patil (${DOWNEX_PORTFOLIO_URL})
> Source Code: ${DOWNEX_GITHUB_URL}
> Full Technical Dossier: ${DOWNEX_ORIGIN}/llms-full.txt

## Summary
Downex is a free, open-source Windows 10 and Windows 11 download manager and IDM alternative built by Gaurav Patil using Rust, Tokio, Tauri v2, React 19, and SQLite WAL. It provides up to 32 parallel HTTP/1.1 range connections with work stealing, crash-safe pause/resume, a 1-by-1 sequential FIFO queue, automatic 4 GB low-RAM Eco optimization, a Chromium Manifest V3 extension, zero ads, and zero telemetry. It is distinct from unrelated third-party video-downloader domains such as downex.app.

## Guides & Documentation
${DOWNEX_TOPIC_PAGES.map((p) => `- [${p.shortTitle}](${DOWNEX_ORIGIN}${p.slug}): ${p.description}`).join("\n")}
- [Portfolio Engineering Case Study](${DOWNEX_PORTFOLIO_URL}/projects/downex-download-manager)
- [Terms of Service](${DOWNEX_ORIGIN}/terms)
- [Privacy Policy](${DOWNEX_ORIGIN}/privacy)
`;
  }

  if (key === "cp") {
    return `# CP Engine — Hardware-Accelerated Windows File Copy Utility
> Official portal: ${SUBDOMAIN_ORIGINS.cp}
> Author: Gaurav Patil (${DOWNEX_PORTFOLIO_URL})
> Full Documentation: ${SUBDOMAIN_ORIGINS.cp}/llms-full.txt

## Summary
CP Engine ("Copy. Paste. Faster.") is a Windows 10/11 native Explorer file copy & move accelerator built by Gaurav Patil. It bypasses legacy Windows shell buffering stalls for multi-gigabyte ISOs, large media archives, and nested developer directories while enforcing 100% local zero-telemetry privacy.

## Pages
- [CP Engine Home](${SUBDOMAIN_ORIGINS.cp}): Overview, SHA-256 checksum, and release status.
- [User Guide & Overview](${SUBDOMAIN_ORIGINS.cp}/how-to-use): Architecture, hardware requirements, and everyday Explorer workflow.
- [Privacy Policy](${SUBDOMAIN_ORIGINS.cp}/privacy): Zero-telemetry guarantee and network audit.
- [Terms of Service](${SUBDOMAIN_ORIGINS.cp}/terms): Enterprise licensing and OTA update governance.
- [Acceptable Use (AOU)](${SUBDOMAIN_ORIGINS.cp}/aou): Release v0.0.1 foundation terms.
`;
  }

  if (key === "sm") {
    return `# ScheduleMe — Lightweight Windows Shutdown, Restart & Sleep Scheduler
> Official portal: ${SUBDOMAIN_ORIGINS.sm}
> Author: Gaurav Patil (${DOWNEX_PORTFOLIO_URL})
> Full Documentation: ${SUBDOMAIN_ORIGINS.sm}/llms-full.txt

## Summary
ScheduleMe is a lightweight desktop automation utility built with Rust and Tauri for Windows 10 and Windows 11. It schedules reliable automated shutdown, restart, and sleep actions in seconds with system tray integration and zero background CPU overhead.

## Pages
- [ScheduleMe Home](${SUBDOMAIN_ORIGINS.sm})
- [Documentation & Architecture Guide](${SUBDOMAIN_ORIGINS.sm}/docs)
- [Main Developer Portfolio](${DOWNEX_PORTFOLIO_URL})
`;
  }

  if (key === "gpn") {
    return `# GPN Notes — Private, Local-First Encrypted Notes Workspace
> Official portal: ${SUBDOMAIN_ORIGINS.gpn}
> Author: Gaurav Patil (${DOWNEX_PORTFOLIO_URL})
> Full Documentation: ${SUBDOMAIN_ORIGINS.gpn}/llms-full.txt

## Summary
GPN Notes is an encrypted, local-first knowledge management and personal notes application engineered by Gaurav Patil using Next.js and Yjs CRDT synchronization.

## Links
- [GPN Notes Portal](${SUBDOMAIN_ORIGINS.gpn})
- [Apps Suite Hub](${SUBDOMAIN_ORIGINS.apps})
- [Developer Portfolio](${DOWNEX_PORTFOLIO_URL})
`;
  }

  if (key === "apps") {
    return `# Gaurav Patil — PC Apps & Desktop Software Suite
> Canonical URL: ${SUBDOMAIN_ORIGINS.apps}
> Author Portfolio: ${DOWNEX_PORTFOLIO_URL}
> Complete Technical Dossier: ${SUBDOMAIN_ORIGINS.apps}/llms-full.txt

${buildWindowsSuiteSummaryBlock()}
`;
  }

  if (key === "services" || key === "resume" || key === "contact") {
    return `# Gaurav Patil — Engineering Services, Verified Resume & Recruiter Gateway
> Canonical URL: ${SUBDOMAIN_ORIGINS[key]}
> Main Portfolio: ${DOWNEX_PORTFOLIO_URL}
> Full Public Profile & Case Studies: ${DOWNEX_PORTFOLIO_URL}/llms-full.txt

## Overview
Gaurav Patil is a Full Stack Software Engineer & Systems Developer (NeoSOFT, Weekend Independent Contractor, Open Source Author). For candidate security and spam prevention, private contact channels and the verified full-text PDF resume operate behind email OTP + Cloudflare Turnstile verification. Public engineering work, live applications, and full technical case studies are openly documented on ${DOWNEX_PORTFOLIO_URL}.

## Services Endpoints
- [Services Hub](${SUBDOMAIN_ORIGINS.services}): Unified portal overview for verified hiring and client services.
- [Verified Resume Portal](${SUBDOMAIN_ORIGINS.resume}): Time-limited OTP-verified candidate credentials & resume portal for hiring managers.
- [Recruiter Contact Gateway](${SUBDOMAIN_ORIGINS.contact}): Dedicated confidential inquiry gateway for executive recruiters and enterprise clients.
- [Full Stack Portfolio & 17+ Case Studies](${DOWNEX_PORTFOLIO_URL}/projects)
`;
  }

  const githubUrl =
    data.socialLinks?.find((s) => s.platform.toLowerCase().includes("github"))?.url ||
    "https://github.com/AspiringWebGaurav";

  return `# Gaurav Patil — Full Stack Software Engineer & Systems Developer
> Canonical URL: https://gauravpatil.site (aliases: https://www.gauravpatil.site)
> Complete Single-File AI Dossier: https://gauravpatil.site/llms-full.txt
> GitHub: ${githubUrl}
> Public Contact Email: hello@gauravpatil.site

## About Gaurav Patil
${heroDesc}

## Core Engineering Stack
- ${stack.join(", ")}

## Experience Summary
${experience.map((e) => `- **${e.title}** at ${e.company} (${e.period}): ${e.description}`).join("\n")}

## Core Portfolio Sections & Hubs
- [Homepage](https://gauravpatil.site): Executive portfolio overview, hero, interactive tech bento, featured systems, experience, approach, and contact.
- [Projects Directory](https://gauravpatil.site/projects): Full catalogue of production web applications, cloud architectures, and desktop software.
- [Engineering Blog & Teardowns](https://gauravpatil.site/blog): Accessible deep-dives on WebRTC P2P transit, Cloudflare R2 storage, Redis caching, Rust desktop acceleration, and URL routing.
- [PC Apps Suite Hub](${SUBDOMAIN_ORIGINS.apps}): Windows desktop tools including Downex, CP Engine, ScheduleMe, and GPN Notes.
- [Services Hub](${SUBDOMAIN_ORIGINS.services}): Verified interactive resume (${SUBDOMAIN_ORIGINS.resume}) and Recruiter Contact Portal (${SUBDOMAIN_ORIGINS.contact}).

${buildDownexSummaryBlock()}

## Flagship Desktop Apps
- [CP Engine](${SUBDOMAIN_ORIGINS.cp}): Fast Windows Explorer file copy/move hardware accelerator.
- [ScheduleMe](${SUBDOMAIN_ORIGINS.sm}): Lightweight Rust + Tauri Windows power scheduler.
- [GPN Notes](${SUBDOMAIN_ORIGINS.gpn}): Local-first encrypted notes platform.

## Production Web Platforms & Case Studies
${studies
  .map(
    (s) =>
      `- [${s.title}](https://gauravpatil.site/projects/${s.slug}) ([Article](https://gauravpatil.site/blog/${s.slug})): ${s.subtitle}`
  )
  .join("\n")}
${projects
  .filter((p) => !studies.some((s) => s.projectId === p.id || s.slug === p.slug))
  .map((p) => `- [${p.title}](${p.liveUrl}): ${p.description}`)
  .join("\n")}

## Security, Privacy & Governance
- [Privacy Policy](https://gauravpatil.site/privacy)
- [Terms of Service](https://gauravpatil.site/terms)
- [Security Policy](https://gauravpatil.site/security)
- [Accessibility Statement](https://gauravpatil.site/accessibility)
- [Personal Assistant Guide](https://gauravpatil.site/chat)
`;
}

function renderCaseStudyMarkdown(study: ProjectCaseStudy): string {
  return `### ${study.title}
- Case Study URL: https://gauravpatil.site/projects/${study.slug}
- Engineering Article URL: https://gauravpatil.site/blog/${study.slug}
- Live Deployment: ${study.liveUrl}
${study.docsUrl ? `- Documentation: ${study.docsUrl}\n` : ""}${
    study.githubUrl ? `- Repository: ${study.githubUrl}\n` : ""
  }${study.desktopGithubUrl ? `- Desktop Repository: ${study.desktopGithubUrl}\n` : ""}- Role: ${study.role} | Category: ${study.category} | Timeline: ${study.timeline}
- Stack: ${study.technologies.join(", ")}
- License / Governance: ${study.licenseStatus}

${study.subtitle}

${study.overview}

#### ${study.architecture.title}
${study.architecture.description}
${study.architecture.points.map((pt) => `- ${pt}`).join("\n")}

#### Key Capabilities
${study.features.map((f) => `- ${f}`).join("\n")}

#### Measured Impact & Outcomes
${study.results.map((r) => `- ${r}`).join("\n")}`;
}

export function buildLlmsFullTxt(rawHost: string, data: PublicPortfolioProjection): string {
  const key = resolvePortfolioSubdomainKey(rawHost);
  const experience = getPublishedExperience(data);
  const phases = getPublishedPhases(data);
  const testimonials = getPublishedTestimonials(data);
  const stack = getOrderedTechStack(data);
  const studies = Object.values(PROJECT_CASE_STUDIES);
  const projects = getPublishedProjects(data);

  const downexFullSection = `## Deep Dive: Downex — Simple Free Download Manager for Windows
- Canonical Home: ${DOWNEX_ORIGIN}
- Installer Stream: ${DOWNEX_DESKTOP_DOWNLOAD_URL}
- SHA-256 Installer Checksum: ${DOWNEX_SHA256}
- Companion Browser Extension (Chrome/Edge/Brave MV3): ${DOWNEX_EXTENSION_DOWNLOAD_URL}
- GitHub Source: ${DOWNEX_GITHUB_URL}

### Comparison Matrix (Downex vs IDM vs Browser Built-in)
${DOWNEX_COMPARISON_ROWS.map(
  (row) => `- **${row.feature}**: Downex = ${row.downex} | IDM = ${row.idm} | Browser = ${row.browser}`
).join("\n")}

### Frequently Asked Questions
${DOWNEX_FAQS.map((f) => `**Q: ${f.question}**\nA: ${f.answer}`).join("\n\n")}`;

  const extraCmsProjects = projects.filter(
    (p) => !studies.some((s) => s.projectId === p.id || s.slug === p.slug)
  );

  return `# Gaurav Patil — Complete Technical Portfolio, Architecture & Software Dossier
> Author: Gaurav Patil (Full Stack Software Engineer & Systems Developer)
> Canonical Portfolio: https://gauravpatil.site
> Active Host Context: ${SUBDOMAIN_ORIGINS[key]}
> GitHub: https://github.com/AspiringWebGaurav
> Public Contact Email: hello@gauravpatil.site

${key === "downex" ? `${downexFullSection}\n\n---\n` : ""}
## 1. Executive Profile
- **Name**: Gaurav Patil (also known online as Gaurav Patil Dev / AspiringWebGaurav)
- **Primary Disciplines**: Full Stack Web Engineering (Next.js, React 19, TypeScript, Node.js, Tailwind CSS), Systems & Desktop Software (Rust, Tokio, Tauri v2, Win32 file/network optimization, SQLite WAL), Real-Time Networking (WebRTC P2P data channels, WebSockets), and Cloud Edge Infrastructure (Cloudflare R2, Upstash Redis, Firebase/Firestore, Vercel Edge).
- **Headline**: ${data.hero?.headingWords || SEED_PORTFOLIO_PROJECTION.hero.headingWords}
- **Summary**: ${data.hero?.description || SEED_PORTFOLIO_PROJECTION.hero.description}
- **Core Technologies**: ${stack.join(", ")}

## 2. Work Experience
${experience
  .map((e) => `- **${e.title}** — ${e.company} (${e.period}): ${e.description}`)
  .join("\n")}

## 3. Engineering Process & Delivery Approach
${phases
  .map((p) => `- **${p.phaseBadge}: ${p.title}** — ${p.description}`)
  .join("\n")}

## 4. Client Testimonials & Production Endorsements
${testimonials
  .map((t) => `- "${t.quote}" — ${t.name} (${t.role}, ${t.company})`)
  .join("\n")}

## 5. Subdomain Ecosystem Architecture
- **gauravpatil.site** (www.gauravpatil.site redirects 301 to canonical): Main portfolio, technical case studies (/projects), engineering blog (/blog), and public assistant.
- **apps.gauravpatil.site**: PC & Windows desktop apps launchpad aggregating Downex, CP Engine, ScheduleMe, and GPN Notes.
- **downex.apps.gauravpatil.site**: Dedicated product portal & SEO documentation hub for Downex Simple Free Download Manager.
- **cp.apps.gauravpatil.site**: Product & technical documentation portal for CP Engine (Windows copy accelerator).
- **sm.apps.gauravpatil.site**: Product & user guide for ScheduleMe (Rust/Tauri Windows power scheduler).
- **gpn.apps.gauravpatil.site**: Portal for GPN Notes (encrypted local-first markdown workspace).
- **services.gauravpatil.site**: Services portal linking verified candidate resume (resume.services.gauravpatil.site) and recruiter contact portal (contact.services.gauravpatil.site). Note: Resume and direct recruiter inquiry forms require lightweight email OTP + Cloudflare Turnstile verification to prevent automated scraping and spam.

${key !== "downex" ? `${downexFullSection}\n` : ""}
## 6. All Technical Case Studies & Engineering Projects (${studies.length + extraCmsProjects.length} Systems)
${studies.map(renderCaseStudyMarkdown).join("\n\n---\n\n")}
${
  extraCmsProjects.length > 0
    ? `\n\n---\n\n### Additional Published Portfolio Projects\n${extraCmsProjects
        .map((p) => `- **${p.title}** (${p.liveUrl}): ${p.description}`)
        .join("\n")}`
    : ""
}

## 7. Security, Privacy & Governance
- Privacy Policy: https://gauravpatil.site/privacy
- Terms of Service: https://gauravpatil.site/terms
- Security Architecture Policy: https://gauravpatil.site/security
- Accessibility Statement: https://gauravpatil.site/accessibility
- Personal Assistant Documentation: https://gauravpatil.site/chat
`;
}

export function buildPageMarkdown(
  rawPathname: string,
  rawHost: string,
  data: PublicPortfolioProjection
): { markdown: string; canonicalUrl: string } {
  const key = resolvePortfolioSubdomainKey(rawHost);
  const cleanPath = (rawPathname || "/")
    .replace(/\.md$/i, "")
    .replace(/^\/index$/i, "/") || "/";
  const normalizedPath = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;

  // Case study or blog detail pages
  const projectMatch = normalizedPath.match(/^\/projects\/([^/]+)\/?$/i);
  if (projectMatch) {
    const slug = projectMatch[1].toLowerCase();
    const study = PROJECT_CASE_STUDIES[slug];
    if (study) {
      return {
        canonicalUrl: `https://gauravpatil.site/projects/${study.slug}`,
        markdown: `# ${study.title}\n> Canonical Case Study: https://gauravpatil.site/projects/${study.slug}\n> Author: Gaurav Patil (https://gauravpatil.site)\n\n${renderCaseStudyMarkdown(
          study
        )}\n`,
      };
    }
  }

  const blogMatch = normalizedPath.match(/^\/blog\/([^/]+)\/?$/i);
  if (blogMatch) {
    const slug = blogMatch[1].toLowerCase();
    const article = PROJECT_CASE_STUDIES[slug];
    if (article) {
      return {
        canonicalUrl: `https://gauravpatil.site/blog/${article.slug}`,
        markdown: `# ${article.title} — Technical Engineering Teardown\n> Canonical Article: https://gauravpatil.site/blog/${article.slug}\n> Author: Gaurav Patil (https://gauravpatil.site)\n\n${renderCaseStudyMarkdown(
          article
        )}\n\n## Engineering Challenges Solved\n${article.challenges
          .map((c) => `- **${c.title}**: ${c.solution}`)
          .join("\n")}\n`,
      };
    }
  }

  // Subdomain-aware normalized route mapping
  if (key === "downex" || normalizedPath.startsWith("/download") || normalizedPath.startsWith("/downex")) {
    const subPath = normalizedPath.replace(/^\/(download|downex)/i, "") || "/";
    const topic = DOWNEX_TOPIC_PAGES.find((t) => t.slug === subPath);
    if (topic) {
      return {
        canonicalUrl: `${DOWNEX_ORIGIN}${topic.slug}`,
        markdown: `# ${topic.title}\n> Canonical URL: ${DOWNEX_ORIGIN}${topic.slug}\n> Author: Gaurav Patil (${DOWNEX_PORTFOLIO_URL})\n\n${topic.description}\n\n${topic.summary}\n\n- Official Downex Home: ${DOWNEX_ORIGIN}\n- GitHub Repository: ${DOWNEX_GITHUB_URL}\n- Full Downex & Portfolio Reference: ${DOWNEX_ORIGIN}/llms-full.txt\n`,
      };
    }
    return {
      canonicalUrl: DOWNEX_ORIGIN,
      markdown: buildLlmsTxt("downex.apps.gauravpatil.site", data),
    };
  }

  if (key === "apps" || normalizedPath === "/apps") {
    return {
      canonicalUrl: SUBDOMAIN_ORIGINS.apps,
      markdown: buildLlmsTxt("apps.gauravpatil.site", data),
    };
  }

  if (key === "services" || key === "resume" || key === "contact" || normalizedPath === "/services" || normalizedPath.startsWith("/resume") || normalizedPath.startsWith("/contact-portal")) {
    const origin =
      key === "resume" || normalizedPath.startsWith("/resume")
        ? SUBDOMAIN_ORIGINS.resume
        : key === "contact" || normalizedPath.startsWith("/contact-portal")
        ? SUBDOMAIN_ORIGINS.contact
        : SUBDOMAIN_ORIGINS.services;
    return {
      canonicalUrl: origin,
      markdown: buildLlmsTxt(new URL(origin).hostname, data),
    };
  }

  if (key === "cp" || normalizedPath.startsWith("/cp")) {
    const subPath = normalizedPath.replace(/^\/cp/i, "") || "/";
    const canonical = subPath === "/" ? SUBDOMAIN_ORIGINS.cp : `${SUBDOMAIN_ORIGINS.cp}${subPath}`;
    return {
      canonicalUrl: canonical,
      markdown: buildLlmsTxt("cp.apps.gauravpatil.site", data),
    };
  }

  if (key === "sm" || normalizedPath.startsWith("/sm")) {
    const subPath = normalizedPath.replace(/^\/sm/i, "") || "/";
    const canonical = subPath === "/" ? SUBDOMAIN_ORIGINS.sm : `${SUBDOMAIN_ORIGINS.sm}${subPath}`;
    return {
      canonicalUrl: canonical,
      markdown: buildLlmsTxt("sm.apps.gauravpatil.site", data),
    };
  }

  if (key === "gpn" || normalizedPath.startsWith("/gpn")) {
    return {
      canonicalUrl: SUBDOMAIN_ORIGINS.gpn,
      markdown: buildLlmsTxt("gpn.apps.gauravpatil.site", data),
    };
  }

  if (normalizedPath === "/projects") {
    const studies = Object.values(PROJECT_CASE_STUDIES);
    return {
      canonicalUrl: "https://gauravpatil.site/projects",
      markdown: `# Production Projects & Technical Case Studies — Gaurav Patil\n> Canonical URL: https://gauravpatil.site/projects\n\n${studies
        .map(
          (s) =>
            `## ${s.title}\n- URL: https://gauravpatil.site/projects/${s.slug}\n- Live: ${s.liveUrl}\n- Tech: ${s.technologies.join(", ")}\n\n${s.overview}`
        )
        .join("\n\n")}\n`,
    };
  }

  if (normalizedPath === "/blog") {
    const studies = Object.values(PROJECT_CASE_STUDIES);
    return {
      canonicalUrl: "https://gauravpatil.site/blog",
      markdown: `# Engineering Blog & Systems Architecture Articles — Gaurav Patil\n> Canonical URL: https://gauravpatil.site/blog\n\n${studies
        .map(
          (s) =>
            `- [${s.title}](https://gauravpatil.site/blog/${s.slug}) (${s.timeline}): ${s.subtitle}`
        )
        .join("\n")}\n`,
    };
  }

  const canonicalUrl =
    normalizedPath === "/" ? "https://gauravpatil.site" : `https://gauravpatil.site${normalizedPath}`;
  return {
    canonicalUrl,
    markdown: normalizedPath === "/" ? buildLlmsFullTxt("gauravpatil.site", data) : buildLlmsTxt("gauravpatil.site", data),
  };
}
