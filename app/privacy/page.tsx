import type { Metadata } from "next";
import { PrivacyPolicyContent } from "@/components/legal/PrivacyPolicyContent";
import { SEED_PRIVACY_DOCUMENT } from "@/lib/dal/repositories/seed-data";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Official Privacy Policy, data governance, and anonymity rights for Gaurav Portfolio.",
  alternates: {
    canonical: "https://gauravpatil.site/privacy",
  },
  openGraph: {
    title: "Privacy Policy | Gaurav Portfolio",
    description:
      "Official Privacy Policy, data governance, and anonymity rights for Gaurav Portfolio.",
    url: "https://gauravpatil.site/privacy",
    siteName: "Gaurav Portfolio",
    type: "website",
    images: [
      {
        url: "https://gauravpatil.site/og-image.png",
        width: 1200,
        height: 630,
        alt: "Privacy Policy | Gaurav Portfolio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | Gaurav Portfolio",
    description:
      "Official Privacy Policy, data governance, and anonymity rights for Gaurav Portfolio.",
    creator: "@gauravpatil",
    images: ["https://gauravpatil.site/og-image.png"],
  },
};

export default function PrivacyPage() {
  return <PrivacyPolicyContent initialData={SEED_PRIVACY_DOCUMENT} />;
}

