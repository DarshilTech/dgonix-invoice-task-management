'use client';

import { useState, useEffect, Suspense } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import Link from 'next/link';
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { PageHeader } from '@/components/ui/PageHeader';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';

// ── Types ─────────────────────────────────────────────────────────────────────

type Summary = {
  totalInvoices: number;
  paidInvoices: number;
  openInvoices: number;
  overdueInvoices: number;
  totalClients: number;
  totalRevenue: number;
  totalInvoiced: number;
  totalOutstanding: number;
};
type MonthRevenue = { month: string; revenue: number; paid: number; invoices: number };
type RecentInvoice = {
  _id: string;
  invoiceNumber: string;
  clientName: string;
  total: number;
  balance: number;
  status: string;
  dueDate: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(n);

const CURRENCIES = ['USD', 'INR', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD'];
const PERIODS = ['Day', 'Week', 'Month'] as const;

function RevenueTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-lg text-sm space-y-1">
      <p className="font-semibold text-gray-700">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {fmt(p.value ?? 0)}
        </p>
      ))}
    </div>
  );
}

function EmptyRow({ cols }: { cols: number }) {
  return (
    <tr>
      <td colSpan={cols} className="px-4 py-6 text-center text-sm text-gray-400">No records found</td>
    </tr>
  );
}

// ── Email verification banner ─────────────────────────────────────────────────

function EmailBanner({ email }: { email: string }) {
  const [sent, setSent] = useState(false);
  const [resending, setResending] = useState(false);

  const resend = async () => {
    setResending(true);
    try {
      await fetch('/api/auth/resend-verification', { method: 'POST', credentials: 'include' });
      setSent(true);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-lg text-sm">
      {sent ? (
        <p className="text-amber-800">Verification email sent to <strong>{email}</strong>. Check your inbox.</p>
      ) : (
        <p className="text-amber-800">
          Please confirm your email address.{' '}
          <button
            onClick={resend}
            disabled={resending}
            className="font-semibold underline hover:no-underline disabled:opacity-60"
          >
            {resending ? 'Sending…' : 'Resend Email'}
          </button>
        </p>
      )}
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  useDocumentTitle('Dashboard');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthRevenue[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<RecentInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>('Month');
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    setMounted(true);
    fetchStats();
    fetchProfile();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/dashboard/stats', { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setSummary(data.data.summary);
        setMonthlyRevenue(data.data.monthlyRevenue);
        setRecentInvoices(data.data.recentInvoices);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/users/profile', { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setEmailVerified(data.data.emailVerified ?? false);
        setUserEmail(data.data.email);
      }
    } catch {}
  };

  return (
    <>
      {/* Onboarding modal (reads ?onboarding=true from URL) */}
      <Suspense>
        <OnboardingModal />
      </Suspense>

      <div className="space-y-5 py-6">
        <PageHeader
          title="Dashboard"
          breadcrumbs={[{ label: 'Dashboard', home: true }]}
        />

        {/* ── Top bar ────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-500">Welcome! Glad to see you.</p>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <div className="flex overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    period === p ? 'bg-sidebar text-white' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <Link href="/admin/invoices/create" className="btn btn-primary btn-sm font-normal text-md">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Invoice
            </Link>
          </div>
        </div>

        {/* ── Stat cards ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Total Invoices',    value: summary?.totalInvoices ?? 0,    isCount: true, color: 'text-gray-900' },
            { label: 'Paid',              value: summary?.paidInvoices ?? 0,      isCount: true, color: 'text-green-600' },
            { label: 'Open / Pending',    value: summary?.openInvoices ?? 0,      isCount: true, color: 'text-blue-600' },
            { label: 'Overdue',           value: summary?.overdueInvoices ?? 0,   isCount: true, color: 'text-red-600' },
          ].map((card) => (
            <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{card.label}</p>
              <p className={`mt-1.5 text-2xl font-bold ${card.color}`}>
                {isLoading ? <span className="inline-block h-7 w-12 animate-pulse rounded bg-gray-100" /> : card.value}
              </p>
            </div>
          ))}
        </div>

        {/* ── Amount cards ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: 'Total Invoiced',  value: summary?.totalInvoiced    ?? 0, color: 'text-gray-900' },
            { label: 'Total Collected', value: summary?.totalRevenue     ?? 0, color: 'text-green-600' },
            { label: 'Outstanding',     value: summary?.totalOutstanding ?? 0, color: 'text-red-600' },
          ].map((card) => (
            <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{card.label}</p>
              <p className={`mt-1.5 text-xl font-bold ${card.color}`}>
                {isLoading ? <span className="inline-block h-7 w-24 animate-pulse rounded bg-gray-100" /> : fmt(card.value, currency)}
              </p>
            </div>
          ))}
        </div>

        {/* ── Recent Transactions + Overview chart ──────────────────────── */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
          <div className="lg:col-span-2 card">
            <div className="card-header">
              <h2 className="font-semibold text-gray-900">Recent Transactions</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {[
                { label: 'Invoices',    value: summary?.totalInvoiced    ?? 0, isAmount: true },
                { label: 'Payments',    value: summary?.totalRevenue     ?? 0, isAmount: true },
                { label: 'Expenses',    value: 0,                              isAmount: true },
                { label: 'Outstanding', value: summary?.totalOutstanding ?? 0, isAmount: true },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm text-gray-600">{row.label}</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {isLoading ? '—' : fmt(row.value, currency)}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between px-5 py-3">
                <span className="text-sm text-gray-600">Total Invoices Outstanding</span>
                <span className="text-sm font-semibold text-gray-900">
                  {isLoading ? '—' : (summary?.openInvoices ?? 0) + (summary?.overdueInvoices ?? 0)}
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 card">
            <div className="card-header">
              <div>
                <h2 className="font-semibold text-gray-900">Overview</h2>
                <p className="text-xs text-gray-400">Last 6 months</p>
              </div>
            </div>
            <div className="p-5">
              {!mounted || isLoading ? (
                <div className="h-52 w-full animate-pulse rounded-lg bg-gray-100" />
              ) : (
                <ResponsiveContainer width="100%" height={208}>
                  <AreaChart data={monthlyRevenue} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="invoicedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="paidGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f4" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={44}
                      tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                    <Tooltip content={<RevenueTooltip />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                    <Area type="monotone" dataKey="revenue" name="Invoiced" stroke="#3b82f6" strokeWidth={2} fill="url(#invoicedGrad)"
                      dot={false} activeDot={{ r: 4, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} />
                    <Area type="monotone" dataKey="paid" name="Collected" stroke="#22c55e" strokeWidth={2} fill="url(#paidGrad)"
                      dot={false} activeDot={{ r: 4, fill: '#22c55e', stroke: '#fff', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* ── Recent Activity + Recent Payments ─────────────────────────── */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold text-gray-900">Recent Activity</h2>
            </div>
            <div className="min-h-[120px] px-5 py-4 text-sm text-gray-500 space-y-2.5">
              {recentInvoices.length === 0 ? (
                <p className="text-gray-400">No activity yet</p>
              ) : (
                recentInvoices.slice(0, 5).map((inv) => (
                  <div key={inv._id} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary-400" />
                    <span>
                      Invoice{' '}
                      <Link href={`/admin/invoices/${inv._id}`} className="font-medium text-primary-600 hover:underline">
                        {inv.invoiceNumber}
                      </Link>{' '}
                      — {inv.clientName}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold text-gray-900">Recent Payments</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr><th>Number</th><th>Client</th><th>Invoice</th><th>Date</th><th>Amount</th></tr>
                </thead>
                <tbody>
                  {recentInvoices.filter((i) => i.status === 'paid').length === 0 ? (
                    <EmptyRow cols={5} />
                  ) : (
                    recentInvoices.filter((i) => i.status === 'paid').slice(0, 5).map((inv) => (
                      <tr key={inv._id}>
                        <td>{inv.invoiceNumber}</td>
                        <td>{inv.clientName}</td>
                        <td>{inv.invoiceNumber}</td>
                        <td>{new Date(inv.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td className="font-semibold">{fmt(inv.total, currency)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Upcoming Invoices + Past Due Invoices ─────────────────────── */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {[
            { title: 'Upcoming Invoices', statusFilter: 'sent', dateColor: 'text-gray-600', amtColor: 'text-gray-900', icon: 'text-blue-500' },
            { title: 'Past Due Invoices',  statusFilter: 'overdue', dateColor: 'text-red-500', amtColor: 'text-red-600', icon: 'text-red-500' },
          ].map((panel) => (
            <div key={panel.title} className="card">
              <div className="card-header">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${panel.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h2 className="font-semibold text-gray-900">{panel.title}</h2>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr><th>Number</th><th>Client</th><th>Due Date</th><th>Balance</th></tr>
                  </thead>
                  <tbody>
                    {recentInvoices.filter((i) => i.status === panel.statusFilter).length === 0 ? (
                      <EmptyRow cols={4} />
                    ) : (
                      recentInvoices.filter((i) => i.status === panel.statusFilter).slice(0, 4).map((inv) => (
                        <tr key={inv._id}>
                          <td><Link href={`/admin/invoices/${inv._id}`} className="text-primary-600 hover:underline">{inv.invoiceNumber}</Link></td>
                          <td>{inv.clientName}</td>
                          <td className={panel.dateColor}>{new Date(inv.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          <td className={`font-semibold ${panel.amtColor}`}>{fmt(inv.balance, currency)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {/* ── Expired Quotes + Upcoming Quotes ──────────────────────────── */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {['Expired Quotes', 'Upcoming Quotes'].map((title) => (
            <div key={title} className="card">
              <div className="card-header">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h2 className="font-semibold text-gray-900">{title}</h2>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead><tr><th>Number</th><th>Client</th><th>Date</th><th>Amount</th></tr></thead>
                  <tbody><EmptyRow cols={4} /></tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {/* ── Upcoming Recurring Invoices ────────────────────────────────── */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <h2 className="font-semibold text-gray-900">Upcoming Recurring Invoices</h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Number</th><th>Client</th><th>Next Send Date</th><th>Amount</th></tr></thead>
              <tbody><EmptyRow cols={4} /></tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Email verification banner */}
      {emailVerified === false && <EmailBanner email={userEmail} />}
    </>
  );
}
