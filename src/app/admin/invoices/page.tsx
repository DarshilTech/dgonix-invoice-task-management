'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Invoice {
  _id: string;
  invoiceNumber: string;
  status: string;
  total: number;
  totalAmount: number;
  balanceAmount: number;
  clientId: { name: string };
  dueDate: string;
  invoiceDate: string;
}

const STATUSES = [
  { value: '',              label: 'All' },
  { value: 'draft',         label: 'Draft' },
  { value: 'sent',          label: 'Sent' },
  { value: 'partially_paid',label: 'Partial' },
  { value: 'paid',          label: 'Paid' },
  { value: 'overdue',       label: 'Overdue' },
];

const STATUS_BADGE: Record<string, string> = {
  paid: 'badge-paid', sent: 'badge-sent', partially_paid: 'badge-partial',
  overdue: 'badge-overdue', draft: 'badge-draft', cancelled: 'badge-inactive',
};

const usd = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { fetchInvoices(); }, [statusFilter]);

  const fetchInvoices = async () => {
    setIsLoading(true);
    const url = `/api/invoices${statusFilter ? `?status=${statusFilter}` : ''}`;
    const res = await fetch(url, { credentials: 'include' });
    const data = await res.json();
    if (data.success) setInvoices(data.data?.invoices || []);
    setIsLoading(false);
  };

  const totals = invoices.reduce(
    (acc, inv) => {
      acc.count++;
      acc.total += inv.totalAmount || inv.total;
      if (inv.status === 'paid') acc.paid++;
      if (inv.status === 'overdue') acc.overdue++;
      if (['sent', 'partially_paid'].includes(inv.status)) acc.open++;
      return acc;
    },
    { count: 0, total: 0, paid: 0, overdue: 0, open: 0 }
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="section-title">Invoices</h1>
          <p className="section-subtitle">Create, track and manage all invoices</p>
        </div>
        <Link href="/admin/invoices/create" className="btn btn-primary">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          New Invoice
        </Link>
      </div>

      {/* Summary chips */}
      {!isLoading && invoices.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <div className="card flex items-center gap-2.5 px-4 py-2.5">
            <span className="text-xs font-medium text-gray-400">Total</span>
            <span className="text-sm font-bold text-gray-900">{totals.count}</span>
          </div>
          <div className="card flex items-center gap-2.5 px-4 py-2.5">
            <span className="text-xs font-medium text-gray-400">Value</span>
            <span className="text-sm font-bold text-gray-900">{usd(totals.total)}</span>
          </div>
          <div className="card flex items-center gap-2.5 px-4 py-2.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-gray-400">Paid</span>
            <span className="text-sm font-bold text-emerald-600">{totals.paid}</span>
          </div>
          <div className="card flex items-center gap-2.5 px-4 py-2.5">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-xs font-medium text-gray-400">Open</span>
            <span className="text-sm font-bold text-blue-600">{totals.open}</span>
          </div>
          {totals.overdue > 0 && (
            <div className="card flex items-center gap-2.5 px-4 py-2.5">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-xs font-medium text-gray-400">Overdue</span>
              <span className="text-sm font-bold text-red-600">{totals.overdue}</span>
            </div>
          )}
        </div>
      )}

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setStatusFilter(s.value)}
            className={`filter-chip ${statusFilter === s.value ? 'filter-chip-active' : 'filter-chip-inactive'}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card">
        {isLoading ? (
          <div className="divide-y divide-gray-50">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 animate-skeleton">
                <div className="h-4 w-24 skeleton" />
                <div className="h-4 w-32 skeleton" />
                <div className="ml-auto h-4 w-20 skeleton" />
                <div className="h-6 w-16 skeleton rounded-full" />
              </div>
            ))}
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-medium text-gray-500">No invoices found</p>
            {statusFilter && (
              <button className="mt-2 text-sm text-primary-600 hover:underline" onClick={() => setStatusFilter('')} type="button">
                Clear filter
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden overflow-x-auto md:block">
              <table className="table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Client</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Balance</th>
                    <th>Due</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => {
                    const overdue = inv.status !== 'paid' && new Date(inv.dueDate) < new Date();
                    return (
                      <tr key={inv._id}>
                        <td>
                          <Link href={`/admin/invoices/${inv._id}`} className="font-semibold text-primary-600 hover:text-primary-700">
                            {inv.invoiceNumber}
                          </Link>
                        </td>
                        <td className="font-medium text-gray-700">{inv.clientId?.name}</td>
                        <td className="text-gray-500">{new Date(inv.invoiceDate).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}</td>
                        <td className="font-semibold text-gray-900">{usd(inv.totalAmount || inv.total)}</td>
                        <td className={`font-semibold ${inv.balanceAmount > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                          {usd(inv.balanceAmount || 0)}
                        </td>
                        <td className={overdue ? 'font-semibold text-red-600' : 'text-gray-500'}>
                          {new Date(inv.dueDate).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}
                        </td>
                        <td>
                          <span className={`badge ${STATUS_BADGE[inv.status] ?? 'badge-draft'}`}>
                            {inv.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-gray-50 md:hidden">
              {invoices.map((inv) => (
                <Link key={inv._id} href={`/admin/invoices/${inv._id}`} className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-semibold text-gray-900">{inv.invoiceNumber}</p>
                    <p className="text-sm text-gray-500">{inv.clientId?.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Due {new Date(inv.dueDate).toLocaleDateString('en-GB', { day:'2-digit', month:'short' })}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{usd(inv.totalAmount || inv.total)}</p>
                    <span className={`badge mt-1 ${STATUS_BADGE[inv.status] ?? 'badge-draft'}`}>
                      {inv.status.replace('_', ' ')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
