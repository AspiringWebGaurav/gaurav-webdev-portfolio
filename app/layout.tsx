import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./provider";
import { ChunkErrorBoundary } from "@/components/ChunkErrorBoundary";
import { ContactSubmissionProvider } from "@/contexts/ContactSubmissionContext";
import { BubbleSessionProvider } from "@/contexts/BubbleSessionContext";
import { BubbleMessageProvider } from "@/contexts/BubbleMessageContext";
import { ChatBubbleControlProvider } from "@/contexts/ChatBubbleControlContext";
import ConditionalChatBubble from "@/components/ConditionalChatBubble";
import BubbleSessionDeletedNotification from "@/components/BubbleSessionDeletedNotification";
import VisitorTracker from "@/components/VisitorTracker";
import BanChecker from "@/components/BanChecker";
import ToastProvider from "@/components/providers/ToastProvider";

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
              <BubbleSessionProvider>
                <BubbleMessageProvider>
                  <ChatBubbleControlProvider>
                    <BanChecker />
                    <VisitorTracker />
                    {children}
                    <ConditionalChatBubble />
                    <BubbleSessionDeletedNotification />
                    <ToastProvider />
                  </ChatBubbleControlProvider>
                </BubbleMessageProvider>
              </BubbleSessionProvider>
            </ContactSubmissionProvider>
          </ThemeProvider>
        </ChunkErrorBoundary>
      </body>
    </html>
  );
}
