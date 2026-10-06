import type { Metadata, Viewport } from "next";
import { cookies, headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { VercelInsights } from "@/components/analytics/VercelInsights";
import "./globals.css";
import { ThemeProvider } from "./provider";
import { RouteProgressBar } from "@/components/ui/RouteProgressBar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { PortfolioPreloader } from "@/components/ui/PortfolioPreloader";
import { seoRepository } from "@/lib/dal/repositories/cms/seo.repository";
import { SEED_SEO } from "@/lib/dal/repositories/seed-data";
import { THEME_COOKIE_NAME } from "@/lib/theme/cookie";

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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAFA" },
    { media: "(prefers-color-scheme: dark)", color: "#000319" },
  ],
};

export async function generateMetadata(): Promise<Metadata> {
  const envGoogleVerification =
    process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim() ||
    process.env.GOOGLE_SITE_VERIFICATION?.trim();

  try {
    const seoResult = await seoRepository.getSeo();
    const seo = seoResult.data || SEED_SEO;

    const canonicalUrl = seo.canonicalUrl || "https://gauravpatil.site";
    const title = seo.title || "Gaurav Patil | Full Stack Software Engineer & Web Developer";
    const description =
      seo.description ||
      "Official portfolio of Gaurav Patil — Full Stack Software Engineer and Web Developer building production-ready digital systems, modern web applications, and high-performance software architectures.";

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
              "gaurav patil",
              "Gaurav Patil Dev",
              "Gaurav Patil Dev full stack",
              "Gaurav Patil developer",
              "Gaurav Patil web developer",
              "Gaurav Patil software engineer",
              "Gaurav Patil full stack software engineer",
              "Gaurav Patil portfolio",
              "gauravpatil",
              "gauravpatil.site",
              "AspiringWebGaurav",
              "Full Stack Software Engineer",
              "Software Engineering",
              "Production-Ready Software",
              "Web Applications",
              "AI-Assisted Development",
              "Technical Case Studies",
              "Next.js",
              "React",
              "TypeScript",
              "Tailwind CSS",
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
    const fallbackTitle = "Gaurav Patil | Full Stack Software Engineer & Web Developer";
    const fallbackDescription =
      "Official portfolio of Gaurav Patil — Full Stack Software Engineer and Web Developer building production-ready digital systems, modern web applications, and high-performance software architectures.";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const reqHeaders = await headers();
  const themeHeader = reqHeaders.get("x-theme");
  const cookieStore = await cookies();
  const rawTheme = (themeHeader === "light" || themeHeader === "dark")
    ? themeHeader
    : cookieStore.get(THEME_COOKIE_NAME)?.value;
  const initialTheme: "light" | "dark" = rawTheme === "light" ? "light" : "dark";

  return (
    <html
      lang="en"
      className={initialTheme}
      style={{ colorScheme: initialTheme }}
      suppressHydrationWarning
    >
      <head>
        {/* Synchronous pre-paint theme resolver: extracts URL theme, clears host shadowing, and aligns pre-paint DOM */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var p=new URLSearchParams(window.location.search);var u=p.get('theme');var h=window.location.hostname;var d=(h==='gauravpatil.site'||h.endsWith('.gauravpatil.site'))?'.gauravpatil.site':((h==='devlabs.eu.cc'||h.endsWith('.devlabs.eu.cc'))?'.devlabs.eu.cc':'');if(d){document.cookie='theme=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';}var t='${initialTheme}';if(u==='light'||u==='dark'){t=u;}else{var ck=document.cookie.split(';');for(var i=0;i<ck.length;i++){var c=ck[i].trim();if(c.indexOf('theme=')===0){var v=c.substring(6);if(v==='light'||v==='dark'){t=v;}}}}var el=document.documentElement;el.classList.remove('light','dark');el.classList.add(t);el.style.colorScheme=t;if(d){document.cookie='theme='+t+'; Path=/; Max-Age=31536000; Domain='+d+'; SameSite=Lax; Secure';}else{document.cookie='theme='+t+'; Path=/; Max-Age=31536000; SameSite=Lax';}if(u==='light'||u==='dark'){p.delete('theme');var rem=p.toString();var cl=window.location.pathname+(rem?'?'+rem:'')+window.location.hash;window.history.replaceState(null,'',cl);}}catch(e){}})();`,
          }}
        />
        <link rel="preconnect" href="https://challenges.cloudflare.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://challenges.cloudflare.com" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable}`}
        suppressHydrationWarning
      >
        <ThemeProvider defaultTheme={initialTheme}>
          <PortfolioPreloader />
          <RouteProgressBar />
          <ThemeToggle />
          {children}
          <VercelInsights />
        </ThemeProvider>
      </body>
    </html>
  );
}
