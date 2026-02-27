import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "./provider";
import { ChunkErrorBoundary } from "@/components/ChunkErrorBoundary";

import { ContactSubmissionProvider } from "@/contexts/ContactSubmissionContext";
import { BugReportProvider } from "@/contexts/BugReportContext";
import { BubbleSessionProvider } from "@/contexts/BubbleSessionContext";
import { BubbleMessageProvider } from "@/contexts/BubbleMessageContext";
import { ChatBubbleControlProvider } from "@/contexts/ChatBubbleControlContext";
import { AbusePolicyProvider } from "@/contexts/AbusePolicyContext";

import { GlobalCrashHandler, BrowserCrashListeners } from "@/crash-report-mechanism/components/GlobalCrashHandler";
import { CrashReportProvider } from "@/crash-report-mechanism/contexts/CrashReportContext";
import CrashReportingInitializer from "@/crash-report-mechanism/components/CrashReportingInitializer";

import ConditionalChatBubble from "@/components/ConditionalChatBubble";
import BubbleSessionDeletedNotification from "@/components/BubbleSessionDeletedNotification";

import BanChecker from "@/components/BanChecker";
import BanGate from "@/components/BanGate";
import BanMonitor from "@/components/BanMonitor";

import AbusePolicyGate from "@/components/AbusePolicyGate";
import AbusePolicyMonitor from "@/components/AbusePolicyMonitor";

import MaintenanceGate from "@/components/MaintenanceGate";
import MaintenanceMonitor from "@/components/MaintenanceMonitor";

import SuspensionMonitor from "@/components/SuspensionMonitor";
import SuspensionGate from "@/components/SuspensionGate";

import LocalMaintenanceBanner from "@/components/LocalMaintenanceBanner";
import ToastProvider from "@/components/providers/ToastProvider";

import AnalyticsHealthMonitor from "@/components/AnalyticsHealthMonitor";
import VisitorTracker from "@/components/VisitorTracker";

import ScrollRestoration from "@/hooks/useScrollRestoration";
import ScrollToTop from "@/components/ScrollToTop";

import BurnPreventionInitializer from "@/components/BurnPreventionInitializer";
import MicroSpinner from "@/components/MicroSpinner";

import StructuredData from "@/components/StructuredData";

// Vercel Analytics
import { Analytics } from "@vercel/analytics/react";

import FingerprintInitializer from "@/components/FingerprintInitializer";

// TURBOPACK-SAFE: Removed module-level side effect imports
// These are now initialized in client components:
// - FingerprintInitializer (replaces @/lib/fingerprintInit)
// - BurnPreventionInitializer (already exists, will be updated)
// - Server schedulers are initialized via middleware (not layout.tsx)

/* -------------------------------------------------- */
/* FONTS                                              */
/* -------------------------------------------------- */

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/* -------------------------------------------------- */
/* VIEWPORT                                           */
/* -------------------------------------------------- */

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#CBACF9",
};

/* -------------------------------------------------- */
/* METADATA                                          */
/* -------------------------------------------------- */

export const metadata: Metadata = {
  metadataBase: new URL("https://www.gauravpatil.online"),
  title: {
    default:
      "Gaurav Patil - Full Stack Developer & Software Engineer | Professional Portfolio",
    template: "%s | Gaurav Patil - Full Stack Developer",
  },
  description:
    "Professional portfolio of Gaurav Patil - Expert Full Stack Developer specializing in Next.js 16, React 19, TypeScript, Firebase & scalable web applications.",
  applicationName: "Gaurav Patil Portfolio",
  referrer: "origin-when-cross-origin",
  keywords: [
    "Gaurav Patil",
    "Full Stack Developer",
    "Software Engineer",
    "Next.js Expert",
    "React Developer",
    "TypeScript Developer",
    "Firebase Developer",
    "Enterprise Web Applications",
  ],
  authors: [
    { name: "Gaurav Patil", url: "https://www.gauravpatil.online" },
  ],
  creator: "Gaurav Patil",
  publisher: "Gaurav Workspace",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Gaurav Patil",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.gauravpatil.online",
    title:
      "Gaurav Patil - Full Stack Developer & Software Engineer | Portfolio",
    description:
      "Expert Full Stack Developer specializing in Next.js, React, TypeScript & Firebase.",
    siteName: "Gaurav Patil Portfolio",
    images: [
      {
        url: "https://www.gauravpatil.online/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Gaurav Patil - Full Stack Developer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    creator: "@gauravpatil",
    title: "Gaurav Patil - Full Stack Developer & Software Engineer",
    description:
      "Expert Full Stack Developer specializing in Next.js, React, TypeScript & Firebase.",
    images: ["https://www.gauravpatil.online/twitter-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://www.gauravpatil.online",
  },
};

/* -------------------------------------------------- */
/* ROOT LAYOUT                                       */
/* -------------------------------------------------- */

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className="dark"
      style={{ colorScheme: "dark" }}
      suppressHydrationWarning
    >
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <StructuredData />

        <GlobalCrashHandler>
          <BrowserCrashListeners />

          <ChunkErrorBoundary>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem
              disableTransitionOnChange
            >
              <ContactSubmissionProvider>
                <BugReportProvider>
                  <CrashReportProvider>
                    <BubbleSessionProvider>
                      <BubbleMessageProvider>
                        <ChatBubbleControlProvider>
                          <AbusePolicyProvider>
                            <BanGate>
                              <MaintenanceGate>
                                <MaintenanceMonitor>
                                  <SuspensionMonitor>
                                    <SuspensionGate>
                                      <AbusePolicyGate>
                                        <CrashReportingInitializer />
                                        <FingerprintInitializer />
                                        <BurnPreventionInitializer />
                                        <ScrollRestoration />
                                        <BanMonitor />
                                        <AbusePolicyMonitor />
                                        <LocalMaintenanceBanner />
                                        <AnalyticsHealthMonitor />
                                        <VisitorTracker />

                                        <MicroSpinner />

                                        {children}

                                        <ScrollToTop />
                                        <ConditionalChatBubble />
                                        <BubbleSessionDeletedNotification />
                                        <ToastProvider />
                                      </AbusePolicyGate>
                                    </SuspensionGate>
                                  </SuspensionMonitor>
                                </MaintenanceMonitor>
                              </MaintenanceGate>
                            </BanGate>
                          </AbusePolicyProvider>
                        </ChatBubbleControlProvider>
                      </BubbleMessageProvider>
                    </BubbleSessionProvider>
                  </CrashReportProvider>
                </BugReportProvider>
              </ContactSubmissionProvider>
            </ThemeProvider>
          </ChunkErrorBoundary>
        </GlobalCrashHandler>

        {/* Analytics wrapped in try-catch to prevent OpenTelemetry errors */}
        {(() => {
          try {
            return <Analytics />;
          } catch (error) {
            console.error('[Layout] Analytics initialization failed:', error);
            return null;
          }
        })()}
      </body>
    </html>
  );
}
