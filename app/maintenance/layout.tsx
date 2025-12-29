import { Metadata } from 'next';
import { ThemeProvider } from '@/app/provider';
import { ContactSubmissionProvider } from '@/contexts/ContactSubmissionContext';
import { BubbleSessionProvider } from '@/contexts/BubbleSessionContext';
import { BubbleMessageProvider } from '@/contexts/BubbleMessageContext';
import ToastProvider from '@/components/providers/ToastProvider';

export const metadata: Metadata = {
  title: 'Maintenance - Gaurav Portfolio',
  description: 'Site is currently under maintenance. Please check back soon.',
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
  },
};

// Force dynamic rendering - NO caching of maintenance page
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function MaintenanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <ContactSubmissionProvider>
        <BubbleSessionProvider>
          <BubbleMessageProvider>
            <ToastProvider />
            {children}
          </BubbleMessageProvider>
        </BubbleSessionProvider>
      </ContactSubmissionProvider>
    </ThemeProvider>
  );
}
