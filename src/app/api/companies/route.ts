import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import { CompanyConfig } from '@/lib/db/models';
import { verifyRequestAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  try {
    const auth = verifyRequestAuth(request);
    if (!auth.isValid || !auth.payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const config = await CompanyConfig.findOne({ userId: auth.payload.userId });

    if (!config) {
      return NextResponse.json({ success: true, data: [] }, { status: 200 });
    }

    // Return in Company-compatible shape so existing dropdowns keep working.
    // _id is the tenantId the frontend uses when creating clients / invoices.
    const tenantId = auth.payload.tenantId || auth.payload.userId;
    const company = {
      _id: tenantId,
      name: config.companyName || '',
      email: config.companyEmail || '',
      companyName: config.companyName,
      companyEmail: config.companyEmail,
      phone: config.phone,
      address: config.address,
      city: config.city,
      state: config.state,
      zip: config.zip,
      country: config.country,
      logo: config.logo,
      taxId: config.taxId,
      businessNumber: config.businessNumber,
      invoicePrefix: config.invoicePrefix || 'INV',
      invoiceSequence: config.invoiceSequence || 0,
      subdomain: config.subdomain,
      language: config.language || 'en',
      currency: config.currency || 'USD',
      isActive: config.isActive !== false,
      website: config.website,
      fromEmail: config.fromEmail,
      wiseAccountEmail: config.wiseAccountEmail,
      wiseTransferRef: config.wiseTransferRef,
    };

    return NextResponse.json({ success: true, data: [company] }, { status: 200 });
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

    const config = await CompanyConfig.findOneAndUpdate(
      { userId: auth.payload.userId },
      {
        $set: {
          userId: auth.payload.userId,
          companyName: body.name || body.companyName,
          companyEmail: body.email || body.companyEmail,
          phone: body.phone,
          address: body.address,
          city: body.city,
          state: body.state,
          zip: body.zip,
          country: body.country,
          logo: body.logo,
          taxId: body.taxId,
          businessNumber: body.businessNumber,
          invoicePrefix: body.invoicePrefix || 'INV',
          fromEmail: body.fromEmail || body.email,
          website: body.website,
        },
      },
      { upsert: true, new: true }
    );

    const tenantId = auth.payload.tenantId || auth.payload.userId;
    return NextResponse.json(
      { success: true, data: { ...config.toObject(), _id: tenantId } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create company error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create company' }, { status: 500 });
  }
}
