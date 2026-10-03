import type { Metadata } from "next";
import { TermsOfServiceContent } from "@/components/legal/TermsOfServiceContent";
import { SEED_TERMS_DOCUMENT } from "@/lib/dal/repositories/seed-data";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Official Terms of Service, operating standards, and unified governance across all verified subdomains: gauravpatil.site, self.gauravpatil.site, contact.gauravpatil.site, resume.gauravpatil.site, talk.gauravpatil.site, and admin.gauravpatil.site.",
  alternates: {
    canonical: "https://gauravpatil.site/terms",
  },
  openGraph: {
    title: "Terms of Service | Gaurav Portfolio & All Subdomains",
    description:
      "Official Terms of Service, operating standards, and unified governance across all verified subdomains: gauravpatil.site, self.gauravpatil.site, contact.gauravpatil.site, resume.gauravpatil.site, talk.gauravpatil.site, and admin.gauravpatil.site.",
    url: "https://gauravpatil.site/terms",
    siteName: "Gaurav Portfolio",
    type: "website",
    images: [
      {
        url: "https://gauravpatil.site/og-image.png",
        width: 1200,
        height: 630,
        alt: "Terms of Service | Gaurav Portfolio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Service | Gaurav Portfolio & All Subdomains",
    description:
      "Official Terms of Service, operating standards, and unified governance across all verified subdomains: gauravpatil.site, self.gauravpatil.site, contact.gauravpatil.site, resume.gauravpatil.site, talk.gauravpatil.site, and admin.gauravpatil.site.",
    creator: "@gauravpatil",
    images: ["https://gauravpatil.site/og-image.png"],
  },
};

export default function TermsPage() {
  return <TermsOfServiceContent initialData={SEED_TERMS_DOCUMENT} />;
}

