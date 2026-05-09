'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Container } from '@/components/ui/Container';
import { AppLogo } from '@/components/layout/AppLogo';

// ── Icons ───────────────────────────────────────────────────────────────────

const DashboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);
const ClientsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const InvoicesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);
const PaymentsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);
const ReportsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);
const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);
const ChevronUpDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 fill-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
  </svg>
);
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

// ── Nav config ─────────────────────────────────────────────────────────────

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  quickAdd?: string;
};

const adminNav: NavItem[] = [
  { label: 'Dashboard',  href: '/admin/dashboard',  icon: <DashboardIcon /> },
  { label: 'Clients',    href: '/admin/clients',     icon: <ClientsIcon />,   quickAdd: '/admin/clients/create' },
  { label: 'Invoices',   href: '/admin/invoices',    icon: <InvoicesIcon />,  quickAdd: '/admin/invoices/create' },
  { label: 'Payments',   href: '/admin/payments',    icon: <PaymentsIcon /> },
  { label: 'Reports',    href: '/admin/reports',     icon: <ReportsIcon /> },
  { label: 'Settings',   href: '/admin/settings',    icon: <SettingsIcon /> },
];

const clientNav: NavItem[] = [
  { label: 'Dashboard',  href: '/client/dashboard', icon: <DashboardIcon /> },
  { label: 'Invoices',   href: '/client/invoices',  icon: <InvoicesIcon /> },
];

// ── AppShell ───────────────────────────────────────────────────────────────

type AppShellProps = { children: React.ReactNode; mode: 'admin' | 'client' };

export function AppShell({ children, mode }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = mode === 'admin';
  const navItems = isAdmin ? adminNav : clientNav;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved === 'true') setCollapsed(true);
  }, []);

  const fetchCompanyData = () => {
    if (!isAdmin) return;
    Promise.all([
      fetch('/api/users/company', { credentials: 'include' }).then((r) => r.json()),
      fetch('/api/users/profile', { credentials: 'include' }).then((r) => r.json()),
    ]).then(([company, profile]) => {
      if (company.success && company.data) {
        setCompanyName(company.data.name ?? '');
        setCompanyLogo(company.data.logo ?? null);
      }
      if (profile.success) {
        setUserEmail(profile.data.email);
      }
    }).catch(() => {});
  };

  useEffect(() => {
    fetchCompanyData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  useEffect(() => {
    window.addEventListener('company-updated', fetchCompanyData);
    return () => window.removeEventListener('company-updated', fetchCompanyData);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sidebar-collapsed', String(next));
  };

  const handleLogout = async () => {
    setDropdownOpen(false);
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    router.push(isAdmin ? '/login' : '/client/login');
  };

  const sidebarWidth = collapsed ? 'w-[68px]' : 'w-64';

  return (
    <div className="min-h-screen bg-[#f0f4f3]">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-sidebar transition-all duration-200 ease-out lg:translate-x-0 ${sidebarWidth} ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Company header / dropdown trigger */}
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex w-full items-center gap-2.5 border-b border-sidebar-border px-3 py-3 text-left hover:bg-sidebar-hover transition-colors justify-center"
          >
            {/* Logo mark */}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-active overflow-hidden">
              {companyLogo
                ? <Image src={companyLogo} alt="Company logo" width={28} height={28} className="h-7 w-7 object-contain" />
                : <AppLogo className="h-7 w-7 object-contain" priority />
              }
            </div>

            {!collapsed && (
              <>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">
                  {companyName || 'Invoxa'}
                </span>
                <ChevronUpDownIcon />
              </>
            )}
          </button>

          {/* Dropdown */}
          {dropdownOpen && (
            <div className="absolute left-0 top-full z-50 w-64 rounded-b-xl border border-sidebar-border bg-sidebar shadow-xl">
              <div className="px-4 pt-3 pb-2">
                <p className="text-xs text-sidebar-muted">Signed in as</p>
                <p className="mt-0.5 truncate text-sm font-semibold text-white">{userEmail || '—'}</p>
              </div>

              <div className="border-t border-sidebar-border px-4 py-2">
                <p className="mb-1.5 text-xs text-sidebar-muted">Company</p>
                <div className="flex items-center gap-2 rounded-lg bg-sidebar-active px-3 py-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary-500/30 overflow-hidden">
                    {companyLogo
                      ? <Image src={companyLogo} alt="Company logo" width={20} height={20} className="h-5 w-5 object-contain" />
                      : <AppLogo className="h-5 w-5 object-contain" />
                    }
                  </div>
                  <span className="flex-1 truncate text-sm font-medium text-white">
                    {companyName || 'Invoxa'}
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-sidebar-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              <div className="border-t border-sidebar-border p-2">
                <Link
                  href="/admin/settings"
                  onClick={() => { setDropdownOpen(false); setSidebarOpen(false); }}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-muted hover:bg-sidebar-hover hover:text-white transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Account Management
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1.5">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== '/admin/dashboard' && item.href !== '/client/dashboard' && pathname.startsWith(`${item.href}/`));
            return (
              <div
                key={item.href}
                className={`group/row flex items-center rounded-lg transition-colors duration-150 ${
                  active ? 'bg-sidebar-active' : 'hover:bg-sidebar-hover'
                }`}
              >
                <Link
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  title={collapsed ? item.label : undefined}
                  className={`flex flex-1 items-center gap-3 px-2.5 py-2 text-sm font-medium transition-colors duration-150 ${
                    active ? 'text-sidebar-accent' : 'text-sidebar-muted group-hover/row:text-white'
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center transition-colors duration-150 ${
                      active ? 'text-sidebar-accent' : 'text-sidebar-muted group-hover/row:text-white'
                    }`}
                  >
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <span className="flex-1 truncate">{item.label}</span>
                  )}
                  {!collapsed && active && (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sidebar-accent" />
                  )}
                </Link>

                {/* Quick-add "+" button */}
                {!collapsed && item.quickAdd && (
                  <Link
                    href={item.quickAdd}
                    onClick={() => setSidebarOpen(false)}
                    title={`New ${item.label.slice(0, -1)}`}
                    className={`mr-1.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors duration-150 ${
                      active
                        ? 'text-sidebar-accent hover:bg-white/10'
                        : 'text-sidebar-muted group-hover/row:text-white hover:bg-white/10'
                    }`}
                  >
                    <PlusIcon />
                  </Link>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom icon bar */}
        <div className="shrink-0 border-t border-sidebar-border">

          {/* Collapse toggle (desktop only) */}
          <div className="hidden border-t border-sidebar-border px-2 py-1.5 lg:block">
            <button
              type="button"
              onClick={toggleCollapse}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-2 py-1.5 text-xs text-sidebar-muted hover:bg-sidebar-hover hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {collapsed
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                }
              </svg>
              {!collapsed && <span>Collapse</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <div className={`transition-all duration-200 ${collapsed ? 'lg:pl-[68px]' : 'lg:pl-64'}`}>

        {/* Mobile header */}
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur-md lg:hidden">
          <div className="flex h-14 items-center gap-3 px-4">
            <button
              aria-label="Open navigation"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
              onClick={() => setSidebarOpen(true)}
              type="button"
            >
              <MenuIcon />
            </button>
            <span className="text-sm font-semibold text-gray-900">
              {companyName || 'Invoxa'}
            </span>
          </div>
        </header>

        {/* Content */}
        <main className="min-h-screen">
          <Container>{children}</Container>
        </main>
      </div>
    </div>
  );
}
