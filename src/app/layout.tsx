import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DGONIX CRM - Professional Invoice Management',
  description: 'Complete CRM and invoice management system with client portal',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
