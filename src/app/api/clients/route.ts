import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import { Client, Invoice } from '@/lib/db/models';
import { verifyRequestAuth } from '@/lib/auth/middleware';
import { createClientSchema } from '@/lib/validation/client';
import { getAccessibleTenantIds, canAccessTenant, getPrimaryTenantId } from '@/services/tenantAccess';

export async function GET(request: NextRequest) {
  try {
    const auth = verifyRequestAuth(request);

    if (!auth.isValid || !auth.payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('tenantId') || searchParams.get('companyId') || undefined;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));

    const query: Record<string, unknown> = {};

    if (auth.payload.role === 'admin') {
      const tenantIds = getAccessibleTenantIds(auth.payload);
      if (tenantIds.length === 0) {
        return NextResponse.json(
          { success: true, data: [], pagination: { total: 0, page: 1, limit, totalPages: 0 } },
          { status: 200 }
        );
      }
      if (companyId) {
        if (!canAccessTenant(auth.payload, companyId)) {
          return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 });
        }
        query.tenantId = companyId;
      } else {
        query.tenantId = { $in: tenantIds };
      }
    } else {
      query.tenantId = auth.payload.tenantId;
      query._id = auth.payload.clientId;
    }

    if (status && status !== 'all') query.status = status;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [clients, total] = await Promise.all([
      Client.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Client.countDocuments(query),
    ]);

    const clientIds = clients.map((c) => c._id);
    const financials = await Invoice.aggregate([
      { $match: { clientId: { $in: clientIds } } },
      {
        $group: {
          _id: '$clientId',
          balance: { $sum: '$balanceAmount' },
          paidToDate: { $sum: '$paidAmount' },
        },
      },
    ]);
    const finMap = new Map(financials.map((f) => [f._id.toString(), f]));

    const enriched = clients.map((c) => {
      const fin = finMap.get((c._id as any).toString());
      return { ...c, balance: fin?.balance ?? 0, paidToDate: fin?.paidToDate ?? 0 };
    });

    return NextResponse.json(
      {
        success: true,
        data: enriched,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get clients error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch clients' }, { status: 500 });
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

    const requestedTenantId = validation.data.tenantId || validation.data.companyId;
    const tenantId = requestedTenantId && canAccessTenant(auth.payload, requestedTenantId)
      ? requestedTenantId
      : getPrimaryTenantId(auth.payload);

    const client = await Client.create({
      ...validation.data,
      tenantId,
      companyId: tenantId,
    });

    return NextResponse.json({ success: true, data: client }, { status: 201 });
  } catch (error) {
    console.error('Create client error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create client' }, { status: 500 });
  }
}
