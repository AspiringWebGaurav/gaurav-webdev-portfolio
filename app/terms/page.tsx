export const metadata = {
  title: "Terms of Service",
  description: "Terms of Service for Gaurav Patil Portfolio - Legal terms and conditions for using our website",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black-100 py-20">
      <div className="max-w-4xl mx-auto px-5">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">
          Terms of Service
        </h1>
        
        <div className="prose prose-invert max-w-none">
          <p className="text-white-200 mb-6">
            <strong>Originally Drafted:</strong> January 9, 2026<br />
            <strong>Last Updated:</strong> April 6, 2026<br />
            <strong>Version:</strong> 2.0
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-white-200 mb-4">
              By accessing and using www.gauravpatil.online (the &quot;Website&quot;), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Website.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>
            <p className="text-white-200 mb-4">
              This Website serves as a professional portfolio showcasing the work, skills, and experience of Gaurav Patil. The Website includes:
            </p>
            <ul className="list-disc list-inside text-white-200 mb-4 space-y-2">
              <li>Portfolio showcase and project demonstrations</li>
              <li>Real-time chat system for visitor communication</li>
              <li>Contact forms for inquiries</li>
              <li>Bug reporting system</li>
              <li>Resume viewing and download functionality</li>
              <li>Work experience and testimonials</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">3. Acceptable Use</h2>
            <p className="text-white-200 mb-4">
              You agree to use the Website only for lawful purposes. You must not:
            </p>
            <ul className="list-disc list-inside text-white-200 mb-4 space-y-2">
              <li>Attempt to gain unauthorized access to any systems or data</li>
              <li>Submit spam, malicious code, or harmful content</li>
              <li>Use automated systems (bots, scrapers) without permission</li>
              <li>Harass, threaten, or abuse other users or the administrator</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Impersonate another person or entity</li>
              <li>Interfere with the proper functioning of the Website</li>
              <li>Attempt to bypass security measures or rate limits</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">4. User Content</h2>
            <h3 className="text-xl font-semibold text-white mb-3">4.1 Your Submissions</h3>
            <p className="text-white-200 mb-4">
              When you submit content through chat, contact forms, or bug reports:
            </p>
            <ul className="list-disc list-inside text-white-200 mb-4 space-y-2">
              <li>You retain ownership of your content</li>
              <li>You grant us a license to use, store, and display your content for service provision</li>
              <li>You warrant that your content does not violate any laws or third-party rights</li>
              <li>You are responsible for the content you submit</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3">4.2 Content Moderation</h3>
            <p className="text-white-200 mb-4">
              We reserve the right to:
            </p>
            <ul className="list-disc list-inside text-white-200 mb-4 space-y-2">
              <li>Review, edit, or remove any content at our discretion</li>
              <li>Ban users who violate these terms</li>
              <li>Report illegal content to authorities</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">5. Intellectual Property</h2>
            <p className="text-white-200 mb-4">
              All content on this Website, including but not limited to:
            </p>
            <ul className="list-disc list-inside text-white-200 mb-4 space-y-2">
              <li>Text, graphics, logos, images, videos</li>
              <li>Code, design, and architecture</li>
              <li>Project demonstrations and case studies</li>
              <li>Documentation and written content</li>
            </ul>
            <p className="text-white-200 mb-4">
              is the property of Gaurav Patil and is protected by copyright, trademark, and other intellectual property laws.
            </p>
            <p className="text-white-200">
              You may not copy, reproduce, distribute, or create derivative works without explicit written permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">6. Security and Account Bans</h2>
            <p className="text-white-200 mb-4">
              The Website employs enterprise-grade security measures including:
            </p>
            <ul className="list-disc list-inside text-white-200 mb-4 space-y-2">
              <li><strong>7-Layer Defense:</strong> Client validation, rate limiting, bot detection, spam filtering, Turnstile, server validation, Firebase rules</li>
              <li><strong>Rate Limiting:</strong> 20 messages/minute for chat, 3 submissions/hour for contact forms</li>
              <li><strong>Bot Detection:</strong> Cloudflare Turnstile + behavioral analysis (95% accuracy)</li>
              <li><strong>Real-Time Monitoring:</strong> Crash reports, anomaly detection, audit logging</li>
              <li><strong>3-Layer Caching:</strong> Memory → Redis → Firebase for performance and security</li>
            </ul>
            <p className="text-white-200 mb-4">
              <strong>Ban Policy:</strong>
            </p>
            <ul className="list-disc list-inside text-white-200 mb-4 space-y-2">
              <li><strong>Temporary Bans:</strong> Auto-expire via server-side scheduler (Firebase Functions)</li>
              <li><strong>Permanent Bans:</strong> For severe or repeated violations</li>
              <li><strong>Appeal Process:</strong> Available through admin review with documented reasoning</li>
              <li><strong>Audit Trail:</strong> All ban actions logged with timestamps for compliance</li>
              <li>We reserve the right to ban without prior notice for severe violations</li>
            </ul>
            <p className="text-white-200 mb-4">
              <strong>Ban Categories:</strong>
            </p>
            <ul className="list-disc list-inside text-white-200 mb-4 space-y-2">
              <li><strong>Spam:</strong> Automated or excessive submissions</li>
              <li><strong>Abuse:</strong> Harassment, threats, or harmful content</li>
              <li><strong>Bot Activity:</strong> Automated access without permission</li>
              <li><strong>Security Violation:</strong> Attempts to bypass security measures</li>
              <li><strong>Terms Violation:</strong> Any breach of these terms</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">7. Disclaimer of Warranties</h2>
            <p className="text-white-200 mb-4">
              THE WEBSITE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
            </p>
            <ul className="list-disc list-inside text-white-200 mb-4 space-y-2">
              <li>Merchantability, fitness for a particular purpose</li>
              <li>Non-infringement</li>
              <li>Uninterrupted or error-free operation</li>
              <li>Accuracy, reliability, or completeness of content</li>
            </ul>
            <p className="text-white-200">
              We do not warrant that the Website will meet your requirements or that defects will be corrected.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">8. Limitation of Liability</h2>
            <p className="text-white-200 mb-4">
              TO THE FULLEST EXTENT PERMITTED BY LAW, GAURAV PATIL SHALL NOT BE LIABLE FOR:
            </p>
            <ul className="list-disc list-inside text-white-200 mb-4 space-y-2">
              <li>Any indirect, incidental, special, consequential, or punitive damages</li>
              <li>Loss of profits, data, use, goodwill, or other intangible losses</li>
              <li>Damages resulting from unauthorized access or data breaches</li>
              <li>Errors, mistakes, or inaccuracies of content</li>
              <li>System downtime or service interruptions</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">9. Indemnification</h2>
            <p className="text-white-200">
              You agree to indemnify and hold harmless Gaurav Patil from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from:
            </p>
            <ul className="list-disc list-inside text-white-200 mb-4 space-y-2">
              <li>Your use of the Website</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any rights of another party</li>
              <li>Content you submit to the Website</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">10. Third-Party Links</h2>
            <p className="text-white-200">
              The Website may contain links to third-party websites or services. We are not responsible for:
            </p>
            <ul className="list-disc list-inside text-white-200 mb-4 space-y-2">
              <li>The content, privacy practices, or terms of third-party sites</li>
              <li>Any damages resulting from your use of third-party services</li>
            </ul>
            <p className="text-white-200">
              Your use of third-party websites is at your own risk and subject to their terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">11. Modifications to Service</h2>
            <p className="text-white-200">
              We reserve the right to:
            </p>
            <ul className="list-disc list-inside text-white-200 mb-4 space-y-2">
              <li>Modify, suspend, or discontinue the Website (or any part) at any time</li>
              <li>Change features, functionality, or content without notice</li>
              <li>Limit access to certain features or the entire Website</li>
            </ul>
            <p className="text-white-200">
              We shall not be liable for any modification, suspension, or discontinuance.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">12. Changes to Terms</h2>
            <p className="text-white-200">
              We may update these Terms at any time. Changes will be effective immediately upon posting. Your continued use of the Website after changes constitutes acceptance of the updated Terms. We encourage you to review these Terms periodically.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">13. Governing Law</h2>
            <p className="text-white-200">
              These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles. Any disputes shall be resolved in the appropriate courts.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">14. Severability</h2>
            <p className="text-white-200">
              If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">15. Contact Information</h2>
            <p className="text-white-200 mb-4">
              For questions about these Terms:
            </p>
            <ul className="list-none text-white-200 space-y-2">
              <li><strong>Website:</strong> <a href="https://www.gauravpatil.online" className="text-purple underline">www.gauravpatil.online</a></li>
              <li><strong>Contact Form:</strong> <a href="https://www.gauravpatil.online/contact" className="text-purple underline">www.gauravpatil.online/contact</a></li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">16. Dispute Resolution</h2>
            <p className="text-white-200 mb-4">
              In the event of a dispute:
            </p>
            <ul className="list-disc list-inside text-white-200 mb-4 space-y-2">
              <li><strong>Informal Resolution:</strong> Contact us first to resolve issues amicably</li>
              <li><strong>Ban Appeals:</strong> Use the appeal process for any ban-related disputes</li>
              <li><strong>Response Time:</strong> We aim to respond within 72 hours</li>
              <li><strong>Good Faith:</strong> Both parties agree to resolve disputes in good faith</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">17. Entire Agreement</h2>
            <p className="text-white-200">
              These Terms, together with the Privacy Policy and Cookie Policy, constitute the entire agreement between you and Gaurav Patil regarding the use of this Website, superseding any prior agreements.
            </p>
          </section>

          <div className="mt-12 pt-8 border-t border-white-200/20">
            <p className="text-white-200 text-sm">
              These Terms of Service were originally drafted on January 9, 2026 and last updated on April 6, 2026 (Version 2.0). By using this Website, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
