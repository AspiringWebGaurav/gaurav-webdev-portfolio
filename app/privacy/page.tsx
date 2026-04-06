export const metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for Gaurav Patil Portfolio - Learn how we collect, use, and protect your data",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black-100 py-20">
      <div className="max-w-4xl mx-auto px-5">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">
          Privacy Policy
        </h1>
        
        <div className="prose prose-invert max-w-none">
          <p className="text-white-200 mb-6">
            <strong>Originally Drafted:</strong> January 9, 2026<br />
            <strong>Last Updated:</strong> April 6, 2026<br />
            <strong>Version:</strong> 2.0
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
            <p className="text-white-200 mb-4">
              Welcome to Gaurav Patil&apos;s Portfolio (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website{" "}
              <a href="https://www.gauravpatil.online" className="text-purple underline">
                www.gauravpatil.online
              </a>
              .
            </p>
            <p className="text-white-200">
              By using our website, you consent to the data practices described in this policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-white mb-3">2.1 Information You Provide</h3>
            <p className="text-white-200 mb-4">
              We collect information that you voluntarily provide when using our services:
            </p>
            <ul className="list-disc list-inside text-white-200 mb-4 space-y-2">
              <li><strong>Contact Forms:</strong> Name, email address, subject, message content</li>
              <li><strong>Chat System:</strong> Messages, session information (handled via EmailJS)</li>
              <li><strong>Bug Reports:</strong> Error descriptions, browser information, screenshots</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3">2.2 Automatically Collected Information</h3>
            <p className="text-white-200 mb-4">
              We automatically collect certain information when you visit our website:
            </p>
            <ul className="list-disc list-inside text-white-200 mb-4 space-y-2">
              <li><strong>Visitor Analytics:</strong> Browser type, device information, IP address, timezone, pages visited</li>
              <li><strong>Firebase Services:</strong> Authentication data, session tokens, database interactions</li>
              <li><strong>Performance Data:</strong> Page load times, API response times, error logs</li>
              <li><strong>Security Data:</strong> Rate limiting metrics, spam detection data, ban information</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
            <p className="text-white-200 mb-4">We use collected information for:</p>
            <ul className="list-disc list-inside text-white-200 mb-4 space-y-2">
              <li>Responding to your inquiries and communications</li>
              <li>Improving website functionality and user experience</li>
              <li>Monitoring and analyzing usage patterns and trends</li>
              <li>Detecting and preventing spam, abuse, and security threats</li>
              <li>Maintaining system performance and reliability</li>
              <li>Debugging errors and crashes</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">4. Third-Party Services</h2>
            <p className="text-white-200 mb-4">
              We use the following third-party services that may collect information:
            </p>
            <ul className="list-disc list-inside text-white-200 mb-4 space-y-2">
              <li>
                <strong>Firebase (Google):</strong> Firestore Database, Authentication, Storage, Cloud Functions
                <br />
                <span className="text-sm">Privacy Policy: <a href="https://firebase.google.com/support/privacy" className="text-purple underline" target="_blank" rel="noopener noreferrer">https://firebase.google.com/support/privacy</a></span>
              </li>
              <li>
                <strong>Vercel:</strong> Hosting and deployment services
                <br />
                <span className="text-sm">Privacy Policy: <a href="https://vercel.com/legal/privacy-policy" className="text-purple underline" target="_blank" rel="noopener noreferrer">https://vercel.com/legal/privacy-policy</a></span>
              </li>
              <li>
                <strong>EmailJS:</strong> Email delivery for contact forms
                <br />
                <span className="text-sm">Privacy Policy: <a href="https://www.emailjs.com/legal/privacy-policy/" className="text-purple underline" target="_blank" rel="noopener noreferrer">https://www.emailjs.com/legal/privacy-policy/</a></span>
              </li>
              <li>
                <strong>Cloudflare Turnstile:</strong> Bot detection and spam prevention
                <br />
                <span className="text-sm">Privacy Policy: <a href="https://www.cloudflare.com/privacypolicy/" className="text-purple underline" target="_blank" rel="noopener noreferrer">https://www.cloudflare.com/privacypolicy/</a></span>
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">5. Data Storage and Security</h2>
            <p className="text-white-200 mb-4">
              We implement enterprise-grade security measures to protect your information:
            </p>
            <ul className="list-disc list-inside text-white-200 mb-4 space-y-2">
              <li><strong>Encryption:</strong> All data encrypted in transit (HTTPS/TLS 1.3) and at rest</li>
              <li><strong>Access Control:</strong> Firestore Security Rules with role-based permissions</li>
              <li><strong>3-Layer Caching:</strong> Memory → Redis → Firebase architecture minimizes data exposure</li>
              <li><strong>Rate Limiting:</strong> Multi-tier protection against abuse (20 msg/min chat, 3/hour forms)</li>
              <li><strong>Bot Detection:</strong> Cloudflare Turnstile + behavioral analysis with 95% accuracy</li>
              <li><strong>Request Deduplication:</strong> Prevents duplicate data transmissions</li>
              <li><strong>Audit Logging:</strong> All admin actions logged with timestamps and IP addresses</li>
              <li><strong>Automated Backups:</strong> Daily database backups with 30-day retention</li>
              <li><strong>Security Monitoring:</strong> Real-time crash reporting and anomaly detection</li>
            </ul>
            <p className="text-white-200">
              While we employ industry best practices, no method of transmission over the Internet is 100% secure. We continuously improve our security posture.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">6. Your Data Rights</h2>
            <p className="text-white-200 mb-4">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-white-200 mb-4 space-y-2">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Request correction of inaccurate data</li>
              <li><strong>Deletion:</strong> Request deletion of your personal data</li>
              <li><strong>Object:</strong> Object to processing of your data</li>
              <li><strong>Portability:</strong> Request transfer of your data</li>
            </ul>
            <p className="text-white-200">
              To exercise these rights, contact us at:{" "}
              <a href="https://www.gauravpatil.online/contact" className="text-purple underline">
                Contact Form
              </a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">7. Cookies and Tracking</h2>
            <p className="text-white-200 mb-4">
              We use essential cookies and browser storage for:
            </p>
            <ul className="list-disc list-inside text-white-200 mb-4 space-y-2">
              <li>Session management and authentication</li>
              <li>Remembering user preferences</li>
              <li>Analytics and performance monitoring</li>
              <li>Security and fraud prevention</li>
            </ul>
            <p className="text-white-200">
              See our <a href="/cookies" className="text-purple underline">Cookie Policy</a> for details.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">8. Data Retention</h2>
            <p className="text-white-200 mb-4">
              We retain your information for as long as necessary to:
            </p>
            <ul className="list-disc list-inside text-white-200 mb-4 space-y-2">
              <li>Provide our services</li>
              <li>Comply with legal obligations</li>
              <li>Resolve disputes</li>
              <li>Enforce agreements</li>
            </ul>
            <p className="text-white-200">
              Chat sessions are preserved for 30 days. Deleted items in the recycle bin are permanently removed after 30 days.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">9. Children&apos;s Privacy</h2>
            <p className="text-white-200">
              Our website is not intended for children under 13 years of age. We do not knowingly collect information from children. If you believe we have collected data from a child, please contact us immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">10. International Data Transfers</h2>
            <p className="text-white-200">
              Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers in compliance with applicable data protection laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">11. Changes to Privacy Policy</h2>
            <p className="text-white-200">
              We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated &quot;Last Updated&quot; date. Continued use of our website after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">12. Contact Information</h2>
            <p className="text-white-200 mb-4">
              For questions about this Privacy Policy or our data practices:
            </p>
            <ul className="list-none text-white-200 space-y-2">
              <li><strong>Website:</strong> <a href="https://www.gauravpatil.online" className="text-purple underline">www.gauravpatil.online</a></li>
              <li><strong>Contact Form:</strong> <a href="https://www.gauravpatil.online/contact" className="text-purple underline">www.gauravpatil.online/contact</a></li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">13. GDPR Compliance (EU Users)</h2>
            <p className="text-white-200 mb-4">
              If you are in the European Economic Area (EEA), you have additional rights under GDPR:
            </p>
            <ul className="list-disc list-inside text-white-200 mb-4 space-y-2">
              <li>Right to be informed about data processing</li>
              <li>Right to restrict processing</li>
              <li>Right to data portability</li>
              <li>Right to object to automated decision-making</li>
              <li>Right to lodge a complaint with a supervisory authority</li>
            </ul>
            <p className="text-white-200">
              Our lawful basis for processing: Consent, Legitimate Interest, and Contract Performance.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">14. Data Minimization</h2>
            <p className="text-white-200 mb-4">
              We follow the principle of data minimization:
            </p>
            <ul className="list-disc list-inside text-white-200 mb-4 space-y-2">
              <li>We only collect data necessary for service provision</li>
              <li>Anonymous visitor tracking does not require personal identification</li>
              <li>Chat sessions auto-expire after 30 days of inactivity</li>
              <li>Deleted content is permanently removed after 30 days in recycle bin</li>
              <li>We do not sell, rent, or trade your personal information</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">15. Automated Decision Making</h2>
            <p className="text-white-200 mb-4">
              Our systems may use automated processing for:
            </p>
            <ul className="list-disc list-inside text-white-200 mb-4 space-y-2">
              <li><strong>Spam Detection:</strong> Automatic filtering of malicious content</li>
              <li><strong>Bot Prevention:</strong> Behavioral analysis to identify automated access</li>
              <li><strong>Ban Enforcement:</strong> Automatic temporary bans for policy violations</li>
            </ul>
            <p className="text-white-200">
              You have the right to request human review of any automated decision that affects you. Contact us to appeal any automated action.
            </p>
          </section>

          <div className="mt-12 pt-8 border-t border-white-200/20">
            <p className="text-white-200 text-sm">
              This privacy policy was originally drafted on January 9, 2026 and last updated on April 6, 2026 (Version 2.0). It is designed to comply with GDPR, CCPA, LGPD, and other applicable data protection regulations worldwide.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
