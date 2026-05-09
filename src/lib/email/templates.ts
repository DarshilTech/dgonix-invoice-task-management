const BASE = `
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:14px;color:#222;-webkit-font-smoothing:antialiased}
  .wrap{max-width:600px;margin:40px auto;padding:0 16px 40px}
  .card{background:#fff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,.08);overflow:hidden}
  .top-bar{height:4px;background:#2e7d32}
  .body{padding:36px 40px}
  h1{font-size:20px;font-weight:700;color:#111;margin-bottom:6px}
  p{color:#444;font-size:14px;line-height:1.65;margin-bottom:14px}
  p:last-child{margin-bottom:0}
  .info-box{background:#f8f9fa;border:1px solid #e8eaec;border-radius:6px;padding:20px 24px;margin:20px 0}
  .info-row{display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid #eef0f2;font-size:13.5px}
  .info-row:last-child{border-bottom:none}
  .info-row .lbl{color:#666;font-weight:500}
  .info-row .val{color:#111;font-weight:600;text-align:right}
  .ref-box{background:#f0f7f0;border:1px solid #c8e6c9;border-radius:6px;padding:16px 20px;margin:20px 0}
  .ref-label{font-size:11px;font-weight:700;color:#388e3c;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px}
  .ref-val{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:15px;font-weight:700;color:#1b5e20;letter-spacing:.03em}
  .btn{display:inline-block;background:#111;color:#fff !important;text-decoration:none;font-size:14px;font-weight:600;padding:13px 28px;border-radius:6px;margin:20px 0}
  .btn:hover{background:#333}
  .divider{border:none;border-top:1px solid #eef0f2;margin:24px 0}
  .footer{padding:20px 40px;text-align:center}
  .footer p{color:#999;font-size:11.5px;line-height:1.6;margin:0}
  .footer a{color:#777;text-decoration:underline}
  .success-icon{width:48px;height:48px;background:#f0f7f0;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:16px;font-size:22px}
`;

function shell(topBarColor: string, body: string, footerText: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>${BASE}</style>
</head>
<body>
<div class="wrap">
  <div class="card">
    <div class="top-bar" style="background:${topBarColor}"></div>
    <div class="body">
      ${body}
    </div>
    <hr class="divider" style="margin:0"/>
    <div class="footer">
      <p>${footerText}</p>
    </div>
  </div>
</div>
</body>
</html>`;
}

// ── Invoice email ──────────────────────────────────────────────────────────────
export function generateInvoiceEmailHTML(data: {
  clientName: string;
  invoiceNumber: string;
  total: string;
  dueDate: string;
  paymentReference: string;
  companyName: string;
  companyEmail: string;
  invoiceUrl?: string;
}): string {
  const body = `
    <h1>Invoice from ${data.companyName}</h1>
    <p style="margin-bottom:20px">Hi ${data.clientName},</p>
    <p>Please find your invoice details below. Kindly ensure payment is made by the due date.</p>

    <div class="info-box">
      <div class="info-row">
        <span class="lbl">Invoice Number</span>
        <span class="val">${data.invoiceNumber}</span>
      </div>
      <div class="info-row">
        <span class="lbl">Amount Due</span>
        <span class="val" style="font-size:15px;color:#111">${data.total}</span>
      </div>
      <div class="info-row">
        <span class="lbl">Due Date</span>
        <span class="val">${data.dueDate}</span>
      </div>
    </div>

    <div class="ref-box">
      <div class="ref-label">Payment Reference</div>
      <div class="ref-val">${data.paymentReference}</div>
      <p style="margin-top:8px;font-size:12px;color:#555;margin-bottom:0">Include this reference with your bank transfer so we can match your payment.</p>
    </div>

    ${data.invoiceUrl ? `<a href="${data.invoiceUrl}" class="btn">View &amp; Download Invoice →</a>` : ''}

    <p style="font-size:12.5px;color:#777;margin-top:20px">Questions about this invoice? Reply to this email or contact us at <a href="mailto:${data.companyEmail}" style="color:#444">${data.companyEmail}</a>.</p>
  `;

  return shell(
    '#2e7d32',
    body,
    `&copy; ${new Date().getFullYear()} ${data.companyName} &bull; <a href="mailto:${data.companyEmail}">${data.companyEmail}</a><br/>You received this email because an invoice was issued to you.`
  );
}

// ── Payment received ──────────────────────────────────────────────────────────
export function generatePaymentReceivedEmailHTML(data: {
  clientName: string;
  invoiceNumber: string;
  amount: string;
  companyName: string;
  companyEmail: string;
}): string {
  const body = `
    <div style="display:inline-block;width:52px;height:52px;background:#f0f7f0;border-radius:50%;text-align:center;line-height:52px;font-size:24px;margin-bottom:16px">✓</div>
    <h1>Payment Received</h1>
    <p>Hi ${data.clientName},</p>
    <p>We've received your payment. Thank you — your invoice is now settled.</p>

    <div class="info-box">
      <div class="info-row">
        <span class="lbl">Invoice</span>
        <span class="val">${data.invoiceNumber}</span>
      </div>
      <div class="info-row">
        <span class="lbl">Amount Paid</span>
        <span class="val" style="color:#2e7d32;font-size:15px">${data.amount}</span>
      </div>
      <div class="info-row">
        <span class="lbl">Status</span>
        <span class="val" style="color:#2e7d32">Paid ✓</span>
      </div>
    </div>

    <p style="font-size:12.5px;color:#777">A receipt has been recorded against your account. If you have any questions, contact us at <a href="mailto:${data.companyEmail}" style="color:#444">${data.companyEmail}</a>.</p>
  `;

  return shell(
    '#2e7d32',
    body,
    `&copy; ${new Date().getFullYear()} ${data.companyName} &bull; <a href="mailto:${data.companyEmail}">${data.companyEmail}</a>`
  );
}

// ── Password reset ────────────────────────────────────────────────────────────
export function generatePasswordResetEmailHTML(data: {
  resetLink: string;
  userName: string;
}): string {
  const body = `
    <h1>Reset Your Password</h1>
    <p>Hi ${data.userName},</p>
    <p>We received a request to reset the password for your account. Click the button below to set a new password.</p>

    <a href="${data.resetLink}" class="btn">Reset Password →</a>

    <hr class="divider"/>

    <p style="font-size:12px;color:#888">This link expires in <strong>24 hours</strong>. If you did not request a password reset, you can safely ignore this email — your password will not change.</p>
    <p style="font-size:12px;color:#aaa;margin-top:8px">If the button above doesn't work, copy and paste this URL into your browser:<br/>
    <span style="color:#555;word-break:break-all">${data.resetLink}</span></p>
  `;

  return shell(
    '#374151',
    body,
    'For security reasons, never share this link with anyone.'
  );
}

// ── Email verification ────────────────────────────────────────────────────────
export function generateVerificationEmailHTML(data: {
  verifyLink: string;
  appName?: string;
}): string {
  const app = data.appName || 'Invoxa';
  const body = `
    <div style="text-align:center;margin-bottom:28px">
      <div style="display:inline-block;width:64px;height:64px;background:#111;border-radius:50%;line-height:64px;text-align:center;font-size:28px;color:#fff;font-weight:800">I</div>
    </div>
    <h1 style="text-align:center;font-size:24px;letter-spacing:.02em">Account Confirmation</h1>
    <p style="text-align:center;margin-top:12px">Please access the link below to confirm your account.</p>

    <div style="text-align:center;margin:28px 0">
      <a href="${data.verifyLink}" target="_blank" style="display:inline-block;background:#22c55e;color:#fff !important;text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;border-radius:6px">Confirm your email.</a>
    </div>

    <p style="text-align:center;font-size:13px;color:#888">Thank you for choosing ${app}</p>
    <p style="font-size:11.5px;color:#aaa;text-align:center;margin-top:12px">If the button above doesn't work, paste this link into your browser:<br/>
    <span style="color:#555;word-break:break-all">${data.verifyLink}</span></p>
  `;

  return shell(
    '#22c55e',
    body,
    `&copy; ${new Date().getFullYear()} ${app} &bull; You received this because you created an account.`
  );
}

// ── Client OTP ────────────────────────────────────────────────────────────────
export function generateClientOTPEmailHTML(data: {
  otp: string;
  companyName: string;
}): string {
  const body = `
    <h1>Your Login Code</h1>
    <p>Use the code below to sign in to your invoice portal. It expires in <strong>10 minutes</strong>.</p>

    <div style="background:#f8f9fa;border:1px solid #e8eaec;border-radius:8px;padding:32px;text-align:center;margin:24px 0">
      <div style="font-size:40px;font-weight:800;letter-spacing:12px;color:#111;font-family:ui-monospace,SFMono-Regular,monospace">${data.otp}</div>
    </div>

    <p style="font-size:12.5px;color:#888">If you didn't request this code, you can safely ignore this email. Someone may have entered your email address by mistake.</p>
  `;

  return shell(
    '#2e7d32',
    body,
    `&copy; ${new Date().getFullYear()} ${data.companyName} &bull; This is an automated security email.`
  );
}
