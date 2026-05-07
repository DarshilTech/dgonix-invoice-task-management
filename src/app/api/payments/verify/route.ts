import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import { verifyRequestAuth } from '@/lib/auth/middleware';
import { verifyPaymentSchema } from '@/lib/validation/payment';
import { ServiceError, updatePayment } from '@/services/paymentService';

export async function POST(request: NextRequest) {
  try {
    const auth = verifyRequestAuth(request);

    if (!auth.isValid || !auth.payload || auth.payload.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const validation = verifyPaymentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const payment = await updatePayment(auth.payload, validation.data.paymentId, {
      status: validation.data.status,
      notes: validation.data.notes,
    });

    return NextResponse.json(
      {
        success: true,
        data: payment,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Verify payment error:', error);
    if (error instanceof ServiceError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { success: false, error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
