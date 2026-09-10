import type { Metadata } from "next";
import { TermsOfServiceContent } from "@/components/legal/TermsOfServiceContent";
import { legalDocumentsRepository } from "@/lib/dal/repositories/legal-documents.repository";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Official Terms of Service, acceptable use, and engagement terms for Gaurav Portfolio.",
  alternates: {
    canonical: "https://gauravpatil.site/terms",
  },
  openGraph: {
    title: "Terms of Service | Gaurav Portfolio",
    description:
      "Official Terms of Service, acceptable use, and engagement terms for Gaurav Portfolio.",
    url: "https://gauravpatil.site/terms",
    siteName: "Gaurav Patil Portfolio",
    type: "website",
  },
};

interface TermsPageProps {
  searchParams?: Promise<{ focus?: string }>;
}

export default async function TermsPage({ searchParams }: TermsPageProps) {
  const [res, resolvedParams] = await Promise.all([
    legalDocumentsRepository.getPublicDocument("TERMS"),
    searchParams ? searchParams : Promise.resolve(undefined),
  ]);
  return (
    <TermsOfServiceContent
      initialData={res.data ?? undefined}
      initialFocus={resolvedParams?.focus}
    />
  );
}

