import { NextRequest, NextResponse } from 'next/server';
import { verifyRequestAuth } from '@/lib/auth/middleware';
import { uploadToR2 } from '@/lib/storage/r2';

const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;

const MIME_TO_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/svg+xml': 'svg',
  'image/webp': 'webp',
};

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const auth = verifyRequestAuth(request);
  if (!auth.isValid || !auth.payload) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'uploads';

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }
    if (!ALLOWED_MIME.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Unsupported file type.' },
        { status: 400 }
      );
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum 5 MB.' },
        { status: 400 }
      );
    }

    const ext = MIME_TO_EXT[file.type] ?? 'png';
    const filename = `${auth.payload.userId}-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const url = await uploadToR2({ buffer, filename, contentType: file.type, folder });

    return NextResponse.json({ success: true, data: { url } });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
  }
}
