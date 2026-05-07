export default function PortalPaymentsPage() {
  return (
    <div>
      <h1 className="section-title">Payments</h1>
      <p className="section-subtitle">Submit and track your payments</p>

      <div className="card mt-6">
        <div className="card-header">
          <h2 className="font-semibold">Payment History</h2>
        </div>
        <div className="card-body">
          <p className="text-gray-500 text-center py-12">No payment history</p>
        </div>
      </div>
    </div>
  );
}
