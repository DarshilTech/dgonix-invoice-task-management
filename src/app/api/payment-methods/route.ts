import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import { PaymentMethod } from '@/lib/db/models';
import { verifyRequestAuth } from '@/lib/auth/middleware';
import { paymentMethodSchema } from '@/lib/validation/payment';
import { getAccessibleTenantIds, getPrimaryTenantId } from '@/services/tenantAccess';

export async function GET(request: NextRequest) {
  try {
    const auth = verifyRequestAuth(request);
    if (!auth.isValid || !auth.payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const includeDisabled = searchParams.get('includeDisabled') === 'true';

    const tenantIds = getAccessibleTenantIds(auth.payload);
    if (tenantIds.length === 0) {
      return NextResponse.json({ success: true, data: [] }, { status: 200 });
    }

    const query: Record<string, any> = {
      tenantId: auth.payload.role === 'admin' ? { $in: tenantIds } : tenantIds[0],
    };

    if (!includeDisabled) {
      query.isActive = true;
    }

    const methods = await PaymentMethod.find(query).sort({ name: 1 });
    return NextResponse.json({ success: true, data: methods }, { status: 200 });
  } catch (error) {
    console.error('Get payment methods error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payment methods' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = verifyRequestAuth(request);
    if (!auth.isValid || !auth.payload || auth.payload.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const tenantIds = getAccessibleTenantIds(auth.payload);
    if (tenantIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Please create a company first before adding payment methods.' },
        { status: 400 }
      );
    }

    await connectDB();
    const body = await request.json();
    const validation = paymentMethodSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const method = await PaymentMethod.create({
      ...validation.data,
      tenantId: tenantIds[0],
    });

    return NextResponse.json({ success: true, data: method }, { status: 201 });
  } catch (error) {
    console.error('Create payment method error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create payment method' },
      { status: 500 }
    );
  }
}
