import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import { Payment } from '@/lib/db/models';
import { verifyRequestAuth } from '@/lib/auth/middleware';
import { updatePaymentSchema } from '@/lib/validation/payment';
import { deletePayment, ServiceError, updatePayment } from '@/services/paymentService';
import { getAccessibleTenantIds } from '@/services/tenantAccess';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = verifyRequestAuth(request);

    if (!auth.isValid || !auth.payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const tenantIds = getAccessibleTenantIds(auth.payload);
    if (tenantIds.length === 0) {
      return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 });
    }

    const query: Record<string, any> = { _id: params.id };
    if (auth.payload.role === 'admin') {
      query.tenantId = { $in: tenantIds };
    } else {
      query.tenantId = tenantIds[0];
      query.clientId = auth.payload.clientId;
    }

    const payment = await Payment.findOne(query)
      .populate('invoiceId', 'invoiceNumber totalAmount paidAmount balanceAmount status')
      .populate('clientId', 'name email');

    if (!payment) {
      return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        data: payment,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get payment error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch payment' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = verifyRequestAuth(request);
    if (!auth.isValid || !auth.payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const validation = updatePaymentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const payment = await updatePayment(auth.payload, params.id, validation.data);
    return NextResponse.json({ success: true, data: payment }, { status: 200 });
  } catch (error) {
    console.error('Update payment error:', error);
    if (error instanceof ServiceError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update payment' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = verifyRequestAuth(request);
    if (!auth.isValid || !auth.payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    await deletePayment(auth.payload, params.id);
    return NextResponse.json(
      { success: true, message: 'Payment deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete payment error:', error);
    if (error instanceof ServiceError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to delete payment' },
      { status: 500 }
    );
  }
}
