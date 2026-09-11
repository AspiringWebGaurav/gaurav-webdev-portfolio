import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { ThemeProvider } from "./provider";
import { RouteProgressBar } from "@/components/ui/RouteProgressBar";
import { seoRepository } from "@/lib/dal/repositories/cms/seo.repository";
import { SEED_SEO } from "@/lib/dal/repositories/seed-data";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#000319",
};

export async function generateMetadata(): Promise<Metadata> {
  const envGoogleVerification =
    process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim() ||
    process.env.GOOGLE_SITE_VERIFICATION?.trim();

  try {
    const seoResult = await seoRepository.getSeo();
    const seo = seoResult.data || SEED_SEO;

    const canonicalUrl = seo.canonicalUrl || "https://gauravpatil.site";
    const title = seo.title || "Gaurav Patil — Full Stack Software Engineer Building Production-Ready Digital Systems";
    const description =
      seo.description ||
      "Official portfolio of Gaurav Patil — Full Stack Software Engineer building production-ready digital systems, modern web applications, and high-performance software architectures.";

    const googleVerificationToken = seo.googleSiteVerification?.trim() || envGoogleVerification || undefined;

    return {
      metadataBase: new URL(canonicalUrl),
      title: {
        default: title,
        template: "%s | Gaurav Patil",
      },
      description,
      alternates: {
        canonical: canonicalUrl,
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
      verification: googleVerificationToken ? { google: googleVerificationToken } : undefined,
      keywords:
        seo.keywords && seo.keywords.length > 0
          ? seo.keywords
          : [
              "Gaurav Patil",
              "Gaurav Patil developer",
              "Gaurav Patil full stack software engineer",
              "Full Stack Software Engineer",
              "Software Engineering",
              "Production-Ready Software",
              "Web Applications",
              "AI-Assisted Development",
              "Technical Case Studies",
              "Next.js",
              "React",
              "TypeScript",
            ],
      authors: [{ name: seo.author || "Gaurav Patil", url: canonicalUrl }],
      creator: "Gaurav Patil",
      icons: {
        icon: [
          { url: "/favicon.ico", sizes: "any" },
          { url: "/icon.svg", type: "image/svg+xml" },
          { url: "/icon.png", sizes: "512x512", type: "image/png" },
          { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
        ],
        shortcut: "/favicon.ico",
        apple: [
          { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
          { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
        ],
      },
      manifest: "/manifest.webmanifest",
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        siteName: "Gaurav Patil Portfolio",
        locale: "en_US",
        images: [
          {
            url: seo.ogImageUrl || "https://gauravpatil.site/og-image.png",
            width: 1200,
            height: 630,
            alt: title,
            type: "image/png",
          },
        ],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        creator: seo.twitterHandle || "@gauravpatil",
        images: [seo.ogImageUrl || "https://gauravpatil.site/og-image.png"],
      },
    };
  } catch {
    const fallbackTitle = "Gaurav Patil — Full Stack Software Engineer Building Production-Ready Digital Systems";
    const fallbackDescription =
      "Official portfolio of Gaurav Patil — Full Stack Software Engineer building production-ready digital systems, modern web applications, and high-performance software architectures.";

    return {
      metadataBase: new URL("https://gauravpatil.site"),
      title: {
        default: fallbackTitle,
        template: "%s | Gaurav Patil",
      },
      description: fallbackDescription,
      alternates: {
        canonical: "https://gauravpatil.site",
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
      verification: envGoogleVerification ? { google: envGoogleVerification } : undefined,
      icons: {
        icon: [
          { url: "/favicon.ico", sizes: "any" },
          { url: "/icon.svg", type: "image/svg+xml" },
          { url: "/icon.png", sizes: "512x512", type: "image/png" },
          { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
        ],
        shortcut: "/favicon.ico",
        apple: [
          { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
          { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
        ],
      },
      manifest: "/manifest.webmanifest",
      openGraph: {
        title: fallbackTitle,
        description: fallbackDescription,
        url: "https://gauravpatil.site",
        siteName: "Gaurav Patil Portfolio",
        locale: "en_US",
        images: [
          {
            url: "https://gauravpatil.site/og-image.png",
            width: 1200,
            height: 630,
            alt: fallbackTitle,
            type: "image/png",
          },
        ],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: fallbackTitle,
        description: fallbackDescription,
        creator: "@gauravpatil",
        images: ["https://gauravpatil.site/og-image.png"],
      },
    };
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <RouteProgressBar />
          {children}
          <Analytics />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  );
}
