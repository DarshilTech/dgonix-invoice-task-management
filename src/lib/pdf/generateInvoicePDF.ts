type InvoicePdfData = {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  paymentReference: string;
  company: any;
  client: any;
  lineItems: any[];
  subtotal: number;
  discount?: number;
  discountType?: string;
  discountAmount?: number;
  taxRate?: number;
  taxAmount?: number;
  total: number;
  totalAmount?: number;
  paidAmount?: number;
  balanceAmount?: number;
  currency: string;
  notes?: string;
  terms?: string;
  wiseInstructions?: string;
};

function money(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount || 0);
}

function fmt(date: string) {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function esc(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function addrBlock(obj: any): string {
  const street  = obj.address  || obj.billingStreet;
  const city    = obj.city     || obj.billingCity;
  const state   = obj.state    || obj.billingState;
  const zip     = obj.zip      || obj.billingZip;
  const country = obj.country  || obj.billingCountry;
  return [street, city, [state, zip].filter(Boolean).join(' '), country]
    .filter(Boolean)
    .map(esc)
    .join('<br/>');
}

export function generateInvoiceHTML(d: InvoicePdfData): string {
  const total   = d.totalAmount ?? d.total;
  const paid    = d.paidAmount ?? 0;
  const balance = d.balanceAmount ?? (total - paid);
  const hasTax      = (d.taxAmount ?? 0) > 0;
  const hasPaid     = paid > 0;
  const discAmt     = d.discountAmount ?? 0;
  const hasDiscount = discAmt > 0;
  const net         = hasDiscount ? d.subtotal + discAmt : null;

  const rows = d.lineItems.map((item) => `
    <tr>
      <td class="td-item"><div class="item-name">${esc(item.description)}</div></td>
      <td class="td-c">${esc(item.quantity)}</td>
      <td class="td-r">${money(item.unitPrice, d.currency)}</td>
      <td class="td-r td-sub">${money(item.total ?? item.unitPrice * item.quantity, d.currency)}</td>
    </tr>`).join('');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Invoice ${esc(d.invoiceNumber)}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#fff;color:#222;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:13px;line-height:1.5;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .page{max-width:794px;margin:0 auto;padding:40px 48px}

  /* LOGO */
  .logo-wrap{margin-bottom:32px}
  .logo-img{max-height:60px;max-width:180px;object-fit:contain;display:block}
  .logo-text{display:inline-block;border:1.5px solid #2563eb;color:#2563eb;font-size:13px;font-weight:700;padding:8px 20px;border-radius:4px}

  /* DETAILS ROW */
  .details-row{display:flex;gap:20px;margin-bottom:24px}
  .details-col{flex:1;border:1px solid #dde1ee;border-radius:6px;padding:18px 20px}
  .details-head{color:#2563eb;font-size:13px;font-weight:700;margin-bottom:2px}
  .details-from{font-size:9px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:.07em;margin-bottom:10px}
  .details-name{font-size:15px;font-weight:700;color:#111;margin-bottom:5px}
  .details-addr{color:#777;font-size:11px;line-height:1.75}

  /* META BAR */
  .meta-bar{display:flex;gap:40px;padding:14px 20px;background:#f8f9fb;border:1px solid #e4e7f0;border-radius:6px;margin-bottom:24px}
  .meta-item{}
  .meta-lbl{font-size:9px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:.07em;margin-bottom:3px}
  .meta-val{font-size:13px;font-weight:600;color:#111}

  /* TABLE */
  table{width:100%;border-collapse:collapse}
  thead tr{background:#f0f3fb}
  th{font-size:10.5px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:.06em;padding:11px 14px;text-align:left;border-top:1px solid #dde1ee;border-bottom:1px solid #dde1ee}
  th.th-r{text-align:right}
  th.th-c{text-align:center}
  .td-item{padding:14px;vertical-align:top}
  .item-name{font-size:13px;font-weight:600;color:#111}
  .item-note{font-size:11px;color:#888;margin-top:2px;line-height:1.5}
  .td-c{padding:14px;text-align:center;color:#555;font-size:13px;vertical-align:middle}
  .td-r{padding:14px;text-align:right;color:#555;font-size:13px;vertical-align:middle}
  .td-sub{font-weight:700;color:#111}
  tbody tr{border-bottom:1px solid #eef0f6}
  tbody tr:last-child{border-bottom:2px solid #dde1ee}

  /* SUMMARY */
  .bottom{display:flex;justify-content:flex-end;margin-top:24px}
  .summary-box{min-width:280px;border:1px solid #dde1ee;border-radius:6px;overflow:hidden}
  .summary-head{background:#f0f3fb;padding:11px 18px;font-size:11px;font-weight:700;color:#444;text-transform:uppercase;letter-spacing:.06em;text-align:center;border-bottom:1px solid #dde1ee}
  .s-row{display:flex;justify-content:space-between;padding:10px 18px;border-bottom:1px solid #f0f1f6;font-size:12.5px}
  .s-row:last-child{border-bottom:none}
  .s-row .lbl{color:#777}
  .s-row .val{font-weight:600;color:#111}
  .s-total{background:#f8f9fb}
  .s-total .lbl{font-weight:700;color:#111;font-size:13.5px}
  .s-total .val{font-weight:800;color:#111;font-size:15px}
  .s-paid .val{color:#1a7a4a}

  /* NOTES */
  .notes-section{margin-top:28px}
  .notes-lbl{font-size:9px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:.07em;margin-bottom:6px}
  .notes-text{color:#555;font-size:12px;line-height:1.7}
  .notes-text p{margin:0 0 4px}
  .notes-text p:last-child{margin:0}

  /* FOOTER */
  .footer{border-top:1px solid #eaeef5;margin-top:36px;padding-top:14px;text-align:center}
  .footer p{color:#bbb;font-size:10px}
</style>
</head>
<body>
<div class="page">

  <!-- Logo -->
  <div class="logo-wrap">
    ${d.company.logo
      ? `<img class="logo-img" src="${esc(d.company.logo)}" alt="${esc(d.company.name)}"/>`
      : `<span class="logo-text">${esc(d.company.name)}</span>`}
  </div>

  <!-- Your details / Client details -->
  <div class="details-row">
    <div class="details-col">
      <div class="details-from">FROM</div>
      <div class="details-name">${esc(d.company.name)}</div>
      <div class="details-addr">
        ${addrBlock(d.company)}
        ${d.company.email ? `<br/>${esc(d.company.email)}` : ''}
      </div>
    </div>
    <div class="details-col">
      <div class="details-from">TO</div>
      <div class="details-name">${esc(d.client.name)}</div>
      <div class="details-addr">
        ${addrBlock(d.client)}
        ${d.client.email ? `<br/>${esc(d.client.email)}` : ''}
      </div>
    </div>
  </div>

  <!-- Meta bar: invoice no / dates / currency -->
  <div class="meta-bar">
    <div class="meta-item">
      <div class="meta-lbl">Invoice No</div>
      <div class="meta-val">${esc(d.invoiceNumber)}</div>
    </div>
    <div class="meta-item">
      <div class="meta-lbl">Invoice Date</div>
      <div class="meta-val">${fmt(d.invoiceDate)}</div>
    </div>
    <div class="meta-item">
      <div class="meta-lbl">Due Date</div>
      <div class="meta-val">${fmt(d.dueDate)}</div>
    </div>
    <div class="meta-item">
      <div class="meta-lbl">Currency</div>
      <div class="meta-val">${esc(d.currency)}</div>
    </div>
  </div>

  <!-- Line items -->
  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th class="th-c">HRS / QTY</th>
        <th class="th-r">Rate</th>
        <th class="th-r">Subtotal</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <!-- Invoice Summary -->
  <div class="bottom">
    <div class="summary-box">
      <div class="summary-head">Invoice Summary</div>
      ${net !== null ? `<div class="s-row"><span class="lbl">Net</span><span class="val">${money(net, d.currency)}</span></div>` : ''}
      ${hasDiscount ? `<div class="s-row"><span class="lbl">Discount${d.discountType === 'Percent' ? ` (${d.discount}%)` : ''}</span><span class="val" style="color:#c0392b">− ${money(discAmt, d.currency)}</span></div>` : ''}
      <div class="s-row"><span class="lbl">Subtotal</span><span class="val">${money(d.subtotal, d.currency)}</span></div>
      ${hasTax ? `<div class="s-row"><span class="lbl">Tax${d.taxRate ? ` (${d.taxRate}%)` : ''}</span><span class="val">${money(d.taxAmount ?? 0, d.currency)}</span></div>` : ''}
      ${hasPaid ? `<div class="s-row s-paid"><span class="lbl">Paid</span><span class="val">− ${money(paid, d.currency)}</span></div>` : ''}
      <div class="s-row s-total"><span class="lbl">Total</span><span class="val">${money(balance, d.currency)}</span></div>
    </div>
  </div>

  <!-- Notes / Terms -->
  ${(d.notes || d.terms) ? `
  <div class="notes-section">
    ${d.notes ? `<div class="notes-lbl">Notes</div><div class="notes-text">${d.notes}</div>` : ''}
    ${d.terms ? `<div class="notes-lbl" style="margin-top:${d.notes ? '14px' : '0'}">Terms &amp; Conditions</div><div class="notes-text">${d.terms}</div>` : ''}
  </div>` : ''}

  <!-- Footer -->
  <div class="footer">
    <p>Thank you for your business &mdash; ${esc(d.company.name)}${d.company.email ? ' &bull; ' + esc(d.company.email) : ''}</p>
  </div>

</div>
</body>
</html>`;
}

async function generateWithPuppeteer(html: string): Promise<Buffer | null> {
  try {
    let executablePath: string | undefined;
    let launchArgs: string[] = ['--no-sandbox', '--disable-setuid-sandbox'];

    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      // Local / VPS with Chrome installed
      executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    } else {
      // Serverless (Vercel / Lambda) — use bundled Chromium
      const chromium = await import('@sparticuz/chromium');
      executablePath = await chromium.default.executablePath();
      launchArgs = [...launchArgs, ...chromium.default.args];
    }

    const puppeteer = await import('puppeteer-core');
    const browser = await puppeteer.launch({
      args: launchArgs,
      executablePath,
      headless: true,
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });
    await browser.close();
    return Buffer.from(pdf);
  } catch {
    return null;
  }
}

export async function generateInvoicePDF(invoiceData: InvoicePdfData): Promise<Buffer> {
  const html = generateInvoiceHTML(invoiceData);
  const pdf = await generateWithPuppeteer(html);
  if (!pdf) {
    throw new Error(
      'PDF generation failed: Puppeteer/Chrome is not available. ' +
      'Set PUPPETEER_EXECUTABLE_PATH to a valid Chrome/Chromium binary.'
    );
  }
  return pdf;
}
