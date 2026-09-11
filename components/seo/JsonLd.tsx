import React from "react";

interface PortfolioJsonLdProps {
  siteUrl?: string;
}

export function PortfolioJsonLd({ siteUrl }: PortfolioJsonLdProps = {}) {
  const baseUrl = (siteUrl || process.env.NEXT_PUBLIC_APP_URL || "https://gauravpatil.site").replace(/\/$/, "");

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${baseUrl}/#person`,
        name: "Gaurav Patil",
        url: `${baseUrl}/`,
        jobTitle: ["Full Stack Developer", "Software Engineer"],
        description:
          "Full Stack Developer & Software Engineer based in India specializing in Next.js, React, TypeScript, and modern scalable web architecture.",
        email: "mailto:hello@gauravpatil.site",
        nationality: {
          "@type": "Country",
          name: "India",
        },
        sameAs: ["https://github.com/AspiringWebGaurav"],
        knowsAbout: [
          "Next.js",
          "React",
          "TypeScript",
          "JavaScript",
          "Tailwind CSS",
          "Node.js",
          "Three.js",
          "Web Performance Optimization",
          "Cloud Architecture",
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        url: `${baseUrl}/`,
        name: "Gaurav Patil Portfolio",
        description:
          "Official personal portfolio of Gaurav Patil — Full Stack Developer & Software Engineer.",
        publisher: {
          "@id": `${baseUrl}/#person`,
        },
        inLanguage: "en-US",
      },
      {
        "@type": "ProfilePage",
        "@id": `${baseUrl}/#webpage`,
        url: `${baseUrl}/`,
        name: "Gaurav Patil — Full Stack Developer & Software Engineer",
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
          "Official portfolio of Gaurav Patil, showcasing software engineering projects, web applications, tech stack, and experience.",
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
