import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import { Payment } from '@/lib/db/models';
import { verifyRequestAuth } from '@/lib/auth/middleware';
import { createPaymentSchema } from '@/lib/validation/payment';
import { createPaymentForInvoice, ServiceError } from '@/services/paymentService';
import { getAccessibleTenantIds } from '@/services/tenantAccess';

export async function GET(request: NextRequest) {
  try {
    const auth = verifyRequestAuth(request);

    if (!auth.isValid || !auth.payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const status = searchParams.get('status');
    const invoiceId = searchParams.get('invoiceId');

    const tenantIds = getAccessibleTenantIds(auth.payload);
    if (tenantIds.length === 0) {
      return NextResponse.json(
        { success: true, data: { payments: [], pagination: { total: 0, page: 1, limit, totalPages: 0 } } },
        { status: 200 }
      );
    }

    const query: Record<string, any> = {};
    if (auth.payload.role === 'admin') {
      query.tenantId = { $in: tenantIds };
    } else {
      query.tenantId = tenantIds[0];
      query.clientId = auth.payload.clientId;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (invoiceId) {
      query.invoiceId = invoiceId;
    }

    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate('invoiceId', 'invoiceNumber totalAmount paidAmount balanceAmount status')
        .populate('clientId', 'name email')
        .sort({ paymentDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Payment.countDocuments(query),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          payments,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get payments error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = verifyRequestAuth(request);

    if (!auth.isValid || !auth.payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const validation = createPaymentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const payment = await createPaymentForInvoice(auth.payload, validation.data);

    return NextResponse.json(
      {
        success: true,
        data: payment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create payment error:', error);
    if (error instanceof ServiceError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}
