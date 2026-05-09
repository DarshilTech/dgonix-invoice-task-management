'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/ui/StatusBadge';

type Invoice = {
  _id: string;
  invoiceNumber: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  currency: string;
  dueDate: string;
};

export default function ClientDashboardPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/invoices?limit=100', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setInvoices(data.data?.invoices || []);
          setTotal(data.data?.pagination?.total ?? (data.data?.invoices?.length ?? 0));
        } else {
          setError('Could not load invoices');
        }
      })
      .catch(() => setError('Could not load invoices'))
      .finally(() => setIsLoading(false));
  }, []);

  const paid = invoices.filter((inv) => inv.status === 'paid').length;
  const amountDue = invoices
    .filter((inv) => inv.status !== 'paid')
    .reduce((sum, inv) => sum + (inv.balanceAmount || 0), 0);
  const currency = invoices[0]?.currency || 'INV';
  const recent = invoices.slice(0, 5);

  return (
    <div>
      <div className="mb-8">
        <h1 className="section-title">Dashboard</h1>
        <p className="section-subtitle">Your invoices and payment activity</p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-gray-600">Total Invoices</p>
            <p className="mt-2 text-2xl font-bold">{isLoading ? '—' : total}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-gray-600">Paid</p>
            <p className="mt-2 text-2xl font-bold text-emerald-700">{isLoading ? '—' : paid}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-gray-600">Amount Due</p>
            <p className="mt-2 text-2xl font-bold text-amber-700">
              {isLoading ? '—' : `${currency} ${amountDue.toFixed(2)}`}
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="font-semibold">Recent Invoices</h2>
          <Link
            className="text-sm font-medium text-primary-700 hover:underline"
            href="/client/invoices"
          >
            View all
          </Link>
        </div>

        {isLoading ? (
          <div className="px-6 py-10 text-center text-sm text-gray-500">Loading...</div>
        ) : recent.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-500">No invoices yet</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {recent.map((invoice) => (
              <Link
                className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-gray-50"
                href={`/client/invoices/${invoice._id}`}
                key={invoice._id}
              >
                <div>
                  <p className="font-semibold">{invoice.invoiceNumber}</p>
                  <p className="text-xs text-gray-500">
                    Due {new Date(invoice.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={invoice.status} />
                  <p className="font-semibold">
                    {invoice.currency} {invoice.balanceAmount.toFixed(2)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
