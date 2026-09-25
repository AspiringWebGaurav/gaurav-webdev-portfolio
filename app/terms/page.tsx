import type { Metadata } from "next";
import { TermsOfServiceContent } from "@/components/legal/TermsOfServiceContent";
import { SEED_TERMS_DOCUMENT } from "@/lib/dal/repositories/seed-data";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Official Terms of Service, acceptable use, and engagement terms for Gaurav Portfolio.",
  alternates: {
    canonical: "https://gauravjpatil.com/terms",
  },
  openGraph: {
    title: "Terms of Service | Gaurav Portfolio",
    description:
      "Official Terms of Service, acceptable use, and engagement terms for Gaurav Portfolio.",
    url: "https://gauravjpatil.com/terms",
    siteName: "Gaurav Portfolio",
    type: "website",
    images: [
      {
        url: "https://gauravjpatil.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Terms of Service | Gaurav Portfolio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Service | Gaurav Portfolio",
    description:
      "Official Terms of Service, acceptable use, and engagement terms for Gaurav Portfolio.",
    creator: "@gauravpatil",
    images: ["https://gauravjpatil.com/og-image.png"],
  },
};

export default function TermsPage() {
  return <TermsOfServiceContent initialData={SEED_TERMS_DOCUMENT} />;
}

