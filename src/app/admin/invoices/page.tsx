'use client';

import { useState, useEffect, useRef } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { ActionMenu } from '@/components/ui/ActionMenu';

interface Invoice {
  _id: string;
  invoiceNumber: string;
  status: string;
  total: number;
  totalAmount: number;
  balanceAmount: number;
  clientId: { _id: string; name: string };
  dueDate: string;
  invoiceDate: string;
}

type SortKey = 'status' | 'invoiceNumber' | 'clientId' | 'totalAmount' | 'balanceAmount' | 'invoiceDate' | 'dueDate';

const LIFECYCLE_OPTIONS = ['Active', 'All', 'Archived'];
const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'viewed', label: 'Viewed' },
  { value: 'partially_paid', label: 'Partial' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_BADGE: Record<string, string> = {
  paid:           'bg-emerald-100 text-emerald-700',
  sent:           'bg-blue-100 text-blue-700',
  viewed:         'bg-amber-100 text-amber-700',
  partially_paid: 'bg-orange-100 text-orange-700',
  overdue:        'bg-red-100 text-red-700',
  draft:          'bg-gray-100 text-gray-600',
  cancelled:      'bg-gray-100 text-gray-400',
};

const ALL_COL_KEYS = ['status', 'invoiceNumber', 'clientId', 'totalAmount', 'balanceAmount', 'invoiceDate', 'dueDate'];

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n ?? 0);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

export default function AdminInvoicesPage() {
  useDocumentTitle('Invoices');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const [filter, setFilter] = useState('');
  const [lifecycle, setLifecycle] = useState('Active');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortKey, setSortKey] = useState<SortKey>('invoiceDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [visibleCols, setVisibleCols] = useState<Set<string>>(new Set(ALL_COL_KEYS));
  const [showColMenu, setShowColMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showLifecycleMenu, setShowLifecycleMenu] = useState(false);

  const colMenuRef = useRef<HTMLDivElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);
  const lifecycleMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (colMenuRef.current && !colMenuRef.current.contains(e.target as Node)) setShowColMenu(false);
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) setShowStatusMenu(false);
      if (lifecycleMenuRef.current && !lifecycleMenuRef.current.contains(e.target as Node)) setShowLifecycleMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { setPage(1); }, [statusFilter, lifecycle, filter]);
  useEffect(() => { fetchInvoices(); }, [statusFilter, lifecycle, page, limit]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchInvoices = async () => {
    setIsLoading(true);
    setSelected(new Set());
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (statusFilter) params.set('status', statusFilter);
    const res = await fetch(`/api/invoices?${params}`, { credentials: 'include' });
    const data = await res.json();
    if (data.success) {
      setInvoices(data.data?.invoices || []);
      setTotal(data.data?.pagination?.total ?? 0);
      setTotalPages(data.data?.pagination?.totalPages ?? 1);
    }
    setIsLoading(false);
  };

  const toggleSort = (key: string) => {
    const k = key as SortKey;
    if (sortKey === k) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(k); setSortDir('asc'); }
  };

  const sorted = [...invoices]
    .filter((inv) => {
      if (!filter) return true;
      const q = filter.toLowerCase();
      return inv.invoiceNumber.toLowerCase().includes(q) || (inv.clientId?.name ?? '').toLowerCase().includes(q);
    })
    .sort((a, b) => {
      let av: string | number = '';
      let bv: string | number = '';
      if (sortKey === 'clientId')      { av = a.clientId?.name ?? ''; bv = b.clientId?.name ?? ''; }
      else if (sortKey === 'totalAmount')  { av = a.totalAmount ?? 0;  bv = b.totalAmount ?? 0; }
      else if (sortKey === 'balanceAmount') { av = a.balanceAmount ?? 0; bv = b.balanceAmount ?? 0; }
      else if (sortKey === 'invoiceDate') { av = a.invoiceDate; bv = b.invoiceDate; }
      else if (sortKey === 'dueDate')    { av = a.dueDate;     bv = b.dueDate; }
      else { av = a[sortKey as keyof Invoice] as string ?? ''; bv = b[sortKey as keyof Invoice] as string ?? ''; }
      return av < bv ? (sortDir === 'asc' ? -1 : 1) : av > bv ? (sortDir === 'asc' ? 1 : -1) : 0;
    });

  const toggleAll = () =>
    setSelected(selected.size === sorted.length && sorted.length > 0 ? new Set() : new Set(sorted.map((i) => i._id)));
  const toggleOne = (id: string) =>
    setSelected((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const columns: Column<Invoice>[] = [
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (inv) => (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE[inv.status] ?? 'bg-gray-100 text-gray-500'}`}>
          {inv.status.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'invoiceNumber',
      label: 'Number',
      sortable: true,
      render: (inv) => (
        <Link href={`/admin/invoices/${inv._id}`} className="font-semibold text-primary-600 hover:text-primary-700">
          {inv.invoiceNumber}
        </Link>
      ),
    },
    {
      key: 'clientId',
      label: 'Client',
      sortable: true,
      render: (inv) => (
        <Link href="/admin/clients" className="text-primary-600 hover:text-primary-700">
          {inv.clientId?.name ?? '—'}
        </Link>
      ),
    },
    {
      key: 'totalAmount',
      label: 'Amount',
      sortable: true,
      cellClass: 'font-semibold text-gray-900',
      render: (inv) => fmt(inv.totalAmount ?? inv.total),
    },
    {
      key: 'balanceAmount',
      label: 'Balance',
      sortable: true,
      cellClass: (inv) => `font-semibold ${inv.balanceAmount > 0 ? 'text-amber-600' : 'text-gray-400'}`,
      render: (inv) => fmt(inv.balanceAmount ?? 0),
    },
    {
      key: 'invoiceDate',
      label: 'Date',
      sortable: true,
      calIcon: true,
      cellClass: 'text-gray-500',
      render: (inv) => fmtDate(inv.invoiceDate),
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      sortable: true,
      calIcon: true,
      cellClass: (inv) => {
        const overdue = inv.status !== 'paid' && new Date(inv.dueDate) < new Date();
        return overdue ? 'font-semibold text-red-600' : 'text-gray-500';
      },
      render: (inv) => fmtDate(inv.dueDate),
    },
  ];

  const colLabels: Record<string, string> = {
    status: 'Status', invoiceNumber: 'Number', clientId: 'Client',
    totalAmount: 'Amount', balanceAmount: 'Balance', invoiceDate: 'Date', dueDate: 'Due Date',
  };

  return (
    <div className="py-6 space-y-4">
      <PageHeader
        title="Invoices"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard', home: true },
          { label: 'Invoices' },
        ]}
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          name="search"
          placeholder="Filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-9 w-40 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
        />

        {/* Lifecycle */}
        <div className="relative" ref={lifecycleMenuRef}>
          <button type="button" onClick={() => setShowLifecycleMenu((v) => !v)}
            className="flex h-9 items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors">
            Lifecycle: <span className="font-medium">{lifecycle}</span>
            <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </button>
          {showLifecycleMenu && (
            <div className="absolute left-0 top-full z-20 mt-1 w-36 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
              {LIFECYCLE_OPTIONS.map((opt) => (
                <button key={opt} type="button" onClick={() => { setLifecycle(opt); setShowLifecycleMenu(false); }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${lifecycle === opt ? 'font-medium text-primary-600' : 'text-gray-700'}`}>
                  {lifecycle === opt
                    ? <svg className="h-3.5 w-3.5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    : <span className="h-3.5 w-3.5" />}
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Status */}
        <div className="relative" ref={statusMenuRef}>
          <button type="button" onClick={() => setShowStatusMenu((v) => !v)}
            className="flex h-9 items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors">
            Status:{statusFilter && <span className="font-medium capitalize">{statusFilter.replace('_', ' ')}</span>}
            <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </button>
          {showStatusMenu && (
            <div className="absolute left-0 top-full z-20 mt-1 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
              {STATUS_OPTIONS.map((opt) => (
                <button key={opt.value} type="button" onClick={() => { setStatusFilter(opt.value); setShowStatusMenu(false); }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${statusFilter === opt.value ? 'font-medium text-primary-600' : 'text-gray-700'}`}>
                  {statusFilter === opt.value
                    ? <svg className="h-3.5 w-3.5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    : <span className="h-3.5 w-3.5" />}
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Columns toggle */}
          <div className="relative" ref={colMenuRef}>
            <button type="button" onClick={() => setShowColMenu((v) => !v)}
              className="flex h-9 items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>
              Columns
            </button>
            {showColMenu && (
              <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                {ALL_COL_KEYS.map((key) => (
                  <label key={key} className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <input type="checkbox" checked={visibleCols.has(key)}
                      onChange={() => setVisibleCols((prev) => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s; })}
                      className="h-3.5 w-3.5 rounded border-gray-300 text-primary-600" />
                    {colLabels[key]}
                  </label>
                ))}
              </div>
            )}
          </div>

          <button type="button"
            className="flex h-9 items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            Import
          </button>

          <Link href="/admin/invoices/create"
            className="flex h-9 items-center gap-1.5 rounded-md bg-gray-900 px-4 text-sm font-medium text-white hover:bg-gray-700 transition-colors">
            New Invoice
          </Link>
        </div>
      </div>

      {/* Table */}
      <DataTable<Invoice>
        columns={columns}
        data={sorted}
        loading={isLoading}
        loadingRows={limit}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={toggleSort}
        selected={selected}
        onSelectAll={toggleAll}
        onSelectRow={toggleOne}
        rowKey={(inv) => inv._id}
        visibleCols={visibleCols}
        emptyText="No invoices found"
        rowAction={(inv) => (
          <ActionMenu items={[
            {
              label: 'View',
              href: `/admin/invoices/${inv._id}`,
              icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>,
            },
            {
              label: 'Edit',
              href: `/admin/invoices/${inv._id}/edit`,
              icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z"/></svg>,
            },
            {
              label: 'Download PDF',
              href: `/api/invoices/${inv._id}/pdf`,
              icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>,
            },
          ]} />
        )}
      />

      {/* Pagination */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
      </div>
    </div>
  );
}
