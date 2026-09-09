import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ChatLearnMoreContent } from "@/components/legal/ChatLearnMoreContent";

export const metadata: Metadata = {
  title: "Personal Assistant & Chat Guide",
  description:
    "Explore the architectural purpose, preview mechanics, and privacy standards for the Gaurav Portfolio Personal Assistant.",
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: "https://gauravpatil.site/chat",
  },
  openGraph: {
    title: "Personal Assistant & Chat Guide | Gaurav Portfolio",
    description:
      "Architectural purpose, option mechanics, and privacy standards for the portfolio assistant.",
    url: "https://gauravpatil.site/chat",
    siteName: "Gaurav Portfolio",
    type: "website",
  },
};

export default async function ChatGuidePage(props: {
  searchParams?: Promise<{ guide?: string }>;
}) {
  const searchParams = props.searchParams ? await props.searchParams : undefined;
  if (searchParams?.guide !== "true") {
    redirect("/?chat=open");
  }
  return <ChatLearnMoreContent />;
}
