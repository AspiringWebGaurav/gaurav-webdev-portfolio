import type { Metadata } from "next";
import CpLegalLayout from "@/components/cp/CpLegalLayout";

export const dynamic = "force-static";
export const revalidate = false;

export const metadata: Metadata = {
  title: "Acceptance of Use (AOU) | CP Engine",
  description:
    "End User Acceptance of Use (AOU) agreement for CP Engine Desktop Client v0.0.1 and Dynamic Edge Update Engine.",
  alternates: {
    canonical: "https://cp.apps.gauravpatil.site/aou",
  },
  openGraph: {
    title: "Acceptance of Use (AOU) | CP Engine",
    description:
      "End User Acceptance of Use & Operational Policy for CP Engine for Windows.",
    url: "https://cp.apps.gauravpatil.site/aou",
    siteName: "CP Engine",
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "CP Engine",
      item: "https://cp.apps.gauravpatil.site",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Acceptance of Use (AOU)",
      item: "https://cp.apps.gauravpatil.site/aou",
    },
  ],
};

export default function CpAouPage() {
  return (
    <CpLegalLayout title="Acceptance of Use (AOU)" lastUpdated="November 28, 2026">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <p className="text-zinc-900 dark:text-zinc-100 font-medium">
        Operational agreement for installing and running CP Engine.
      </p>

      <p>
        This Acceptance of Use (&ldquo;AOU&rdquo;) Policy supplements our{" "}
        <a
          href="/terms"
          className="text-zinc-950 dark:text-zinc-50 underline underline-offset-4 hover:text-emerald-600 dark:hover:text-emerald-400"
        >
          Terms of Use
        </a>{" "}
        and applies whenever you install, execute, or update CP Engine on Microsoft Windows.
      </p>

      {/* 1. Acceptance */}
      <section
        id="acceptance"
        tabIndex={-1}
        className="space-y-4 pt-4 scroll-mt-20 outline-none target:ring-2 target:ring-emerald-500/40 target:bg-emerald-500/5 target:rounded-lg p-3 -m-3 transition-all duration-500"
      >
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          1. Agreement on Installation
        </h2>
        <p>
          By downloading or running <code className="font-mono text-sm">cpsetup.exe</code> (
          <code className="font-mono text-sm">v0.0.1</code>) or accepting subsequent automatic
          binary updates, you confirm that you accept these usage conditions and our{" "}
          <a
            href="/privacy"
            className="text-zinc-950 dark:text-zinc-50 underline underline-offset-4 hover:text-emerald-600 dark:hover:text-emerald-400"
          >
            Privacy Policy
          </a>
          . If you disagree, do not install or run the application.
        </p>
      </section>

      {/* 2. System Integration & Background Execution */}
      <section
        id="system-integration"
        tabIndex={-1}
        className="space-y-4 pt-4 scroll-mt-20 outline-none target:ring-2 target:ring-emerald-500/40 target:bg-emerald-500/5 target:rounded-lg p-3 -m-3 transition-all duration-500"
      >
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          2. System Tray &amp; Background Acceleration
        </h2>
        <p>
          <strong>Optional autostart.</strong> During installation or in settings, you control
          whether CP Engine launches at Windows sign-in, creates Start Menu or Desktop shortcuts,
          and remains active in the system tray to intercept file copy/paste actions.
        </p>
        <p>
          <strong>Polite exit &amp; uninstall.</strong> You can exit CP Engine at any time from the
          system tray icon to immediately restore default Windows Explorer file copying, or remove
          the entire application silently via Windows Installed Apps.
        </p>
      </section>

      {/* 3. Storage & Hardware Responsibility */}
      <section
        id="hardware"
        tabIndex={-1}
        className="space-y-4 pt-4 scroll-mt-20 outline-none target:ring-2 target:ring-emerald-500/40 target:bg-emerald-500/5 target:rounded-lg p-3 -m-3 transition-all duration-500"
      >
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          3. Storage Media &amp; Data Safety
        </h2>
        <p>
          CP Engine is designed to saturate NVMe, SSD, HDD, and USB transfer channels efficiently.
          You remain responsible for ensuring external drives stay connected during transfers and
          for maintaining independent backups of irreplaceable files.
        </p>
      </section>

      {/* 4. Security Boundaries & Prohibited Conduct */}
      <section
        id="prohibited"
        tabIndex={-1}
        className="space-y-4 pt-4 scroll-mt-20 outline-none target:ring-2 target:ring-emerald-500/40 target:bg-emerald-500/5 target:rounded-lg p-3 -m-3 transition-all duration-500"
      >
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          4. Integrity Rules &amp; Prohibited Use
        </h2>
        <p>You agree not to use CP Engine or its CDN distribution channels to:</p>
        <ul className="list-disc pl-6 space-y-2 text-zinc-700 dark:text-zinc-300">
          <li>Abuse, scrape at scale, or flood GPHost release endpoints.</li>
          <li>
            Inject malicious code, tamper with update binaries, or bypass hardware/version
            quarantine checks.
          </li>
          <li>
            Repackage modified binaries under official CP Engine names without clear notice of
            modification as required by the MIT License.
          </li>
        </ul>
      </section>

      {/* 5. Support & Contact */}
      <section
        id="contact"
        tabIndex={-1}
        className="space-y-4 pt-4 scroll-mt-20 outline-none target:ring-2 target:ring-emerald-500/40 target:bg-emerald-500/5 target:rounded-lg p-3 -m-3 transition-all duration-500"
      >
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          5. Inquiries &amp; Updates
        </h2>
        <p>
          For questions regarding acceptable use or enterprise evaluation, reach out to{" "}
          <a
            href="mailto:hello@gauravpatil.site"
            className="text-zinc-950 dark:text-zinc-50 underline underline-offset-4 hover:text-emerald-600 dark:hover:text-emerald-400"
          >
            hello@gauravpatil.site
          </a>
          .
        </p>
      </section>
    </CpLegalLayout>
  );
}
