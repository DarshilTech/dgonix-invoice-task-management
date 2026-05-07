import { AppShell } from '@/components/layout/AppShell';

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <AppShell mode="admin">{children}</AppShell>;
}
