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
  try {
    const seoResult = await seoRepository.getSeo();
    const seo = seoResult.data || SEED_SEO;

    const canonicalUrl = seo.canonicalUrl || "https://gauravpatil.site";
    const title = seo.title || "Gaurav Patil — Full Stack Developer & Software Engineer";
    const description =
      seo.description ||
      "Official portfolio of Gaurav Patil, a Full Stack Developer & Software Engineer based in India specializing in Next.js, React, TypeScript, and modern scalable web architecture.";

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
      keywords:
        seo.keywords && seo.keywords.length > 0
          ? seo.keywords
          : [
              "Gaurav Patil",
              "Gaurav Patil developer",
              "Gaurav Patil full stack developer",
              "Gaurav Patil software developer",
              "Gaurav Patil portfolio",
              "Gaurav Patil India",
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
          { url: "/icon.png", sizes: "32x32", type: "image/png" },
        ],
        shortcut: "/favicon.ico",
        apple: [
          { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
        ],
      },
      manifest: "/manifest.webmanifest",
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        siteName: "Gaurav Patil Portfolio",
        images: seo.ogImageUrl ? [{ url: seo.ogImageUrl, width: 1200, height: 630 }] : [],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        creator: seo.twitterHandle || "@gauravpatil",
        images: seo.ogImageUrl ? [seo.ogImageUrl] : [],
      },
    };
  } catch {
    return {
      metadataBase: new URL("https://gauravpatil.site"),
      title: {
        default: "Gaurav Patil — Full Stack Developer & Software Engineer",
        template: "%s | Gaurav Patil",
      },
      description:
        "Official portfolio of Gaurav Patil, a Full Stack Developer & Software Engineer based in India specializing in Next.js, React, TypeScript, and modern scalable web architecture.",
      alternates: {
        canonical: "https://gauravpatil.site",
      },
      icons: {
        icon: [
          { url: "/favicon.ico", sizes: "any" },
          { url: "/icon.svg", type: "image/svg+xml" },
          { url: "/icon.png", sizes: "32x32", type: "image/png" },
        ],
        shortcut: "/favicon.ico",
        apple: [
          { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
        ],
      },
      manifest: "/manifest.webmanifest",
      openGraph: {
        title: "Gaurav Patil — Full Stack Developer & Software Engineer",
        description:
          "Official portfolio of Gaurav Patil, a Full Stack Developer & Software Engineer based in India.",
        url: "https://gauravpatil.site",
        siteName: "Gaurav Patil Portfolio",
        type: "website",
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
