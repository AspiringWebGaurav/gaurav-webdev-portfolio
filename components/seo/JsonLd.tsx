import React from "react";

interface PortfolioJsonLdProps {
  siteUrl?: string;
}

export function PortfolioJsonLd({ siteUrl }: PortfolioJsonLdProps = {}) {
  const baseUrl = (siteUrl || process.env.NEXT_PUBLIC_APP_URL || "https://gauravjpatil.com").replace(/\/$/, "");

  const personEntity = {
    "@type": "Person",
    "@id": `${baseUrl}/#person`,
    name: "Gaurav Patil",
    givenName: "Gaurav",
    additionalName: "Jayendra",
    familyName: "Patil",
    alternateName: [
      "Gaurav Jayendra Patil",
      "Gaurav Patil (Gaurav Jayendra Patil)",
      "Gaurav Patil Dev",
      "AspiringWebGaurav",
      "Gaurav J. Patil",
    ],
    url: baseUrl,
    image: `${baseUrl}/og-image.png`,
    jobTitle: [
      "Full Stack Software Engineer",
      "Full Stack Web Developer",
      "Software Engineer",
      "Full Stack Developer",
    ],
    description:
      "Gaurav Patil (Gaurav Jayendra Patil) is a Full Stack Software Engineer and Web Developer from Kolhapur, Maharashtra, India, building production-ready digital systems, scalable web applications, and high-performance software architectures.",
    email: "mailto:hello@gauravpatil.site",
    nationality: {
      "@type": "Country",
      name: "India",
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Kolhapur",
      addressRegion: "Maharashtra",
      addressCountry: "India",
    },
    homeLocation: {
      "@type": "Place",
      name: "Kolhapur, Maharashtra, India",
    },
    sameAs: [
      "https://github.com/AspiringWebGaurav",
      "https://gauravjpatil.com",
    ],
    knowsAbout: [
      "Full Stack Development",
      "Web Development",
      "Software Engineering",
      "Production-Ready Software",
      "Web Applications",
      "Next.js",
      "React",
      "TypeScript",
      "JavaScript",
      "Tailwind CSS",
      "Node.js",
      "AI-Assisted Development",
      "Technical Case Studies",
      "Three.js",
      "Web Performance Optimization",
      "Cloud Architecture",
    ],
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      personEntity,
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        url: baseUrl,
        name: "Gaurav Patil Portfolio | Gaurav Jayendra Patil",
        alternateName: "Gaurav Patil Dev",
        description:
          "Official personal portfolio and software engineering showcase of Gaurav Patil (Gaurav Jayendra Patil) — Full Stack Software Engineer building production-ready digital systems.",
        publisher: {
          "@id": `${baseUrl}/#person`,
        },
        inLanguage: "en-US",
      },
      {
        "@type": "ProfilePage",
        "@id": `${baseUrl}/#webpage`,
        url: baseUrl,
        name: "Gaurav Patil | Full Stack Software Engineer & Web Developer (Gaurav Jayendra Patil)",
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
          "Official portfolio of Gaurav Patil (Gaurav Jayendra Patil) — Full Stack Software Engineer and Web Developer from Kolhapur, Maharashtra, India, showcasing production-ready digital systems, web applications, and in-depth technical case studies.",
        dateCreated: "2024-01-01T00:00:00+00:00",
        dateModified: "2026-09-25T00:00:00+00:00",
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
