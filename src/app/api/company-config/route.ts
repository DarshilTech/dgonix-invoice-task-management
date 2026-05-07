import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import { CompanyConfig } from '@/lib/db/models';
import { verifyRequestAuth } from '@/lib/auth/middleware';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const configSchema = z.object({
  companyName: z.string().optional(),
  companyEmail: z.string().email().or(z.literal('')).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  logo: z.string().optional(),
  taxId: z.string().optional(),
  invoicePrefix: z.string().min(1).optional(),
  fromEmail: z.string().email().or(z.literal('')).optional(),
  senderName: z.string().optional(),
  smtpHost: z.string().optional(),
  smtpPort: z.number().optional(),
  smtpUser: z.string().optional(),
  smtpPass: z.string().optional(),
  website: z.string().optional(),
  wiseAccountEmail: z.string().optional(),
  wiseTransferRef: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const auth = verifyRequestAuth(request);
    if (!auth.isValid || !auth.payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const config = await CompanyConfig.findOne({ userId: auth.payload.userId });
    return NextResponse.json({ success: true, data: config || null });
  } catch (error) {
    console.error('Get company config error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch company configuration' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = verifyRequestAuth(request);
    if (!auth.isValid || !auth.payload || auth.payload.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();

    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(body)) {
      if (v !== '') cleaned[k] = v;
    }
    if (cleaned.smtpPort) cleaned.smtpPort = Number(cleaned.smtpPort);

    const validation = configSchema.safeParse(cleaned);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const config = await CompanyConfig.findOneAndUpdate(
      { userId: auth.payload.userId },
      { ...validation.data, userId: auth.payload.userId },
      { new: true, upsert: true, runValidators: true }
    );

    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    console.error('Update company config error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save company configuration' },
      { status: 500 }
    );
  }
}
