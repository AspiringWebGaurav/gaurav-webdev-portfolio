import type { Metadata } from "next";
import React from "react";
import { getResumeData } from "@/lib/resume/services/resume-data.service";

export const revalidate = 86400; // 24-hour baseline ISR (revalidated on-demand via CMS actions)

/**
 * Dynamic Metadata Generator for resume.gauravpatil.site
 * Automatically reflects candidate updates, skills, job title, and hiring lifecycle status.
 * Optimized for rich social sharing cards on WhatsApp, LinkedIn, iMessage, Twitter/X, and Slack.
 */
export async function generateMetadata(): Promise<Metadata> {
  const resume = await getResumeData();
  const name = resume.basics?.name || "Gaurav Patil";
  const label = resume.basics?.label || "Full-Stack & Systems Software Engineer";
  const summary =
    resume.basics?.summary ||
    "Production-focused Full-Stack & Systems Software Engineer with 3+ years experience in Next.js 15, React 19, Rust, Tauri, WebRTC, and distributed edge architectures.";
  const status = resume.status || "active";

  const isHired = status === "hired";
  const isSuspended = status === "suspended";

  // Dynamic status-aware title
  const statusBadge = isHired
    ? "💼 Offer Accepted — "
    : isSuspended
    ? "⏸️ Access Paused — "
    : "";
  const title = `${statusBadge}${name} — ${label} | Official Verified Resume`;

  // Dynamic description
  const description = isHired
    ? `Gaurav Patil has accepted an offer. Official engineering credentials, architecture portfolio, and systems track record.`
    : summary.slice(0, 160) + (summary.length > 160 ? "..." : "");

  const allSkills = (resume.skillCategories || []).flatMap((c) => c.skills || []);

  const shareImageUrl = "https://resume.gauravpatil.site/resume-og.png";

  return {
    metadataBase: new URL("https://resume.gauravpatil.site"),
    title: {
      default: title,
      template: `%s | ${name} Resume`,
    },
    description,
    keywords: [
      name,
      `${name} Resume`,
      `${name} CV`,
      `${name} Software Engineer`,
      label,
      "Software Engineer Resume",
      "Full-Stack Engineer",
      "Systems Software Engineer",
      "Rust Tauri WebRTC",
      "React 19 Next.js 15",
      "NeoSOFT Software Engineer",
      "Official Verified Resume",
      ...allSkills.slice(0, 15),
    ],
    authors: [{ name, url: resume.basics?.website || "https://gauravpatil.site" }],
    creator: name,
    publisher: name,
    alternates: {
      canonical: "https://resume.gauravpatil.site",
    },
    // OpenGraph Protocol (WhatsApp, LinkedIn, Facebook, Slack, iMessage)
    openGraph: {
      title,
      description,
      url: "https://resume.gauravpatil.site",
      siteName: `${name} — Verified Software Engineer Resume`,
      images: [
        {
          url: shareImageUrl,
          width: 1200,
          height: 630,
          alt: `${name} — ${label} Official Resume Card`,
          type: "image/png",
        },
      ],
      locale: "en_US",
      type: "profile",
    },
    // Twitter / X Cards
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [shareImageUrl],
      creator: "@AspiringWebGaurav",
      site: "@AspiringWebGaurav",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    other: {
      // WhatsApp & WeChat specific microdata
      "whatsapp:title": title,
      "whatsapp:description": description,
      "whatsapp:image": shareImageUrl,
      // Theme & PWA colors
      "theme-color": "#0B0C10",
      "msapplication-TileColor": "#0B0C10",
    },
  };
}

export default async function ResumeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const resume = await getResumeData();
  const name = resume.basics?.name || "Gaurav Patil";
  const label = resume.basics?.label || "Full-Stack & Systems Software Engineer";

  // Google Rich Results & Knowledge Graph Schema
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": "https://resume.gauravpatil.site/#profilepage",
        url: "https://resume.gauravpatil.site",
        name: `${name} — Official Verified Software Engineer Resume`,
        isPartOf: {
          "@type": "WebSite",
          "@id": "https://gauravpatil.site/#website",
          name: "Gaurav Patil Portfolio & Engineering IP",
          url: "https://gauravpatil.site",
        },
        about: { "@id": "https://resume.gauravpatil.site/#person" },
        primaryImageOfPage: {
          "@type": "ImageObject",
          url: "https://resume.gauravpatil.site/resume-og.png",
        },
      },
      {
        "@type": "Person",
        "@id": "https://resume.gauravpatil.site/#person",
        name,
        jobTitle: label,
        email: resume.basics?.email || "gaurav@gauravpatil.site",
        url: resume.basics?.website || "https://gauravpatil.site",
        image: "https://resume.gauravpatil.site/resume-og.png",
        sameAs: [
          resume.basics?.github || "https://github.com/AspiringWebGaurav",
          resume.basics?.linkedin || "https://linkedin.com/in/gaurav-patil-profile",
          resume.basics?.website || "https://gauravpatil.site",
        ],
        worksFor: {
          "@type": "Organization",
          name: resume.experience?.[0]?.company || "NeoSOFT",
        },
        knowsAbout: (resume.skillCategories || []).flatMap((c) => c.skills || []),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      {children}
    </>
  );
}
