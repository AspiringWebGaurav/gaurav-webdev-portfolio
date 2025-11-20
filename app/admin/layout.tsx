import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import ToastProvider from "@/components/providers/ToastProvider";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { LoadingProvider } from "@/contexts/LoadingContext";
import { RecycleBinProvider } from "@/contexts/RecycleBinContext";
import { TechStackProvider } from "@/contexts/TechStackContext";
import { CurrentlyWorkingProvider } from "@/contexts/CurrentlyWorkingContext";
import { ProjectProvider } from "@/contexts/ProjectContext";
import { TestimonialProvider } from "@/contexts/TestimonialContext";
import { WorkExperienceProvider } from "@/contexts/WorkExperienceContext";
import { VisitorAnalyticsProvider } from "@/contexts/VisitorAnalyticsContext";
import { BubbleManagementProvider } from "@/contexts/BubbleManagementContext";
import { BanAppealsProvider } from "@/contexts/BanAppealsContext";
import AppLoader from "@/components/admin/AppLoader";
import { SessionMonitor } from "@/components/SessionMonitor";
import ConnectionStatusIndicator from "@/components/admin/ConnectionStatusIndicator";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Portfolio Admin Panel",
  description: "Admin panel for managing Gaurav's portfolio",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-gray-900 min-h-screen`}
    >
      <LoadingProvider>
        <NotificationProvider>
          <RecycleBinProvider>
            <TechStackProvider>
              <CurrentlyWorkingProvider>
                <ProjectProvider>
                  <TestimonialProvider>
                    <WorkExperienceProvider>
                      <VisitorAnalyticsProvider>
                        <BubbleManagementProvider>
                          <BanAppealsProvider>
                            <ToastProvider />
                            <AppLoader />
                            <SessionMonitor />
                            <ConnectionStatusIndicator />
                            {children}
                          </BanAppealsProvider>
                        </BubbleManagementProvider>
                      </VisitorAnalyticsProvider>
                    </WorkExperienceProvider>
                  </TestimonialProvider>
                </ProjectProvider>
              </CurrentlyWorkingProvider>
            </TechStackProvider>
          </RecycleBinProvider>
        </NotificationProvider>
      </LoadingProvider>
    </div>
  );
}
