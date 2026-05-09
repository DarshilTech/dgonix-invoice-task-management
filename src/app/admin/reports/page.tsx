'use client';

import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const REPORTS = [
  {
    title: 'Revenue Report',
    description: 'Total revenue, monthly breakdown, and growth trends.',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    title: 'Invoice Summary',
    description: 'Overview of all invoices by status, client, and date range.',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    title: 'Payment History',
    description: 'Complete payment log with client, amount, and method details.',
    icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
    color: 'bg-violet-50 text-violet-600',
  },
  {
    title: 'Client Statement',
    description: 'Per-client balance, invoice history, and outstanding amounts.',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    color: 'bg-amber-50 text-amber-600',
  },
];

export default function ReportsPage() {
  useDocumentTitle('Reports');
  return (
    <div className="space-y-6 py-6">
      <div>
        <h1 className="section-title">Reports</h1>
        <p className="section-subtitle">Financial reports and analytics</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {REPORTS.map((report) => (
          <div key={report.title} className="card group cursor-pointer hover:shadow-card-md transition-shadow">
            <div className="flex items-start gap-4 p-5">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${report.color}`}>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={report.icon} />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                    {report.title}
                  </p>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                    Coming soon
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500">{report.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
