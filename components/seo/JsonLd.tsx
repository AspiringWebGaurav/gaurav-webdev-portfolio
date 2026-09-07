import React from "react";

export function PortfolioJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": "https://gauravpatil.site/#person",
        name: "Gaurav Patil",
        url: "https://gauravpatil.site",
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
        "@id": "https://gauravpatil.site/#website",
        url: "https://gauravpatil.site",
        name: "Gaurav Patil Portfolio",
        description:
          "Official personal portfolio of Gaurav Patil — Full Stack Developer & Software Engineer.",
        publisher: {
          "@id": "https://gauravpatil.site/#person",
        },
        inLanguage: "en-US",
      },
      {
        "@type": "ProfilePage",
        "@id": "https://gauravpatil.site/#webpage",
        url: "https://gauravpatil.site",
        name: "Gaurav Patil — Full Stack Developer & Software Engineer",
        isPartOf: {
          "@id": "https://gauravpatil.site/#website",
        },
        about: {
          "@id": "https://gauravpatil.site/#person",
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
