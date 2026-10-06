import type { Metadata, Viewport } from "next";
import React from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { RecruiterThemeEnforcer } from "@/components/contact-portal/layout/RecruiterThemeEnforcer";

const adminSans = Geist({
  variable: "--font-admin-sans",
  subsets: ["latin"],
  display: "swap",
});

const adminMono = Geist_Mono({
  variable: "--font-admin-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FAFAFA",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://contact.gauravpatil.site"),
  title: {
    default: "Verified Recruiter Portal | Gaurav Patil — Full Stack Software Engineer",
    template: "%s | Gaurav Patil Recruiter Portal",
  },
  description:
    "Direct verified gateway for engineering leaders, hiring managers, and executive recruiters to connect with Gaurav Patil. Access verified candidate resume, technical background, direct communication channels, and real-time conversation.",
  keywords: [
    "Gaurav Patil",
    "Recruiter Portal",
    "Hire Gaurav Patil",
    "Full Stack Software Engineer",
    "Web Developer Portfolio",
    "Verified Candidate Resume",
    "Direct Talent Access",
    "Next.js Engineer",
    "React Developer",
    "TypeScript Engineer",
    "Systems Architecture",
  ],
  authors: [{ name: "Gaurav Patil", url: "https://gauravpatil.site" }],
  creator: "Gaurav Patil",
  publisher: "Gaurav Patil",
  alternates: {
    canonical: "https://contact.gauravpatil.site",
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
  openGraph: {
    title: "Verified Recruiter Portal | Gaurav Patil — Full Stack Software Engineer",
    description:
      "Direct verified gateway for engineering leaders, hiring managers, and executive recruiters to connect with Gaurav Patil. Access verified candidate resume and direct communication channels.",
    url: "https://contact.gauravpatil.site",
    siteName: "Gaurav Patil Recruiter Portal",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://gauravpatil.site/og-image.png",
        width: 1200,
        height: 630,
        alt: "Gaurav Patil — Verified Recruiter Contact Portal",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Verified Recruiter Portal | Gaurav Patil — Full Stack Software Engineer",
    description:
      "Direct verified gateway for engineering leaders, hiring managers, and executive recruiters to connect with Gaurav Patil.",
    creator: "@gauravpatil",
    images: ["https://gauravpatil.site/og-image.png"],
  },
};

const recruiterPortalJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": "https://gauravpatil.site/#person",
      name: "Gaurav Patil",
      url: "https://gauravpatil.site",
      image: "https://gauravpatil.site/og-image.png",
      jobTitle: "Full Stack Software Engineer",
      email: "mailto:gaurav@gauravpatil.site",
      sameAs: [
        "https://github.com/AspiringWebGaurav",
        "https://gauravpatil.site",
        "https://contact.gauravpatil.site",
      ],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "recruiter and talent inquiries",
        url: "https://contact.gauravpatil.site",
        email: "gaurav@gauravpatil.site",
        availableLanguage: ["English", "Hindi", "Marathi"],
      },
    },
    {
      "@type": "ContactPage",
      "@id": "https://contact.gauravpatil.site/#webpage",
      url: "https://contact.gauravpatil.site",
      name: "Verified Recruiter Portal | Gaurav Patil",
      description:
        "Direct verified gateway for engineering leaders, hiring managers, and executive recruiters to connect with Gaurav Patil. Access verified candidate resume and direct communication.",
      about: {
        "@id": "https://gauravpatil.site/#person",
      },
      mainEntity: {
        "@id": "https://gauravpatil.site/#person",
      },
      inLanguage: "en-US",
    },
  ],
};

export default function RecruiterPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* 1. Synchronous Frame-0 light theme lock: guarantees pure light theme before paint */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){
            try {
              var el = document.documentElement;
              el.classList.remove('dark');
              el.classList.add('light');
              el.style.backgroundColor = '#FAFAFA';
              el.style.colorScheme = 'light';
              el.setAttribute('data-theme-isolated', 'recruiter');
              if (document.body) {
                document.body.style.backgroundColor = '#FAFAFA';
                document.body.style.color = '#000000';
              }
            } catch(e) {}
          })();`,
        }}
      />

      {/* 2. Permanent Frame-0 style override: prevents any dark theme inheritance on recruiter portal */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            html:has([data-portal-type="recruiter"]),
            html:has([data-portal="recruiter"]),
            html:has([data-portal="true"]),
            body:has([data-portal-type="recruiter"]),
            body:has([data-portal="recruiter"]),
            body:has([data-portal="true"]) {
              background-color: #FAFAFA !important;
              color-scheme: light !important;
            }
          `,
        }}
      />

      {/* 3. Runtime Theme Lock: isolates from BroadcastChannel/cookie sync and restores prior theme on unmount */}
      <RecruiterThemeEnforcer />

      <div
        data-portal="true"
        data-portal-type="recruiter"
        className={`${adminSans.variable} ${adminMono.variable} font-admin-sans relative h-[100dvh] max-h-[100dvh] w-full overflow-hidden bg-[#FAFAFA] text-black flex flex-col`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(recruiterPortalJsonLd) }}
        />
        {/* Main 100dvh zero-scroll content container */}
        <main className="relative z-10 flex-1 flex flex-col h-full max-h-[100dvh] overflow-hidden">
          {children}
        </main>
      </div>
    </>
  );
}
