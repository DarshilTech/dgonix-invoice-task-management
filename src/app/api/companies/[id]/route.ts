import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import { Company } from '@/lib/db/models';
import { verifyRequestAuth } from '@/lib/auth/middleware';
import { updateCompanySchema } from '@/lib/validation/company';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = verifyRequestAuth(request);
    if (!auth.isValid || !auth.payload || auth.payload.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const validation = updateCompanySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const company = await Company.findOneAndUpdate(
      { _id: params.id, ownerId: auth.payload.userId },
      validation.data,
      { new: true, runValidators: true }
    );

    if (!company) {
      return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: company }, { status: 200 });
  } catch (error) {
    console.error('Update company error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update company' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = verifyRequestAuth(request);
    if (!auth.isValid || !auth.payload || auth.payload.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const company = await Company.findOneAndUpdate(
      { _id: params.id, ownerId: auth.payload.userId },
      { isActive: false },
      { new: true }
    );

    if (!company) {
      return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: company }, { status: 200 });
  } catch (error) {
    console.error('Delete company error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete company' }, { status: 500 });
  }
}
