import nodemailer from 'nodemailer';

function buildDefaultFrom(): string {
  const name = process.env.SMTP_NAME || 'Invoxa by Dgonix';
  const email =
    process.env.SMTP_FROM ||
    process.env.SMTP_USER ||
    'noreply@example.com';
  return name ? `"${name}" <${email}>` : email;
}

export async function createEmailTransporter(smtpConfig?: {
  host: string;
  port: number;
  user: string;
  pass: string;
}) {
  const config = smtpConfig || {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  };

  if (!config.host || !config.user || !config.pass) {
    throw new Error('SMTP configuration is incomplete');
  }

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  attachments?: any[];
  from?: string;
  smtpConfig?: {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
  };
}): Promise<void> {
  const transporter = await createEmailTransporter(options.smtpConfig);

  // Priority: caller-supplied from → per-tenant from → env default (with display name)
  const from = options.from || options.smtpConfig?.from || buildDefaultFrom();

  await transporter.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    attachments: options.attachments,
  });
}
