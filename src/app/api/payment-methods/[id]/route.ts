import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import { PaymentMethod } from '@/lib/db/models';
import { verifyRequestAuth } from '@/lib/auth/middleware';
import { updatePaymentMethodSchema } from '@/lib/validation/payment';
import { getAccessibleTenantIds } from '@/services/tenantAccess';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = verifyRequestAuth(request);
    if (!auth.isValid || !auth.payload || auth.payload.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const validation = updatePaymentMethodSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const method = await PaymentMethod.findOneAndUpdate(
      { _id: params.id, tenantId: { $in: getAccessibleTenantIds(auth.payload) } },
      validation.data,
      { new: true, runValidators: true }
    );

    if (!method) {
      return NextResponse.json(
        { success: false, error: 'Payment method not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: method }, { status: 200 });
  } catch (error) {
    console.error('Update payment method error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update payment method' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = verifyRequestAuth(request);
    if (!auth.isValid || !auth.payload || auth.payload.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const method = await PaymentMethod.findOneAndUpdate(
      { _id: params.id, tenantId: { $in: getAccessibleTenantIds(auth.payload) } },
      { isActive: false },
      { new: true }
    );

    if (!method) {
      return NextResponse.json(
        { success: false, error: 'Payment method not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: method }, { status: 200 });
  } catch (error) {
    console.error('Delete payment method error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete payment method' },
      { status: 500 }
    );
  }
}
