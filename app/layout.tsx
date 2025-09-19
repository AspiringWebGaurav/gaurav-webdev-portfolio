import { Geist, Geist_Mono } from "next/font/google";
import type { Metadata } from 'next';
import "./globals.css";
import { ThemeProvider } from "./provider";
import EnhancedToastProvider from "@/components/ToastSystem";
import PWAInitializer from "@/components/PWAInitializer";
import { SpeedInsights } from "@vercel/speed-insights/next"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Production-Ready SEO Metadata
export const metadata: Metadata = {
  metadataBase: new URL("https://gaurav-webdev-portfolio.vercel.app"),
  
  // Core SEO
  title: {
    default: "Gaurav Patil - React & Next.js Developer | Portfolio",
    template: "%s | Gaurav Patil - Developer Portfolio"
  },
  description: "Experienced React & Next.js Developer specializing in TypeScript, modern UI/UX, and scalable web applications. 3+ years building performance-optimized user experiences.",
  
  // Keywords & Classification
  keywords: [
    "React Developer",
    "Next.js Developer",
    "TypeScript Developer",
    "Frontend Developer",
    "Full Stack Developer",
    "UI/UX Developer",
    "JavaScript Developer",
    "Web Developer Portfolio",
    "Gaurav Patil",
    "Performance Optimization",
    "Modern Web Applications",
    "Scalable Applications"
  ],
  
  // Authors & Attribution
  authors: [
    {
      name: "Gaurav Patil",
      url: "https://gaurav-webdev-portfolio.vercel.app"
    }
  ],
  creator: "Gaurav Patil",
  publisher: "Gaurav Patil",
  
  // Application Info
  applicationName: "Gaurav's Portfolio",
  category: "Technology",
  classification: "Portfolio Website",
  
  // Note: themeColor and colorScheme moved to viewport export per Next.js 15 requirements
  
  // Icons - Production Ready
  icons: {
    icon: [
      { url: "/icon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon-64x64.png", sizes: "64x64", type: "image/png" },
      { url: "/icon-128x128.png", sizes: "128x128", type: "image/png" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-256x256.png", sizes: "256x256", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ],
    shortcut: "/favicon.ico",
    other: [
      {
        rel: "mask-icon",
        url: "/icon-512x512-maskable.png",
      }
    ]
  },
  
  // Open Graph - Social Sharing
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://gaurav-webdev-portfolio.vercel.app",
    siteName: "Gaurav's Portfolio",
    title: "Gaurav Patil - React & Next.js Developer Portfolio",
    description: "Experienced developer specializing in React, Next.js, TypeScript, and modern web applications. Explore projects and expertise in performance optimization.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Gaurav Patil - React & Next.js Developer Portfolio",
        type: "image/png"
      }
    ]
  },
  
  // Twitter Cards
  twitter: {
    card: "summary_large_image",
    site: "@gauravpatil", // Update with actual handle
    creator: "@gauravpatil", // Update with actual handle
    title: "Gaurav Patil - React & Next.js Developer",
    description: "Experienced developer building scalable web applications with React, Next.js, and TypeScript. View projects and technical expertise.",
    images: ["/og-image.png"]
  },
  
  // PWA & Mobile
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Gaurav's Portfolio"
  },
  
  // Additional Meta
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false
  }
};

// Viewport Configuration (Next.js 15+ requirement)
export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#3b82f6" },
    { media: "(prefers-color-scheme: dark)", color: "#1e40af" }
  ],
  colorScheme: "dark light",
};

// JSON-LD Structured Data Component
function StructuredData() {
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": "https://gaurav-webdev-portfolio.vercel.app/#person",
    "name": "Gaurav Patil",
    "givenName": "Gaurav",
    "familyName": "Patil",
    "alternateName": ["Gaurav", "Gaurav Developer"],
    "description": "Experienced React & Next.js Developer with 3+ years of expertise in TypeScript, modern UI/UX design, and building scalable web applications focused on performance optimization and exceptional user experiences.",
    "url": "https://gaurav-webdev-portfolio.vercel.app",
    "image": {
      "@type": "ImageObject",
      "url": "https://gaurav-webdev-portfolio.vercel.app/logo-1024.png",
      "width": 1024,
      "height": 1024
    },
    "sameAs": [
      "https://github.com/AspiringWebGaurav",
      "https://linkedin.com/in/gaurav-webdev"
    ],
    "jobTitle": "React & Next.js Developer",
    "worksFor": {
      "@type": "Organization",
      "name": "Freelance Developer"
    },
    "knowsAbout": [
      "React",
      "Next.js",
      "TypeScript",
      "JavaScript",
      "Node.js",
      "UI/UX Design",
      "Frontend Development",
      "Full Stack Development",
      "Performance Optimization",
      "Web Development",
      "Modern Web Applications"
    ],
    "hasOccupation": {
      "@type": "Occupation",
      "name": "Frontend Developer",
      "occupationLocation": {
        "@type": "Place",
        "name": "Remote"
      },
      "skills": [
        "React Development",
        "Next.js Framework",
        "TypeScript Programming",
        "UI/UX Design",
        "Performance Optimization",
        "Responsive Web Design",
        "Modern JavaScript"
      ]
    },
    "alumniOf": {
      "@type": "Organization",
      "name": "Self-taught Developer"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Professional",
      "url": "https://gaurav-webdev-portfolio.vercel.app"
    }
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://gaurav-webdev-portfolio.vercel.app/#website",
    "name": "Gaurav's Portfolio",
    "alternateName": "Gaurav Patil Developer Portfolio",
    "description": "Professional portfolio showcasing React & Next.js development expertise, featuring modern web applications, UI/UX design, and performance-optimized solutions.",
    "url": "https://gaurav-webdev-portfolio.vercel.app",
    "inLanguage": "en-US",
    "publisher": {
      "@type": "Person",
      "@id": "https://gaurav-webdev-portfolio.vercel.app/#person",
      "name": "Gaurav Patil"
    },
    "author": {
      "@type": "Person",
      "@id": "https://gaurav-webdev-portfolio.vercel.app/#person",
      "name": "Gaurav Patil"
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://gaurav-webdev-portfolio.vercel.app/?q={search_term_string}"
      },
      "query-input": {
        "@type": "PropertyValueSpecification",
        "valueRequired": true,
        "valueName": "search_term_string"
      }
    },
    "mainEntity": {
      "@type": "Person",
      "@id": "https://gaurav-webdev-portfolio.vercel.app/#person"
    },
    "about": {
      "@type": "Thing",
      "name": "Web Development Portfolio",
      "description": "Professional portfolio showcasing expertise in React, Next.js, TypeScript, and modern web development practices."
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": "https://gaurav-webdev-portfolio.vercel.app/#breadcrumbs",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": {
          "@type": "WebPage",
          "@id": "https://gaurav-webdev-portfolio.vercel.app/",
          "url": "https://gaurav-webdev-portfolio.vercel.app/",
          "name": "Home - Gaurav's Portfolio"
        }
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Projects",
        "item": {
          "@type": "WebPage",
          "@id": "https://gaurav-webdev-portfolio.vercel.app/#projects",
          "url": "https://gaurav-webdev-portfolio.vercel.app/#projects",
          "name": "Projects - Recent Work & Case Studies"
        }
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "Experience",
        "item": {
          "@type": "WebPage",
          "@id": "https://gaurav-webdev-portfolio.vercel.app/#experience",
          "url": "https://gaurav-webdev-portfolio.vercel.app/#experience",
          "name": "Experience - Professional Background"
        }
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": "Contact",
        "item": {
          "@type": "WebPage",
          "@id": "https://gaurav-webdev-portfolio.vercel.app/#contact",
          "url": "https://gaurav-webdev-portfolio.vercel.app/#contact",
          "name": "Contact - Get In Touch"
        }
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(personSchema)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema)
        }}
      />
    </>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <StructuredData />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <PWAInitializer />
          <EnhancedToastProvider />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
