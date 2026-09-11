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
        jobTitle: ["Full Stack Software Engineer", "Software Engineer"],
        description:
          "Full Stack Software Engineer building production-ready digital systems, scalable web applications, and high-performance software architectures.",
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
          "Software Engineering",
          "Production-Ready Software",
          "Web Applications",
          "AI-Assisted Development",
          "Technical Case Studies",
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
          "Official personal portfolio and software engineering showcase of Gaurav Patil — Full Stack Software Engineer building production-ready digital systems.",
        publisher: {
          "@id": `${baseUrl}/#person`,
        },
        inLanguage: "en-US",
      },
      {
        "@type": "ProfilePage",
        "@id": `${baseUrl}/#webpage`,
        url: `${baseUrl}/`,
        name: "Gaurav Patil — Full Stack Software Engineer Building Production-Ready Digital Systems",
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
          "Official portfolio of Gaurav Patil — Full Stack Software Engineer showcasing production-ready digital systems, web applications, and in-depth technical case studies.",
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
