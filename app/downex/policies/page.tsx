import type { Metadata } from "next";
import DownexPrivacyPage, { metadata as privacyMetadata } from "../privacy/page";

export const dynamic = "force-static";
export const revalidate = false;

export const metadata: Metadata = {
  ...privacyMetadata,
  title: "Privacy & Policies | Downex Download Manager",
  openGraph: {
    ...privacyMetadata.openGraph,
    title: "Privacy & Policies | Downex Download Manager",
    url: "https://downex.apps.gauravpatil.site/policies",
  },
};

export default DownexPrivacyPage;
