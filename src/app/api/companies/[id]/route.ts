import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import { CompanyConfig } from '@/lib/db/models';
import { verifyRequestAuth } from '@/lib/auth/middleware';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = verifyRequestAuth(request);
    if (!auth.isValid || !auth.payload || auth.payload.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();

    // Map Company field names to CompanyConfig field names
    const update: Record<string, unknown> = {};
    if (body.name !== undefined)             update.companyName       = body.name;
    if (body.companyName !== undefined)      update.companyName       = body.companyName;
    if (body.email !== undefined)            update.companyEmail      = body.email;
    if (body.companyEmail !== undefined)     update.companyEmail      = body.companyEmail;
    if (body.phone !== undefined)            update.phone             = body.phone;
    if (body.website !== undefined)          update.website           = body.website;
    if (body.address !== undefined)          update.address           = body.address;
    if (body.city !== undefined)             update.city              = body.city;
    if (body.state !== undefined)            update.state             = body.state;
    if (body.zip !== undefined)              update.zip               = body.zip;
    if (body.country !== undefined)          update.country           = body.country;
    if (body.logo !== undefined)             update.logo              = body.logo;
    if (body.taxId !== undefined)            update.taxId             = body.taxId;
    if (body.businessNumber !== undefined)   update.businessNumber    = body.businessNumber;
    if (body.fromEmail !== undefined)        update.fromEmail         = body.fromEmail;
    if (body.invoicePrefix !== undefined)    update.invoicePrefix     = body.invoicePrefix;
    if (body.subdomain !== undefined)        update.subdomain         = body.subdomain;
    if (body.language !== undefined)         update.language          = body.language;
    if (body.currency !== undefined)         update.currency          = body.currency;
    if (body.smtpHost !== undefined)         update.smtpHost          = body.smtpHost;
    if (body.smtpPort !== undefined)         update.smtpPort          = body.smtpPort;
    if (body.smtpUser !== undefined)         update.smtpUser          = body.smtpUser;
    if (body.smtpPass !== undefined)         update.smtpPass          = body.smtpPass;
    if (body.senderName !== undefined)       update.senderName        = body.senderName;
    if (body.wiseAccountEmail !== undefined) update.wiseAccountEmail  = body.wiseAccountEmail;
    if (body.wiseTransferRef !== undefined)  update.wiseTransferRef   = body.wiseTransferRef;

    const config = await CompanyConfig.findOneAndUpdate(
      { userId: auth.payload.userId },
      { $set: update },
      { new: true, upsert: true, runValidators: true }
    );

    const tenantId = auth.payload.tenantId || auth.payload.userId;
    return NextResponse.json(
      { success: true, data: { ...config.toObject(), _id: tenantId } },
      { status: 200 }
    );
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

    const config = await CompanyConfig.findOneAndUpdate(
      { userId: auth.payload.userId },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!config) {
      return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: config }, { status: 200 });
  } catch (error) {
    console.error('Delete company error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete company' }, { status: 500 });
  }
}
