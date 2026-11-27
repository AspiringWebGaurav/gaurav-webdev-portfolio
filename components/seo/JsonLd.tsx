import React from "react";
import type { PublicPortfolioProjection } from "@/types/portfolio";
import { PROJECT_CASE_STUDIES } from "@/lib/data/case-studies";

interface PortfolioJsonLdProps {
  siteUrl?: string;
  data?: PublicPortfolioProjection;
}

export function PortfolioJsonLd({ siteUrl, data }: PortfolioJsonLdProps = {}) {
  const baseUrl = (siteUrl || process.env.NEXT_PUBLIC_APP_URL || "https://gauravpatil.site").replace(/\/$/, "");
  const studies = Object.values(PROJECT_CASE_STUDIES);
  const dynamicProjects = (data?.projects || []).filter((p) => p.isPublished !== false);
  const dynamicSocials = (data?.socialLinks || [])
    .filter((s) => s.isPublished !== false && s.url)
    .map((s) => s.url);

  const sameAsUrls = Array.from(
    new Set([
      "https://github.com/AspiringWebGaurav",
      ...dynamicSocials,
      baseUrl,
      "https://apps.gauravpatil.site",
      "https://services.gauravpatil.site",
      "https://downex.apps.gauravpatil.site",
      "https://cp.apps.gauravpatil.site",
      "https://sm.apps.gauravpatil.site",
      "https://gpn.apps.gauravpatil.site",
      "https://resume.services.gauravpatil.site",
      "https://contact.services.gauravpatil.site",
    ])
  );

  const dateModified =
    data?.seo?.updatedAt ||
    data?.hero?.updatedAt ||
    new Date("2026-11-27T00:00:00.000Z").toISOString();

  const personEntity = {
    "@type": "Person",
    "@id": `${baseUrl}/#person`,
    name: "Gaurav Patil",
    givenName: "Gaurav",
    familyName: "Patil",
    alternateName: [
      "Gaurav Patil Dev",
      "AspiringWebGaurav",
    ],
    url: baseUrl,
    image: `${baseUrl}/og-image.png`,
    jobTitle: [
      "Full Stack Software Engineer",
      "Full Stack Web Developer",
      "Systems Software Developer",
      "Software Engineer",
    ],
    worksFor: {
      "@type": "Organization",
      name: "NeoSOFT",
    },
    alumniOf: {
      "@type": "EducationalOrganization",
      name: "Masai School",
    },
    description:
      data?.hero?.description ||
      "Gaurav Patil is a Full Stack Software Engineer & Systems Developer building production-ready digital systems, scalable Next.js web applications, native Rust & Tauri desktop utilities, and reliable cloud backends.",
    email: "mailto:hello@gauravpatil.site",
    sameAs: sameAsUrls,
    knowsAbout: [
      "Full Stack Development",
      "Web Development",
      "Software Engineering",
      "Production-Ready Software",
      "Web Applications",
      "Desktop Download Accelerators",
      "Rust & Tauri",
      "Next.js",
      "React 19",
      "TypeScript",
      "JavaScript",
      "Tailwind CSS",
      "Node.js",
      "WebRTC Peer-to-Peer",
      "Cloudflare R2",
      "Firebase & Firestore",
      "Upstash Redis",
      "AI-Assisted Development",
      "Technical Case Studies",
      "Three.js",
      "Web Performance Optimization",
      "Cloud Architecture",
    ],
  };

  const downexProductEntity = {
    "@type": "SoftwareApplication",
    "@id": "https://downex.apps.gauravpatil.site/#software",
    name: "Downex — Simple Free Download Manager",
    alternateName: ["Downex", "Downex Download Manager"],
    url: "https://downex.apps.gauravpatil.site",
    downloadUrl: "https://gphost.eu.cc/raw/downex-desktop?stream=true",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Windows 10, Windows 11",
    isAccessibleForFree: true,
    codeRepository: "https://github.com/AspiringWebGaurav/downex",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description:
      "Simple, free & open-source 32-connection Windows download manager and IDM alternative by Gaurav Patil.",
    author: { "@id": `${baseUrl}/#person` },
    publisher: { "@id": `${baseUrl}/#person` },
  };

  const cpProductEntity = {
    "@type": "SoftwareApplication",
    "@id": "https://cp.apps.gauravpatil.site/#software",
    name: "CP Engine",
    alternateName: ["Copy. Paste. Faster.", "CP Windows Copy Accelerator"],
    url: "https://cp.apps.gauravpatil.site",
    downloadUrl: "https://gphost.eu.cc/raw/cp-desktop",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Windows 10, Windows 11",
    isAccessibleForFree: true,
    codeRepository: "https://github.com/AspiringWebGaurav/cp",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description:
      "Hardware-accelerated Windows Explorer file copy & move utility engineered for high-throughput unbuffered NVMe transfers and zero telemetry.",
    author: { "@id": `${baseUrl}/#person` },
    publisher: { "@id": `${baseUrl}/#person` },
  };

  const scheduleMeEntity = {
    "@type": "SoftwareApplication",
    "@id": "https://sm.apps.gauravpatil.site/#software",
    name: "ScheduleMe",
    url: "https://sm.apps.gauravpatil.site",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Windows 10, Windows 11",
    isAccessibleForFree: true,
    description:
      "Ultra-lightweight Rust & Tauri Windows shutdown, restart, and sleep scheduler with tray integration and zero background CPU overhead.",
    author: { "@id": `${baseUrl}/#person` },
    publisher: { "@id": `${baseUrl}/#person` },
  };

  const gpnNotesEntity = {
    "@type": "WebApplication",
    "@id": "https://gpn.apps.gauravpatil.site/#webapp",
    name: "GPN Notes",
    url: "https://gpn.apps.gauravpatil.site",
    applicationCategory: "ProductivityApplication",
    operatingSystem: "Windows, Web",
    isAccessibleForFree: true,
    description:
      "Private, encrypted, local-first personal notes workspace built with Next.js and Yjs CRDT synchronization.",
    author: { "@id": `${baseUrl}/#person` },
    publisher: { "@id": `${baseUrl}/#person` },
  };

  const projectItemList = {
    "@type": "ItemList",
    "@id": `${baseUrl}/#projects`,
    name: "Production Case Studies & Engineering Work by Gaurav Patil",
    numberOfItems: studies.length || dynamicProjects.length,
    itemListElement: (studies.length > 0
      ? studies.map((s, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          name: s.title,
          url: `${baseUrl}/projects/${s.slug}`,
          description: s.subtitle,
        }))
      : dynamicProjects.map((p, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          name: p.title,
          url: p.slug ? `${baseUrl}/projects/${p.slug}` : p.liveUrl,
          description: p.description,
        }))),
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      personEntity,
      downexProductEntity,
      cpProductEntity,
      scheduleMeEntity,
      gpnNotesEntity,
      projectItemList,
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        url: baseUrl,
        name: "Gaurav Patil Portfolio",
        alternateName: ["Gaurav Patil Dev", "www.gauravpatil.site"],
        description:
          data?.seo?.description ||
          "Official personal portfolio and software engineering showcase of Gaurav Patil — Full Stack Software Engineer building production-ready digital systems.",
        publisher: {
          "@id": `${baseUrl}/#person`,
        },
        inLanguage: "en-US",
      },
      {
        "@type": "ProfilePage",
        "@id": `${baseUrl}/#webpage`,
        url: baseUrl,
        name: data?.seo?.title || "Gaurav Patil | Full Stack Software Engineer & Web Developer",
        isPartOf: {
          "@id": `${baseUrl}/#website`,
        },
        about: {
          "@id": `${baseUrl}/#person`,
        },
        mainEntity: {
          "@id": `${baseUrl}/#person`,
        },
        description:
          data?.seo?.description ||
          "Official portfolio of Gaurav Patil — Full Stack Software Engineer and Web Developer showcasing production-ready digital systems, web applications, and in-depth technical case studies.",
        dateCreated: "2024-01-01T00:00:00+00:00",
        dateModified,
        inLanguage: "en-US",
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
