'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

// ── Types ──────────────────────────────────────────────────────────────────────

type Summary = {
  totalInvoices: number;
  paidInvoices: number;
  openInvoices: number;
  overdueInvoices: number;
  totalClients: number;
  totalRevenue: number;
};
type MonthRevenue = { month: string; revenue: number; invoices: number };
type MonthClients = { month: string; clients: number };
type StatusSlice = { name: string; label: string; value: number; color: string };
type RecentInvoice = {
  _id: string;
  invoiceNumber: string;
  clientName: string;
  total: number;
  balance: number;
  status: string;
  dueDate: string;
};

// ── Helpers ────────────────────────────────────────────────────────────────────

const usd = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

const STATUS_BADGE: Record<string, string> = {
  paid:           'badge-paid',
  sent:           'badge-sent',
  partially_paid: 'badge-partial',
  overdue:        'badge-overdue',
  draft:          'badge-draft',
  cancelled:      'badge-inactive',
};

// ── Skeleton ───────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="stat-card animate-skeleton">
      <div className="stat-icon bg-gray-100" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-3 w-24 rounded bg-gray-200" />
        <div className="h-7 w-32 rounded bg-gray-200" />
        <div className="h-2.5 w-16 rounded bg-gray-100" />
      </div>
    </div>
  );
}

// ── Custom tooltip ─────────────────────────────────────────────────────────────

function RevenueTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-card-md text-sm">
      <p className="mb-1 font-semibold text-gray-700">{label}</p>
      <p className="text-primary-600">{usd(payload[0]?.value ?? 0)}</p>
      <p className="text-gray-400">{payload[1]?.value ?? 0} invoices</p>
    </div>
  );
}

function ClientsTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-card-md text-sm">
      <p className="font-semibold text-gray-700">{label}</p>
      <p className="text-blue-600">{payload[0]?.value ?? 0} new clients</p>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthRevenue[]>([]);
  const [monthlyClients, setMonthlyClients] = useState<MonthClients[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<StatusSlice[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<RecentInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [noCompany, setNoCompany] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setBannerDismissed(sessionStorage.getItem('company-setup-dismissed') === '1');
    fetchStats();
    checkSetup();
  }, []);

  const dismissBanner = () => {
    sessionStorage.setItem('company-setup-dismissed', '1');
    setBannerDismissed(true);
  };

  const checkSetup = async () => {
    const res = await fetch('/api/companies', { credentials: 'include' });
    const data = await res.json();
    if (!data.success || !data.data?.length) { setNoCompany(true); setNeedsSetup(true); return; }
    const c = data.data[0];
    setNeedsSetup(!c.address || c.address === 'To be updated' || c.city === 'To be updated');
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/dashboard/stats', { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setSummary(data.data.summary);
        setMonthlyRevenue(data.data.monthlyRevenue);
        setMonthlyClients(data.data.monthlyClients);
        setStatusBreakdown(data.data.statusBreakdown);
        setRecentInvoices(data.data.recentInvoices);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = summary
    ? [
        { label: 'Total Revenue', value: usd(summary.totalRevenue), sub: 'From paid invoices', icon: 'revenue', color: 'bg-primary-50 text-primary-600' },
        { label: 'Paid Invoices', value: summary.paidInvoices, sub: `of ${summary.totalInvoices} total`, icon: 'paid', color: 'bg-emerald-50 text-emerald-600' },
        { label: 'Open Invoices', value: summary.openInvoices, sub: 'Awaiting payment', icon: 'open', color: 'bg-blue-50 text-blue-600' },
        { label: 'Overdue', value: summary.overdueInvoices, sub: 'Need attention', icon: 'overdue', color: 'bg-red-50 text-red-600' },
        { label: 'Total Clients', value: summary.totalClients, sub: 'Active accounts', icon: 'clients', color: 'bg-violet-50 text-violet-600' },
        { label: 'Avg Invoice', value: summary.paidInvoices > 0 ? usd(summary.totalRevenue / summary.paidInvoices) : '$0', sub: 'Per paid invoice', icon: 'avg', color: 'bg-amber-50 text-amber-600' },
      ]
    : [];

  return (
    <div className="space-y-7">

      {/* Setup banner */}
      {needsSetup && (noCompany || !bannerDismissed) && (
        <div className="alert-warning flex items-start justify-between gap-4">
          <span>
            {noCompany
              ? 'No company found. Create your first company to start issuing invoices.'
              : 'Company profile incomplete — finish setup before issuing invoices.'}
            {' '}
            <Link href="/admin/companies" className="font-bold underline">Go to Companies →</Link>
          </span>
          {!noCompany && (
            <button type="button" className="shrink-0 font-semibold hover:opacity-75" onClick={dismissBanner}>
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* Page title + CTA */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="section-title">Dashboard</h1>
          <p className="section-subtitle">Your business at a glance</p>
        </div>
        <Link href="/admin/invoices/create" className="btn btn-primary">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Invoice
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : statCards.map((s) => (
              <div key={s.label} className="stat-card">
                <div className={`stat-icon ${s.color}`}>
                  <StatIcon type={s.icon} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-gray-500">{s.label}</p>
                  <p className="mt-0.5 text-xl font-bold text-gray-900">{s.value}</p>
                  <p className="truncate text-[11px] text-gray-400">{s.sub}</p>
                </div>
              </div>
            ))}
      </div>

      {/* Revenue chart */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="font-semibold text-gray-900">Revenue Overview</h2>
            <p className="text-xs text-gray-400">Last 6 months — paid invoices only</p>
          </div>
        </div>
        <div className="p-5">
          {!mounted || isLoading ? (
            <div className="h-64 w-full skeleton rounded-lg" />
          ) : monthlyRevenue.every(m => m.revenue === 0) ? (
            <div className="flex h-64 items-center justify-center text-sm text-gray-400">No revenue data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={monthlyRevenue} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f4" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(v >= 1000 ? 1 : 0)}${v >= 1000 ? 'k' : ''}`} tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={48} />
                <Tooltip content={<RevenueTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2.5} fill="url(#revGrad)" dot={false} activeDot={{ r: 5, fill: '#22c55e', stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Two charts row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

        {/* Invoice status donut */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="font-semibold text-gray-900">Invoice Status</h2>
              <p className="text-xs text-gray-400">All time breakdown</p>
            </div>
          </div>
          <div className="flex items-center justify-center p-5">
            {!mounted || isLoading ? (
              <div className="h-56 w-full skeleton rounded-lg" />
            ) : statusBreakdown.length === 0 ? (
              <div className="flex h-56 items-center justify-center text-sm text-gray-400">No invoices yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={224}>
                <PieChart>
                  <Pie
                    data={statusBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={88}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusBreakdown.map((s, i) => (
                      <Cell key={i} fill={s.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, _: any, props: any) => [value, props?.payload?.label ?? _]}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f4', fontSize: 13 }}
                  />
                  <Legend
                    formatter={(value: string, entry: any) => (
                      <span style={{ color: '#374151', fontSize: 12 }}>{entry.payload.label}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* New clients per month */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="font-semibold text-gray-900">New Clients</h2>
              <p className="text-xs text-gray-400">Added per month</p>
            </div>
          </div>
          <div className="p-5">
            {!mounted || isLoading ? (
              <div className="h-56 w-full skeleton rounded-lg" />
            ) : monthlyClients.every(m => m.clients === 0) ? (
              <div className="flex h-56 items-center justify-center text-sm text-gray-400">No client data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={224}>
                <BarChart data={monthlyClients} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f4" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={32} />
                  <Tooltip content={<ClientsTooltip />} />
                  <Bar dataKey="clients" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Recent invoices */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="font-semibold text-gray-900">Recent Invoices</h2>
            <p className="text-xs text-gray-400">Last 6 issued</p>
          </div>
          <Link href="/admin/invoices" className="btn btn-ghost btn-sm text-primary-600">
            View all →
          </Link>
        </div>
        {isLoading ? (
          <div className="divide-y divide-gray-50">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 animate-skeleton">
                <div className="h-4 w-24 skeleton" />
                <div className="h-4 w-32 skeleton" />
                <div className="ml-auto h-4 w-16 skeleton" />
              </div>
            ))}
          </div>
        ) : recentInvoices.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">
            No invoices yet.{' '}
            <Link href="/admin/invoices/create" className="text-primary-600 font-medium hover:underline">
              Create one →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Client</th>
                  <th>Amount</th>
                  <th>Due</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map((inv) => (
                  <tr key={inv._id}>
                    <td>
                      <Link href={`/admin/invoices/${inv._id}`} className="font-semibold text-primary-600 hover:underline">
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="text-gray-700">{inv.clientName}</td>
                    <td className="font-semibold text-gray-900">{usd(inv.total)}</td>
                    <td className="text-gray-500">{new Date(inv.dueDate).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[inv.status] ?? 'badge-draft'}`}>
                        {inv.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick actions row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Create Invoice', href: '/admin/invoices/create', desc: 'Issue a new invoice to a client', color: 'bg-primary-500', icon: 'M12 4v16m8-8H4' },
          { label: 'Add Client', href: '/admin/clients', desc: 'Register a new client account', color: 'bg-blue-500', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
          { label: 'Settings', href: '/admin/settings', desc: 'Configure company & SMTP', color: 'bg-slate-600', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z' },
        ].map((a) => (
          <Link key={a.href} href={a.href} className="card group flex items-center gap-4 p-5 hover:shadow-card-md transition-shadow">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${a.color}`}>
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={a.icon} />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">{a.label}</p>
              <p className="text-xs text-gray-400">{a.desc}</p>
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}

function StatIcon({ type }: { type: string }) {
  const paths: Record<string, string> = {
    revenue: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    paid: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    open: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    overdue: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    clients: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    avg: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  };
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d={paths[type] ?? paths.revenue} />
    </svg>
  );
}
