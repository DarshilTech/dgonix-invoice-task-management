'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Container } from '@/components/ui/Container';
import { AppLogo } from '@/components/layout/AppLogo';

type NavItem = { label: string; href: string; icon: React.ReactNode };

const DashboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);
const CompaniesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const ClientsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const InvoicesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);
const PaymentsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);
const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const ProfileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);
const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);
const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const adminNav: NavItem[] = [
  { label: 'Dashboard',  href: '/admin/dashboard', icon: <DashboardIcon /> },
  { label: 'Companies',  href: '/admin/companies', icon: <CompaniesIcon /> },
  { label: 'Clients',    href: '/admin/clients',   icon: <ClientsIcon /> },
  { label: 'Invoices',   href: '/admin/invoices',  icon: <InvoicesIcon /> },
  { label: 'Payments',   href: '/admin/payments',  icon: <PaymentsIcon /> },
  { label: 'Settings',   href: '/admin/settings',  icon: <SettingsIcon /> },
];

const clientNav: NavItem[] = [
  { label: 'Dashboard',  href: '/client/dashboard', icon: <DashboardIcon /> },
  { label: 'Invoices',   href: '/client/invoices',  icon: <InvoicesIcon /> },
];

type AppShellProps = { children: React.ReactNode; mode: 'admin' | 'client' };

export function AppShell({ children, mode }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navItems = mode === 'admin' ? adminNav : clientNav;
  const isAdmin = mode === 'admin';

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    router.push(isAdmin ? '/login' : '/client/login');
  };

  return (
    <div className="min-h-screen bg-[#f0f4f3]">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-sidebar transition-transform duration-300 ease-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex h-max shrink-0 items-center justify-between border-b border-sidebar-border px-5 py-2.5">
          <Link
            href={isAdmin ? '/admin/dashboard' : '/client/dashboard'}
            className="group flex min-w-0 w-full items-center"
            onClick={() => setSidebarOpen(false)}
            aria-label={isAdmin ? 'Go to admin dashboard' : 'Go to client dashboard'}
          >
            <AppLogo className="w-auto max-w-[190px] object-contain mx-auto" priority />
          </Link>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-muted hover:bg-sidebar-hover hover:text-white lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                  active
                    ? 'bg-sidebar-active text-sidebar-accent'
                    : 'text-sidebar-muted hover:bg-sidebar-hover hover:text-white'
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                    active
                      ? 'bg-primary-500/20 text-sidebar-accent'
                      : 'text-sidebar-muted group-hover:text-white'
                  }`}
                >
                  {item.icon}
                </span>
                {item.label}
                {active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-accent" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="shrink-0 border-t border-sidebar-border p-3 space-y-0.5">
          <button
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
            onClick={handleLogout}
            type="button"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
              <LogoutIcon />
            </span>
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <div className="lg:pl-72">

        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur-md">
          <Container className="flex h-16 items-center justify-between gap-4">
            <button
              aria-label="Open navigation"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 lg:hidden"
              onClick={() => setSidebarOpen(true)}
              type="button"
            >
              <MenuIcon />
            </button>

            {/* Breadcrumb */}
            <div className="hidden lg:block">
              <p className="text-sm font-semibold text-gray-900">
                {isAdmin ? 'Admin Workspace' : 'Client Portal'}
              </p>
              <p className="text-xs text-gray-400">DGONIX Technologies</p>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 ring-1 ring-inset ring-primary-200">
                <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                Live
              </span>
            </div>
          </Container>
        </header>

        {/* Content */}
        <main className="py-7">
          <Container>{children}</Container>
        </main>
      </div>
    </div>
  );
}
