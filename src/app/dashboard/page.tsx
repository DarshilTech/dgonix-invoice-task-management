'use client';

export default function PortalDashboard() {
  const stats = [
    { title: 'Total Invoices', value: 0, icon: '📄' },
    { title: 'Paid Invoices', value: 0, icon: '✅' },
    { title: 'Pending Invoices', value: 0, icon: '⏳' },
    { title: 'Total Amount Due', value: '$0', icon: '💰' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="section-title">Dashboard</h1>
        <p className="section-subtitle">Your invoice summary</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, idx) => (
          <div key={idx} className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">{stat.title}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                </div>
                <span className="text-4xl">{stat.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Invoices */}
      <div className="card">
        <div className="card-header">
          <h2 className="font-semibold text-gray-900">Recent Invoices</h2>
        </div>
        <div className="card-body">
          <p className="text-gray-500 text-center py-8">No invoices available</p>
        </div>
      </div>
    </div>
  );
}
