import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import { Company } from '@/lib/db/models';
import { verifyRequestAuth } from '@/lib/auth/middleware';
import { companySchema } from '@/lib/validation/company';

export async function GET(request: NextRequest) {
  try {
    const auth = verifyRequestAuth(request);
    if (!auth.isValid || !auth.payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const companies = await Company.find({ ownerId: auth.payload.userId, isActive: true }).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: companies }, { status: 200 });
  } catch (error) {
    console.error('Get companies error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch companies' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = verifyRequestAuth(request);
    if (!auth.isValid || !auth.payload || auth.payload.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const validation = companySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const company = await Company.create({
      ...validation.data,
      fromEmail: validation.data.fromEmail || validation.data.email,
      ownerId: auth.payload.userId,
    });

    return NextResponse.json({ success: true, data: company }, { status: 201 });
  } catch (error) {
    console.error('Create company error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create company' }, { status: 500 });
  }
}
