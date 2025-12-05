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
import ConditionalChatBubble from "@/components/ConditionalChatBubble";
import BubbleSessionDeletedNotification from "@/components/BubbleSessionDeletedNotification";
import BanChecker from "@/components/BanChecker";
import BanGate from "@/components/BanGate";
import BanMonitor from "@/components/BanMonitor";
import MaintenanceGate from "@/components/MaintenanceGate";
import MaintenanceMonitor from "@/components/MaintenanceMonitor";
import ToastProvider from "@/components/providers/ToastProvider";
import AnalyticsHealthMonitor from "@/components/AnalyticsHealthMonitor";
import VisitorTracker from "@/components/VisitorTracker";
import ScrollRestoration from "@/hooks/useScrollRestoration";
// Initialize fingerprint ONCE at app startup to prevent race conditions
import "@/lib/fingerprintInit";
// Development: Test utilities for scroll restoration
import "@/lib/scrollRestorationTest";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gaurav's Portfolio",
  description: "Moders Slick and Minimal Portfolio Showcasing Js Mastery",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ChunkErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <ContactSubmissionProvider>
              <BugReportProvider>
                <BubbleSessionProvider>
                  <BubbleMessageProvider>
                    <ChatBubbleControlProvider>
                      <BanGate>
                        <MaintenanceGate>
                          <ScrollRestoration />
                          <BanMonitor />
                          <MaintenanceMonitor />
                          <AnalyticsHealthMonitor />
                          <VisitorTracker />
                          {children}
                          <ConditionalChatBubble />
                          <BubbleSessionDeletedNotification />
                          <ToastProvider />
                        </MaintenanceGate>
                      </BanGate>
                    </ChatBubbleControlProvider>
                  </BubbleMessageProvider>
                </BubbleSessionProvider>
              </BugReportProvider>
            </ContactSubmissionProvider>
          </ThemeProvider>
        </ChunkErrorBoundary>
      </body>
    </html>
  );
}
