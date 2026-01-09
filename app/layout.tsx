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
// Crash Report System
import { GlobalCrashHandler, BrowserCrashListeners } from "@/crash-report-mechanism/components/GlobalCrashHandler";
import { CrashReportProvider } from "@/crash-report-mechanism/contexts/CrashReportContext";
import ConditionalChatBubble from "@/components/ConditionalChatBubble";
import BubbleSessionDeletedNotification from "@/components/BubbleSessionDeletedNotification";
import BanChecker from "@/components/BanChecker";
import BanGate from "@/components/BanGate";
import BanMonitor from "@/components/BanMonitor";
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
// Vercel Analytics
import { Analytics } from "@vercel/analytics/react";
// Initialize fingerprint ONCE at app startup to prevent race conditions
import "@/lib/fingerprintInit";
import StructuredData from "@/components/StructuredData";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#CBACF9',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://www.gauravworkspace.store'),
  title: {
    default: "Gaurav Patil - Full Stack Developer & Software Engineer | Professional Portfolio",
    template: "%s | Gaurav Patil - Full Stack Developer"
  },
  description: "Professional portfolio of Gaurav Patil - Expert Full Stack Developer specializing in Next.js 16, React 19, TypeScript, Firebase & scalable web applications. Explore projects, skills & experience in modern web development, cloud architecture, and enterprise solutions. Available for collaboration & consultation.",
  applicationName: "Gaurav Patil Portfolio",
  referrer: "origin-when-cross-origin",
  keywords: [
    "Gaurav Patil",
    "Gaurav Workspace",
    "Full Stack Developer",
    "Software Engineer",
    "Web Developer Portfolio",
    "Next.js Expert",
    "React Developer",
    "TypeScript Developer",
    "Firebase Developer",
    "Cloud Architecture",
    "Scalable Web Applications",
    "Modern Web Development",
    "Enterprise Solutions",
    "Frontend Development",
    "Backend Development",
    "JavaScript Developer",
    "Node.js Developer",
    "Real-time Applications",
    "Progressive Web Apps",
    "Responsive Design",
    "API Development",
    "Database Design",
    "Software Architecture",
    "Tech Portfolio",
    "Developer Portfolio"
  ],
  authors: [{ name: "Gaurav Patil", url: "https://www.gauravworkspace.store" }],
  creator: "Gaurav Patil",
  publisher: "Gaurav Workspace",
  category: "Technology",
  classification: "Professional Portfolio",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: "Gaurav Patil",
    statusBarStyle: "black-translucent",
  },
  verification: {
    google: 'google-site-verification-token',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.gauravpatil.online',
    title: 'Gaurav Patil - Full Stack Developer & Software Engineer | Professional Portfolio',
    description: 'Expert Full Stack Developer specializing in Next.js, React, TypeScript & Firebase. Explore innovative web projects, technical skills & professional experience. Available for collaboration.',
    siteName: 'Gaurav Patil Portfolio',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@gauravpatil',
    creator: '@gauravpatil',
    title: 'Gaurav Patil - Full Stack Developer | Expert in Next.js & React',
    description: 'Professional portfolio showcasing enterprise-grade web development projects, technical expertise in modern JavaScript frameworks & cloud solutions. Explore my work!',
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://www.gauravpatil.online',
    languages: {
      'en-US': 'https://www.gauravpatil.online',
    },
  },
  other: {
    'portfolio-url': 'https://www.gauravpatil.online',
    'workspace-url': 'https://www.gauravworkspace.store',
    'contact-page': 'https://www.gauravpatil.online#contact',
    'projects-page': 'https://www.gauravpatil.online#projects',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
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
                      <BanGate>
                        <MaintenanceGate>
                          <MaintenanceMonitor>
                            <SuspensionMonitor>
                              <SuspensionGate>
                                <BurnPreventionInitializer />
                                <ScrollRestoration />
                                <BanMonitor />
                                <LocalMaintenanceBanner />
                                <AnalyticsHealthMonitor />
                                <VisitorTracker />
                                {children}
                                <ScrollToTop />
                                <ConditionalChatBubble />
                                <BubbleSessionDeletedNotification />
                                <ToastProvider />
                              </SuspensionGate>
                            </SuspensionMonitor>
                          </MaintenanceMonitor>
                        </MaintenanceGate>
                      </BanGate>
                    </ChatBubbleControlProvider>
                  </BubbleMessageProvider>
                </BubbleSessionProvider>
              </CrashReportProvider>
            </BugReportProvider>
          </ContactSubmissionProvider>
        </ThemeProvider>
      </ChunkErrorBoundary>
    </GlobalCrashHandler>
    <Analytics />
  </body>
</html>
);
}
