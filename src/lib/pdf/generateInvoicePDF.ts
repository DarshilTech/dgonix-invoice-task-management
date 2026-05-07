import PDFDocument from 'pdfkit';

type InvoicePdfData = {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  paymentReference: string;
  company: any;
  client: any;
  lineItems: any[];
  subtotal: number;
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
  return [obj.address, obj.city, [obj.state, obj.zip].filter(Boolean).join(' '), obj.country]
    .filter(Boolean)
    .map(esc)
    .join('<br/>');
}

export function generateInvoiceHTML(d: InvoicePdfData): string {
  const total   = d.totalAmount ?? d.total;
  const paid    = d.paidAmount ?? 0;
  const balance = d.balanceAmount ?? (total - paid);
  const hasTax  = (d.taxAmount ?? 0) > 0;
  const hasPaid = paid > 0;

  const rows = d.lineItems.map((item, i) => `
    <tr style="background:${i % 2 === 1 ? '#fafafa' : '#fff'}">
      <td class="td-desc">${esc(item.description)}</td>
      <td class="td-c">${esc(item.quantity)}</td>
      <td class="td-r">${money(item.unitPrice, d.currency)}</td>
      <td class="td-r td-amt">${money(item.total, d.currency)}</td>
    </tr>`).join('');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Invoice ${esc(d.invoiceNumber)}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{
    background:#fff;
    color:#222;
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;
    font-size:13px;
    line-height:1.5;
    -webkit-print-color-adjust:exact;
    print-color-adjust:exact;
  }
  .page{max-width:794px;margin:0 auto;padding:48px 56px}

  /* TOP BAR */
  .top-bar{height:5px;background:#2e7d32;border-radius:2px;margin-bottom:36px}

  /* HEADER */
  .hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px}
  .hdr-left{}
  .logo-img{max-height:64px;max-width:180px;object-fit:contain;display:block;margin-bottom:10px}
  .company-name{font-size:17px;font-weight:700;color:#111;margin-bottom:2px}
  .company-addr{color:#555;font-size:11.5px;line-height:1.6}
  .hdr-right{text-align:right}
  .hdr-right .contact-row{color:#444;font-size:11.5px;line-height:1.8}
  .hdr-right .contact-row b{color:#111}
  .invoice-word{font-size:30px;font-weight:800;color:#111;letter-spacing:1px;margin-bottom:4px}

  /* INFO BAND */
  .info-band{background:#f5f6f7;border:1px solid #e4e6e8;border-radius:4px;display:flex;margin-bottom:28px;overflow:hidden}
  .info-col{flex:1;padding:16px 18px}
  .info-col+.info-col{border-left:1px solid #e4e6e8}
  .info-label{font-size:10px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.07em;margin-bottom:6px}
  .info-val{font-size:12.5px;color:#222;line-height:1.55}
  .info-val b{color:#111;font-weight:600}

  /* TABLE */
  .tbl-wrap{margin-bottom:0}
  table{width:100%;border-collapse:collapse}
  thead tr{background:#f5f6f7;border-top:1px solid #dde0e3;border-bottom:1px solid #dde0e3}
  th{font-size:11px;font-weight:700;color:#555;letter-spacing:.06em;padding:10px 12px;text-align:left;text-transform:uppercase}
  th.th-r{text-align:right}
  th.th-c{text-align:center}
  .td-desc{padding:12px;color:#222;font-size:12.5px;max-width:300px}
  .td-c{padding:12px;text-align:center;color:#555;font-size:12.5px}
  .td-r{padding:12px;text-align:right;color:#444;font-size:12.5px}
  .td-amt{color:#111;font-weight:600}
  tbody tr{border-bottom:1px solid #eef0f2}

  /* BOTTOM: NOTES + TOTALS */
  .bottom{display:flex;justify-content:space-between;align-items:flex-start;margin-top:24px;gap:32px;border-top:1px solid #dde0e3;padding-top:20px}
  .notes-wrap{flex:1;min-width:0}
  .notes-label{font-size:10px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.07em;margin-bottom:6px}
  .notes-text{color:#555;font-size:12px;line-height:1.65}

  /* TOTALS */
  .totals{min-width:240px}
  .t-row{display:flex;justify-content:space-between;font-size:12.5px;padding:5px 0;color:#444}
  .t-row .lbl{color:#666}
  .t-sep{border:none;border-top:1px solid #dde0e3;margin:8px 0}
  .t-total-row{display:flex;justify-content:space-between;align-items:baseline;padding:10px 0 0}
  .t-total-row .lbl{font-size:15px;font-weight:700;color:#111}
  .t-total-row .val{font-size:22px;font-weight:800;color:#111}
  .paid-row .val{color:#2e7d32;font-weight:600}

  /* PAYMENT REF */
  .ref-box{background:#f0f7f0;border:1px solid #c8e6c9;border-radius:4px;margin-top:24px;padding:16px 18px}
  .ref-label{font-size:10px;font-weight:700;color:#388e3c;text-transform:uppercase;letter-spacing:.07em;margin-bottom:6px}
  .ref-val{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:14px;font-weight:700;color:#1b5e20;letter-spacing:.04em;margin-bottom:4px}
  .ref-note{font-size:11px;color:#555;line-height:1.5}

  /* FOOTER */
  .footer{border-top:1px solid #e4e6e8;margin-top:32px;padding-top:14px;text-align:center}
  .footer p{color:#aaa;font-size:10.5px}
</style>
</head>
<body>
<div class="page">

  <div class="top-bar"></div>

  <!-- Header -->
  <div class="hdr">
    <div class="hdr-left">
      ${d.company.logo ? `<img class="logo-img" src="${esc(d.company.logo)}" alt="${esc(d.company.name)}"/>` : ''}
      <div class="company-name">${esc(d.company.name)}</div>
      <div class="company-addr">${addrBlock(d.company)}</div>
    </div>
    <div class="hdr-right">
      <div class="invoice-word">INVOICE</div>
      ${d.company.email ? `<div class="contact-row"><b>Email</b> ${esc(d.company.email)}</div>` : ''}
      ${d.company.website ? `<div class="contact-row"><b>Web</b> ${esc(d.company.website)}</div>` : ''}
    </div>
  </div>

  <!-- Info band: Bill To | Invoice Details -->
  <div class="info-band">
    <div class="info-col">
      <div class="info-label">Bill To</div>
      <div class="info-val">
        <b>${esc(d.client.name)}</b><br/>
        ${d.client.email ? esc(d.client.email) + '<br/>' : ''}
        ${addrBlock(d.client)}
      </div>
    </div>
    <div class="info-col" style="max-width:200px">
      <div class="info-label">Invoice Details</div>
      <div class="info-val">
        <b>Invoice #</b> ${esc(d.invoiceNumber)}<br/>
        <b>Date</b> ${fmt(d.invoiceDate)}<br/>
        <b>Due Date</b> ${fmt(d.dueDate)}<br/>
        <b>Currency</b> ${esc(d.currency)}
      </div>
    </div>
  </div>

  <!-- Line items -->
  <div class="tbl-wrap">
    <table>
      <thead>
        <tr>
          <th>Product / Service</th>
          <th class="th-c">Qty</th>
          <th class="th-r">Rate</th>
          <th class="th-r">Amount</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>

  <!-- Bottom: notes left, totals right -->
  <div class="bottom">
    <div class="notes-wrap">
      ${(d.notes || d.terms) ? `
        ${d.notes ? `<div class="notes-label">Notes</div><div class="notes-text">${esc(d.notes)}</div>` : ''}
        ${d.terms ? `<div class="notes-label" style="margin-top:12px">Terms</div><div class="notes-text">${esc(d.terms)}</div>` : ''}
      ` : '<div></div>'}
    </div>

    <div class="totals">
      <div class="t-row">
        <span class="lbl">Subtotal</span>
        <span>${money(d.subtotal, d.currency)}</span>
      </div>
      ${hasTax ? `<div class="t-row">
        <span class="lbl">Tax${d.taxRate ? ` (${d.taxRate}%)` : ''}</span>
        <span>${money(d.taxAmount ?? 0, d.currency)}</span>
      </div>` : ''}
      ${hasPaid ? `<div class="t-row paid-row">
        <span class="lbl">Paid</span>
        <span class="val">− ${money(paid, d.currency)}</span>
      </div>` : ''}
      <hr class="t-sep"/>
      <div class="t-total-row">
        <span class="lbl">Total</span>
        <span class="val">${money(balance, d.currency)}</span>
      </div>
    </div>
  </div>

  <!-- Payment reference -->
  <div class="ref-box">
    <div class="ref-label">Payment Reference</div>
    <div class="ref-val">${esc(d.paymentReference)}</div>
    <div class="ref-note">Please include this reference with your payment.${d.wiseInstructions || d.company.wiseTransferRef ? ' ' + esc(d.wiseInstructions || d.company.wiseTransferRef) : ''}</div>
  </div>

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
    const load = new Function('specifier', 'return import(specifier)') as (
      specifier: string
    ) => Promise<any>;
    const puppeteer = await load('puppeteer');
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
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

function generateFallbackPDF(d: InvoicePdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 56, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const total   = d.totalAmount ?? d.total;
    const paid    = d.paidAmount ?? 0;
    const balance = d.balanceAmount ?? (total - paid);
    const L = 56, R = 539, W = R - L;

    // Green top bar
    doc.rect(0, 0, 595, 5).fill('#2e7d32');

    // Company name top-left
    doc.fillColor('#111').fontSize(14).font('Helvetica-Bold').text(d.company.name, L, 32);
    const compAddr = [d.company.address, d.company.city, d.company.country].filter(Boolean).join(', ');
    doc.fillColor('#555').fontSize(9).font('Helvetica').text(compAddr, L, 50, { width: 240 });

    // INVOICE top-right
    doc.fillColor('#111').fontSize(22).font('Helvetica-Bold').text('INVOICE', 350, 32, { align: 'right', width: 189 });
    if (d.company.email) {
      doc.fillColor('#555').fontSize(9).font('Helvetica').text(d.company.email, 350, 58, { align: 'right', width: 189 });
    }

    // Info band
    const bandY = 95;
    doc.rect(L, bandY, W, 72).fill('#f5f6f7').stroke('#e4e6e8');

    // Bill To
    doc.fillColor('#888').fontSize(8).font('Helvetica-Bold').text('BILL TO', L + 12, bandY + 10);
    doc.fillColor('#111').fontSize(10).font('Helvetica-Bold').text(d.client.name, L + 12, bandY + 22);
    const cliAddr = [d.client.address, d.client.city, d.client.country].filter(Boolean).join(', ');
    doc.fillColor('#555').fontSize(8.5).font('Helvetica').text(cliAddr, L + 12, bandY + 36, { width: 190 });

    // Invoice details
    const detX = 370;
    doc.fillColor('#888').fontSize(8).font('Helvetica-Bold').text('INVOICE DETAILS', detX, bandY + 10);
    doc.fillColor('#555').fontSize(9).font('Helvetica');
    doc.text(`Invoice #  ${d.invoiceNumber}`, detX, bandY + 22, { width: 160 });
    doc.text(`Date       ${new Date(d.invoiceDate).toLocaleDateString()}`, detX, bandY + 34);
    doc.text(`Due        ${new Date(d.dueDate).toLocaleDateString()}`, detX, bandY + 46);

    // Table header
    const tY = bandY + 86;
    doc.rect(L, tY, W, 22).fill('#f5f6f7').stroke('#dde0e3');
    doc.fillColor('#666').fontSize(8.5).font('Helvetica-Bold');
    doc.text('PRODUCT / SERVICE', L + 10, tY + 7);
    doc.text('QTY', 330, tY + 7, { width: 40, align: 'center' });
    doc.text('RATE', 380, tY + 7, { width: 70, align: 'right' });
    doc.text('AMOUNT', 458, tY + 7, { width: 76, align: 'right' });

    let rowY = tY + 26;
    d.lineItems.forEach((item, i) => {
      if (i % 2 === 1) doc.rect(L, rowY - 4, W, 20).fill('#fafafa');
      doc.fillColor('#222').fontSize(9).font('Helvetica').text(item.description, L + 10, rowY, { width: 265 });
      doc.fillColor('#666').text(String(item.quantity), 330, rowY, { width: 40, align: 'center' });
      doc.fillColor('#444').text(money(item.unitPrice, d.currency), 380, rowY, { width: 70, align: 'right' });
      doc.fillColor('#111').font('Helvetica-Bold').text(money(item.total, d.currency), 458, rowY, { width: 76, align: 'right' });
      doc.moveTo(L, rowY + 14).lineTo(R, rowY + 14).lineWidth(0.4).strokeColor('#eef0f2').stroke();
      rowY += 22;
    });

    // Totals (right-aligned)
    const totX = 380, totW = 155;
    doc.moveTo(L, rowY + 6).lineTo(R, rowY + 6).lineWidth(0.5).strokeColor('#dde0e3').stroke();
    let totY = rowY + 16;

    doc.fillColor('#666').fontSize(9).font('Helvetica');
    doc.text('Subtotal', totX, totY, { width: totW, align: 'right' });
    doc.fillColor('#333').text(money(d.subtotal, d.currency), totX, totY, { width: totW, align: 'right' });
    totY += 16;

    if ((d.taxAmount ?? 0) > 0) {
      doc.fillColor('#666').text(`Tax${d.taxRate ? ` (${d.taxRate}%)` : ''}`, totX, totY, { width: totW, align: 'right' });
      doc.fillColor('#333').text(money(d.taxAmount ?? 0, d.currency), totX + 60, totY, { width: totW - 60, align: 'right' });
      totY += 16;
    }

    if (paid > 0) {
      doc.fillColor('#666').text('Paid', totX, totY, { width: totW, align: 'right' });
      doc.fillColor('#2e7d32').font('Helvetica-Bold').text(`− ${money(paid, d.currency)}`, totX, totY, { width: totW, align: 'right' });
      totY += 16;
    }

    doc.moveTo(totX, totY + 2).lineTo(R, totY + 2).lineWidth(0.5).strokeColor('#dde0e3').stroke();
    totY += 10;
    doc.fillColor('#111').fontSize(13).font('Helvetica-Bold').text('Total', totX, totY, { width: totW, align: 'right' });
    doc.text(money(balance, d.currency), totX + 10, totY, { width: totW - 10, align: 'right' });

    // Notes (left side)
    if (d.notes) {
      doc.fillColor('#888').fontSize(8).font('Helvetica-Bold').text('NOTES', L, rowY + 16);
      doc.fillColor('#555').fontSize(9).font('Helvetica').text(d.notes, L, rowY + 28, { width: 240 });
    }

    // Payment reference
    const refY = totY + 44;
    doc.rect(L, refY, W, 48).fill('#f0f7f0').stroke('#c8e6c9');
    doc.fillColor('#388e3c').fontSize(8).font('Helvetica-Bold').text('PAYMENT REFERENCE', L + 12, refY + 10);
    doc.fillColor('#1b5e20').fontSize(12).font('Helvetica-Bold').text(d.paymentReference, L + 12, refY + 24);

    // Footer
    const footY = (doc.page.height as number) - 36;
    doc.moveTo(L, footY).lineTo(R, footY).lineWidth(0.5).strokeColor('#e4e6e8').stroke();
    doc.fillColor('#aaa').fontSize(9).font('Helvetica')
      .text(`Thank you for your business — ${d.company.name}`, L, footY + 8, { align: 'center', width: W });

    doc.end();
  });
}

export async function generateInvoicePDF(invoiceData: InvoicePdfData): Promise<Buffer> {
  const html = generateInvoiceHTML(invoiceData);
  const puppeteerPdf = await generateWithPuppeteer(html);
  return puppeteerPdf || generateFallbackPDF(invoiceData);
}
