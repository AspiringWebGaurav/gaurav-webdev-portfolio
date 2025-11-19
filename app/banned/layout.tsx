import { Metadata } from 'next';

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
