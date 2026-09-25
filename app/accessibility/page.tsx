import type { Metadata } from "next";
import { AccessibilityContent } from "@/components/legal/AccessibilityContent";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Accessibility Standards & Targets",
  description:
    "Accessibility practices adhering to modern design targets, reduced motion, fluid scaling, and keyboard navigation.",
  alternates: {
    canonical: "https://gauravjpatil.com/accessibility",
  },
  openGraph: {
    title: "Accessibility Standards & Targets | Gaurav Portfolio",
    description:
      "Accessibility practices adhering to modern design targets, reduced motion, fluid scaling, and keyboard navigation.",
    url: "https://gauravjpatil.com/accessibility",
    siteName: "Gaurav Portfolio",
    type: "website",
  },
};

export default function AccessibilityPage() {
  return <AccessibilityContent />;
}
