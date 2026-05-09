'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ActionMenu } from '@/components/ui/ActionMenu';

type Client = {
  _id: string;
  name: string;
  email: string;
  idNumber?: string;
  status: 'active' | 'inactive';
  balance: number;
  paidToDate: number;
  createdAt: string;
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const LIMIT_OPTIONS = [10, 25, 50];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={copy} className="ml-1.5 text-gray-300 hover:text-gray-500 transition-colors" title="Copy email">
      {copied ? (
        <svg className="h-3.5 w-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
}

function SortIcon() {
  return (
    <svg className="ml-1 inline h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
    </svg>
  );
}

export default function AdminClientsPage() {
  useDocumentTitle('Clients');
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lifecycle, setLifecycle] = useState('active');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; clientId: string; clientName: string }>({ open: false, clientId: '', clientName: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => { setPage(1); }, [debouncedSearch, lifecycle, limit]);
  useEffect(() => { fetchClients(); }, [debouncedSearch, lifecycle, page, limit]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchClients = async () => {
    setIsLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (lifecycle && lifecycle !== 'all') params.set('status', lifecycle);
    const res = await fetch(`/api/clients?${params}`, { credentials: 'include' });
    const data = await res.json();
    if (data.success) {
      setClients(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.total || 0);
    }
    setIsLoading(false);
  };

  const executeDelete = async () => {
    setIsDeleting(true);
    await fetch(`/api/clients/${confirmModal.clientId}`, { method: 'DELETE', credentials: 'include' });
    setIsDeleting(false);
    setConfirmModal({ open: false, clientId: '', clientName: '' });
    fetchClients();
  };

  return (
    <div className="space-y-4 py-6">
      <ConfirmModal
        open={confirmModal.open}
        title="Delete Client"
        description={`Delete "${confirmModal.clientName}"? This cannot be undone.`}
        confirmLabel="Delete Client"
        onConfirm={executeDelete}
        onCancel={() => setConfirmModal({ open: false, clientId: '', clientName: '' })}
        loading={isDeleting}
        danger
      />

      <PageHeader
        title="Clients"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard', home: true },
          { label: 'Clients' },
        ]}
      />

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          name="search"
          className="input max-w-[180px] text-sm"
          placeholder="Filter…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="input w-auto text-sm"
          value={lifecycle}
          onChange={(e) => setLifecycle(e.target.value)}
        >
          <option value="active">Lifecycle: Active</option>
          <option value="inactive">Lifecycle: Inactive</option>
          <option value="all">Lifecycle: All</option>
        </select>

        <div className="flex-1" />

        <button className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-1.5">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 0v10m0-10a2 2 0 012 2h2a2 2 0 012-2V7" />
          </svg>
          Columns
        </button>
        <button className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-1.5">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Import
        </button>
        <Link
          href="/admin/clients/create"
          className="h-9 rounded-lg bg-gray-900 px-4 text-sm font-medium text-white hover:bg-gray-700 transition-colors flex items-center gap-1.5"
        >
          New Client
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {isLoading ? (
          <div className="divide-y divide-gray-50">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="h-4 w-4 rounded bg-gray-100 animate-pulse" />
                <div className="h-4 w-40 rounded bg-gray-100 animate-pulse" />
                <div className="h-4 w-48 rounded bg-gray-100 animate-pulse flex-1" />
                <div className="h-4 w-20 rounded bg-gray-100 animate-pulse" />
                <div className="h-4 w-20 rounded bg-gray-100 animate-pulse" />
                <div className="h-4 w-20 rounded bg-gray-100 animate-pulse" />
                <div className="h-4 w-24 rounded bg-gray-100 animate-pulse" />
              </div>
            ))}
          </div>
        ) : clients.length === 0 ? (
          <div className="px-5 py-16 text-center text-sm text-gray-400">No clients found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="w-10 px-4 py-3">
                    <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Name <SortIcon />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Contact Email <SortIcon />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    ID Number <SortIcon />
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Balance <SortIcon />
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Paid to Date <SortIcon />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Date Created <SortIcon />
                  </th>
                  <th className="w-28 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {clients.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50/40 transition-colors">
                    <td className="px-4 py-3">
                      <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/clients/${c._id}/edit`}
                        className="font-medium text-primary-600 hover:text-primary-700 hover:underline"
                      >
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className="flex items-center">
                        {c.email}
                        <CopyButton text={c.email} />
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{c.idNumber || '—'}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">{fmt(c.balance)}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">{fmt(c.paidToDate)}</td>
                    <td className="px-4 py-3 text-gray-500">{fmtDate(c.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <ActionMenu items={[
                        { label: 'Edit', onClick: () => router.push(`/admin/clients/${c._id}/edit`) },
                        { label: 'Delete', onClick: () => setConfirmModal({ open: true, clientId: c._id, clientName: c.name }), danger: true },
                      ]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
        <span>Total results: {totalCount}</span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(1)}
            disabled={page <= 1}
            className="flex h-8 w-8 items-center justify-center rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40"
          >
            «
          </button>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex h-8 w-8 items-center justify-center rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40"
          >
            ‹
          </button>
          <span className="px-3 py-1 text-sm font-medium">{page} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="flex h-8 w-8 items-center justify-center rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40"
          >
            ›
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={page >= totalPages}
            className="flex h-8 w-8 items-center justify-center rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40"
          >
            »
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span>rows:</span>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
          >
            {LIMIT_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}
