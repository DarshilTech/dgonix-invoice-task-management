import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

function getR2Client(): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true,
  });
}

function getPublicUrl(key: string): string {
  const baseProduction = (process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, '');
  const baseDevelopment = (process.env.R2_DEVELOPMENT_PUBLIC_URL ?? '').replace(/\/$/, '');
  const base = process.env.NODE_ENV === 'production' ? baseProduction : baseDevelopment;

  return `${base}/${key}`;
}

export async function uploadToR2(params: {
  buffer: Buffer;
  filename: string;
  contentType: string;
  folder?: string;
}): Promise<string> {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) throw new Error('R2_BUCKET_NAME is not configured');

  const key = params.folder
    ? `${params.folder.replace(/\/$/, '')}/${params.filename}`
    : params.filename;

  const client = getR2Client();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: params.buffer,
      ContentType: params.contentType,
    })
  );

  return getPublicUrl(key);
}

export async function deleteFromR2(publicUrl: string): Promise<void> {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) return;

  const baseProduction = (process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, '');
  const baseDevelopment = (process.env.R2_DEVELOPMENT_PUBLIC_URL ?? '').replace(/\/$/, '');
  const key = publicUrl.replace(`${process.env.NODE_ENV === 'production' ? baseProduction : baseDevelopment}/`, '');
  if (!key || key === publicUrl) return;

  const client = getR2Client();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
