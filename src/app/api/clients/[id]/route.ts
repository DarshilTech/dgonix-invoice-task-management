import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import { Client, Company } from '@/lib/db/models';
import { verifyRequestAuth } from '@/lib/auth/middleware';
import { updateClientSchema } from '@/lib/validation/client';

async function findClientForUser(
  id: string,
  payload: NonNullable<ReturnType<typeof verifyRequestAuth>['payload']>
) {
  if (payload.role === 'admin') {
    const ownedCompanies = await Company.find({ ownerId: payload.userId }).select('_id');
    return Client.findOne({ _id: id, tenantId: { $in: ownedCompanies.map((c) => c._id) } });
  }
  if (id !== payload.clientId) return null;
  return Client.findOne({ _id: id, tenantId: payload.tenantId });
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = verifyRequestAuth(request);
    if (!auth.isValid || !auth.payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const client = await findClientForUser(params.id, auth.payload);

    if (!client) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: client }, { status: 200 });
  } catch (error) {
    console.error('Get client error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch client' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = verifyRequestAuth(request);
    if (!auth.isValid || !auth.payload || auth.payload.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const existing = await findClientForUser(params.id, auth.payload);

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    const body = await request.json();
    const validation = updateClientSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const nextTenantId =
      validation.data.tenantId || validation.data.companyId || existing.tenantId.toString();

    if (nextTenantId !== existing.tenantId.toString()) {
      const company = await Company.findOne({ _id: nextTenantId, ownerId: auth.payload.userId });
      if (!company) {
        return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 });
      }
    }

    const client = await Client.findByIdAndUpdate(
      params.id,
      {
        ...validation.data,
        tenantId: nextTenantId,
        companyId: nextTenantId,
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json({ success: true, data: client }, { status: 200 });
  } catch (error) {
    console.error('Update client error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update client' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = verifyRequestAuth(request);
    if (!auth.isValid || !auth.payload || auth.payload.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const existing = await findClientForUser(params.id, auth.payload);

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    await Client.deleteOne({ _id: params.id });
    return NextResponse.json(
      { success: true, message: 'Client deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete client error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete client' }, { status: 500 });
  }
}
