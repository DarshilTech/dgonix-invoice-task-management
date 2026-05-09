import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/connect';
import { Invoice, Client } from '@/lib/db/models';
import { verifyRequestAuth } from '@/lib/auth/middleware';
import { getAccessibleTenantIds } from '@/services/tenantAccess';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function getLast6Months() {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { year: d.getFullYear(), month: d.getMonth() + 1, label: MONTHS[d.getMonth()] };
  });
}

const PIE_COLORS: Record<string, string> = {
  paid: '#22c55e',
  sent: '#3b82f6',
  partially_paid: '#8b5cf6',
  draft: '#94a3b8',
  overdue: '#ef4444',
  cancelled: '#d1d5db',
};

export async function GET(request: NextRequest) {
  const auth = verifyRequestAuth(request);
  if (!auth.isValid || !auth.payload || auth.payload.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  const tenantIds = getAccessibleTenantIds(auth.payload);
  const months = getLast6Months();

  const empty = {
    summary: {
      totalInvoices: 0, paidInvoices: 0, openInvoices: 0, overdueInvoices: 0,
      totalClients: 0, totalRevenue: 0, totalInvoiced: 0, totalOutstanding: 0,
    },
    monthlyRevenue: months.map(m => ({ month: m.label, revenue: 0, invoices: 0 })),
    statusBreakdown: [],
    recentInvoices: [],
  };

  if (tenantIds.length === 0) {
    return NextResponse.json({ success: true, data: empty });
  }

  const tenantObjectIds = tenantIds.map((id) => new mongoose.Types.ObjectId(id));
  const sixMonthsAgo = new Date(months[0].year, months[0].month - 1, 1);

  const [
    revenueAgg,
    statusAgg,
    clientAgg,
    totalInvoices,
    paidCount,
    openCount,
    overdueCount,
    totalClients,
    financialAgg,
    recentInvoices,
  ] = await Promise.all([
    Invoice.aggregate([
      { $match: { tenantId: { $in: tenantObjectIds }, invoiceDate: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: '$invoiceDate' }, month: { $month: '$invoiceDate' } }, revenue: { $sum: '$totalAmount' }, paid: { $sum: '$paidAmount' }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    Invoice.aggregate([
      { $match: { tenantId: { $in: tenantObjectIds } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Client.aggregate([
      { $match: { tenantId: { $in: tenantObjectIds }, createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
    ]),
    Invoice.countDocuments({ tenantId: { $in: tenantObjectIds } }),
    Invoice.countDocuments({ tenantId: { $in: tenantObjectIds }, status: 'paid' }),
    Invoice.countDocuments({ tenantId: { $in: tenantObjectIds }, status: { $in: ['sent', 'partially_paid'] } }),
    Invoice.countDocuments({ tenantId: { $in: tenantObjectIds }, status: 'overdue' }),
    Client.countDocuments({ tenantId: { $in: tenantObjectIds } }),
    Invoice.aggregate([
      { $match: { tenantId: { $in: tenantObjectIds } } },
      {
        $group: {
          _id: null,
          totalInvoiced:    { $sum: '$totalAmount' },
          totalPaid:        { $sum: '$paidAmount' },
          totalOutstanding: { $sum: '$balanceAmount' },
        },
      },
    ]),
    Invoice.find({ tenantId: { $in: tenantObjectIds } })
      .populate('clientId', 'name')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
  ]);

  const monthlyRevenue = months.map(m => {
    const found = revenueAgg.find((r: any) => r._id.year === m.year && r._id.month === m.month);
    return { month: m.label, revenue: found?.revenue ?? 0, paid: found?.paid ?? 0, invoices: found?.count ?? 0 };
  });

  const statusMap: Record<string, number> = {};
  statusAgg.forEach((s: any) => { statusMap[s._id] = s.count; });
  const statusBreakdown = Object.entries(statusMap)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, label: name.replace('_', ' '), value, color: PIE_COLORS[name] ?? '#94a3b8' }));

  const fin = financialAgg[0] ?? { totalInvoiced: 0, totalPaid: 0, totalOutstanding: 0 };

  return NextResponse.json({
    success: true,
    data: {
      summary: {
        totalInvoices,
        paidInvoices:     paidCount,
        openInvoices:     openCount,
        overdueInvoices:  overdueCount,
        totalClients,
        totalRevenue:     fin.totalPaid,
        totalInvoiced:    fin.totalInvoiced,
        totalOutstanding: fin.totalOutstanding,
      },
      monthlyRevenue,
      statusBreakdown,
      recentInvoices: recentInvoices.map((inv: any) => ({
        _id:           inv._id,
        invoiceNumber: inv.invoiceNumber,
        clientName:    (inv.clientId as any)?.name ?? 'Unknown',
        total:         inv.totalAmount ?? inv.total ?? 0,
        balance:       inv.balanceAmount ?? 0,
        status:        inv.status,
        dueDate:       inv.dueDate,
      })),
    },
  });
}
