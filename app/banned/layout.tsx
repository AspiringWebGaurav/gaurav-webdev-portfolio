import { Metadata } from 'next';

// Force dynamic rendering - prevent static generation
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Access Restricted - Gaurav Portfolio',
  description: 'Your access has been restricted',
};

export default function BannedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
