import type { Metadata } from "next";
import { PrivacyPolicyContent } from "@/components/legal/PrivacyPolicyContent";
import { legalDocumentsRepository } from "@/lib/dal/repositories/legal-documents.repository";

export const revalidate = 60;

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
    siteName: "Gaurav Patil Portfolio",
    type: "website",
  },
};

export default async function PrivacyPage() {
  const res = await legalDocumentsRepository.getPublicDocument("PRIVACY");
  return <PrivacyPolicyContent initialData={res.data ?? undefined} />;
}

