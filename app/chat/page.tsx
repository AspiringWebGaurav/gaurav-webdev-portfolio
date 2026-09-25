import type { Metadata } from "next";
import { ChatLearnMoreContent } from "@/components/legal/ChatLearnMoreContent";

export const metadata: Metadata = {
  title: "Personal Assistant & Chat Guide",
  description:
    "Explore the architectural purpose, preview mechanics, and privacy standards for the Gaurav Portfolio Personal Assistant.",
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://gauravjpatil.com/chat",
  },
  openGraph: {
    title: "Personal Assistant & Chat Guide | Gaurav Portfolio",
    description:
      "Architectural purpose, option mechanics, and privacy standards for the portfolio assistant.",
    url: "https://gauravjpatil.com/chat",
    siteName: "Gaurav Portfolio",
    type: "website",
  },
};

export default function ChatGuidePage() {
  return <ChatLearnMoreContent />;
}
