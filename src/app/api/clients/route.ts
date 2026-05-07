import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import { Client, Company } from '@/lib/db/models';
import { verifyRequestAuth } from '@/lib/auth/middleware';
import { createClientSchema } from '@/lib/validation/client';
import { getAccessibleTenantIds, requireTenantAccess } from '@/services/tenantAccess';

export async function GET(request: NextRequest) {
  try {
    const auth = verifyRequestAuth(request);

    if (!auth.isValid || !auth.payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || searchParams.get('companyId') || undefined;
    const search = searchParams.get('search') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));

    const query: Record<string, any> = {};

    if (tenantId) {
      requireTenantAccess(auth.payload, tenantId);
      query.tenantId = tenantId;
    } else if (auth.payload.role === 'admin') {
      query.tenantId = { $in: getAccessibleTenantIds(auth.payload) };
    } else {
      query.tenantId = auth.payload.tenantId;
      query._id = auth.payload.clientId;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [clients, total] = await Promise.all([
      Client.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Client.countDocuments(query),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: clients,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get clients error:', error);
    const status = error instanceof Error && error.message === 'Forbidden' ? 403 : 500;
    return NextResponse.json(
      { success: false, error: status === 403 ? 'Forbidden' : 'Failed to fetch clients' },
      { status }
    );
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
    const validation = createClientSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const tenantId = validation.data.tenantId || validation.data.companyId;
    requireTenantAccess(auth.payload, tenantId);

    const company = await Company.findById(tenantId);
    if (!company) {
      return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 });
    }

    const client = await Client.create({
      ...validation.data,
      tenantId,
      companyId: tenantId,
    });

    return NextResponse.json(
      {
        success: true,
        data: client,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create client error:', error);
    const status = error instanceof Error && error.message === 'Forbidden' ? 403 : 500;
    return NextResponse.json(
      { success: false, error: status === 403 ? 'Forbidden' : 'Failed to create client' },
      { status }
    );
  }
}
