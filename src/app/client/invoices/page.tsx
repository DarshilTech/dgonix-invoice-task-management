'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/ui/StatusBadge';

type Invoice = {
  _id: string;
  invoiceNumber: string;
  status: string;
  totalAmount: number;
  balanceAmount: number;
  dueDate: string;
};

export default function ClientInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const query = status ? `?status=${status}` : '';
    fetch(`/api/invoices${query}`, { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setInvoices(data.data?.invoices || []);
      });
  }, [status]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="section-title">Invoices</h1>
        <p className="section-subtitle">View invoices, download PDFs, and submit payment proof</p>
      </div>

      <div className="mb-6">
        <select
          className="input max-w-xs"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="">All Status</option>
          <option value="sent">Sent</option>
          <option value="partially_paid">Partially Paid</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      <div className="grid gap-4">
        {invoices.map((invoice) => (
          <Link
            className="card hover:shadow-md"
            href={`/client/invoices/${invoice._id}`}
            key={invoice._id}
          >
            <div className="card-body flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">Invoice {invoice.invoiceNumber}</p>
                <p className="text-sm text-gray-600">
                  Due {new Date(invoice.dueDate).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Balance</p>
                  <p className="font-bold">${invoice.balanceAmount.toFixed(2)}</p>
                </div>
                <StatusBadge status={invoice.status} />
              </div>
            </div>
          </Link>
        ))}
        {invoices.length === 0 ? (
          <div className="card">
            <div className="card-body text-center text-gray-500">No invoices found</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
