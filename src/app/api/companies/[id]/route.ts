import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import { Company } from '@/lib/db/models';
import { verifyRequestAuth } from '@/lib/auth/middleware';
import { updateCompanySchema } from '@/lib/validation/company';
import { requireTenantAccess } from '@/services/tenantAccess';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = verifyRequestAuth(request);
    if (!auth.isValid || !auth.payload || auth.payload.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    requireTenantAccess(auth.payload, params.id);
    await connectDB();

    const body = await request.json();
    const validation = updateCompanySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const company = await Company.findByIdAndUpdate(params.id, validation.data, {
      new: true,
      runValidators: true,
    });

    if (!company) {
      return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: company }, { status: 200 });
  } catch (error) {
    console.error('Update company error:', error);
    const status = error instanceof Error && error.message === 'Forbidden' ? 403 : 500;
    return NextResponse.json(
      { success: false, error: status === 403 ? 'Forbidden' : 'Failed to update company' },
      { status }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = verifyRequestAuth(request);
    if (!auth.isValid || !auth.payload || auth.payload.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    requireTenantAccess(auth.payload, params.id);
    await connectDB();

    const company = await Company.findByIdAndUpdate(
      params.id,
      { isActive: false },
      { new: true, runValidators: true }
    );

    if (!company) {
      return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: company }, { status: 200 });
  } catch (error) {
    console.error('Delete company error:', error);
    const status = error instanceof Error && error.message === 'Forbidden' ? 403 : 500;
    return NextResponse.json(
      { success: false, error: status === 403 ? 'Forbidden' : 'Failed to delete company' },
      { status }
    );
  }
}
