'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Invoice {
  _id: string;
  invoiceNumber: string;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  invoiceDate: string;
  dueDate: string;
  paymentReference: string;
}

export default function PortalInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchInvoices();
  }, [filter]);

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      const url = new URL('/api/invoices', window.location.origin);
      if (filter !== 'all') url.searchParams.set('status', filter);

      const res = await fetch(url, { credentials: 'include' });
      const data = await res.json();

      if (data.success) {
        setInvoices(data.data.invoices);
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'paid':
        return 'badge badge-paid';
      case 'sent':
      case 'pending':
        return 'badge badge-pending';
      case 'overdue':
        return 'badge badge-overdue';
      default:
        return 'badge badge-draft';
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="section-title">Invoices</h1>
        <p className="section-subtitle">View and manage your invoices</p>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="flex gap-2 flex-wrap">
            {['all', 'sent', 'paid', 'overdue'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === status
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Invoices */}
      {isLoading ? (
        <div className="card">
          <div className="card-body text-center py-12">
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      ) : invoices.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-12">
            <p className="text-gray-500">No invoices found</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {invoices.map((invoice) => (
            <Link
              key={invoice._id}
              href={`/portal/invoices/${invoice._id}`}
              className="card hover:shadow-lg transition-shadow"
            >
              <div className="card-body">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">Invoice #{invoice.invoiceNumber}</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      Due: {new Date(invoice.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">${invoice.total.toFixed(2)}</p>
                    <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${
                      getStatusBadgeClass(invoice.status)
                    }`}>
                      {invoice.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
