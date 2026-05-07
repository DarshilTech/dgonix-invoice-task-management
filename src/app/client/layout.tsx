'use client';

import { usePathname } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';

export default function ClientRootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/client/login') return <>{children}</>;
  return <AppShell mode="client">{children}</AppShell>;
}
