import type { Metadata, Viewport } from "next";
import React from "react";

export const revalidate = 86400;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#050816",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://services.gauravpatil.site"),
  title: "Gaurav Patil — Services & Command Hubs",
  description:
    "Unified Services Portal for Gaurav Patil. Verified interactive resume, secure Talk command hub, and dedicated recruiter contact gateway: resume.services, talk.services, and contact.services.",
  alternates: {
    canonical: "https://services.gauravpatil.site",
  },
  openGraph: {
    title: "Services Hub | Gaurav Patil — Enterprise & Recruiter Services",
    description:
      "Interactive Resume, Talk Command Hub, and Recruiter Gateway. High-availability, verified edge routing.",
    url: "https://services.gauravpatil.site",
    siteName: "Gaurav Patil Services",
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const servicesHubJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "@id": "https://services.gauravpatil.site/#webpage",
      url: "https://services.gauravpatil.site",
      name: "Gaurav Patil — Services & Command Hubs",
      description:
        "Unified Services Portal for Gaurav Patil: Verified Interactive Resume, Talk Command Hub, and Recruiter Contact Gateway.",
      author: {
        "@type": "Person",
        "@id": "https://gauravpatil.site/#person",
        name: "Gaurav Patil",
        url: "https://gauravpatil.site",
      },
      mainEntity: {
        "@type": "ItemList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Verified Interactive Resume Portal",
            url: "https://resume.services.gauravpatil.site",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Talk Command Hub",
            url: "https://talk.services.gauravpatil.site",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: "Recruiter & Executive Contact Gateway",
            url: "https://contact.services.gauravpatil.site",
          },
        ],
      },
    },
  ],
};

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-[100dvh] min-h-[100dvh] max-h-[100dvh] w-full overflow-hidden bg-[#fafafa] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 selection:bg-violet-500 selection:text-white touch-manipulation [-webkit-tap-highlight-color:transparent]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(servicesHubJsonLd) }}
      />
      {children}
    </div>
  );
}
