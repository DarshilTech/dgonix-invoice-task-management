import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import { User, Company, CompanyConfig } from '@/lib/db/models';
import { verifyRequestAuth } from '@/lib/auth/middleware';
import { uploadToR2 } from '@/lib/storage/r2';

const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/svg+xml'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

const MIME_TO_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/svg+xml': 'svg',
};

export async function POST(request: NextRequest) {
  const auth = verifyRequestAuth(request);
  if (!auth.isValid || !auth.payload) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('logo') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }
    if (!ALLOWED_MIME.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Unsupported file type. Use PNG, JPG, or SVG.' },
        { status: 400 }
      );
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 5 MB.' },
        { status: 400 }
      );
    }

    const ext = MIME_TO_EXT[file.type] ?? 'png';
    const filename = `${auth.payload.userId}-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const logoUrl = await uploadToR2({
      buffer,
      filename,
      contentType: file.type,
      folder: 'logos',
    });

    await connectDB();

    // ── Primary: write logo into CompanyConfig (same source as Settings page) ──
    await CompanyConfig.findOneAndUpdate(
      { userId: auth.payload.userId },
      { $set: { logo: logoUrl } },
      { upsert: true, new: true }
    );

    // Also update Company logo so it appears in PDFs and invoices
    const user = await User.findById(auth.payload.userId).select('companyId');
    if (user?.companyId) {
      Company.findByIdAndUpdate(user.companyId, { logo: logoUrl }).catch(() => {});
    }

    return NextResponse.json({ success: true, data: { logoUrl } });
  } catch (error) {
    console.error('Logo upload error:', error);
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
  }
}
