import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from '@react-pdf/renderer';

export type InvoicePdfData = {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  paymentReference: string;
  company: {
    name: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    logo?: string;
    website?: string;
    wiseTransferRef?: string;
  };
  client: {
    name: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total?: number;
  }>;
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

// ─── helpers ────────────────────────────────────────────────────────────────

function money(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount || 0);
  } catch {
    return `${currency} ${(amount || 0).toFixed(2)}`;
  }
}

function fmt(date: string) {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function stripHtml(html: string | undefined): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function addrLines(obj: { address?: string; city?: string; state?: string; zip?: string; country?: string }): string {
  const city = obj.city || '';
  const stateZip = [obj.state, obj.zip].filter(Boolean).join(' ');
  return [obj.address, city, stateZip, obj.country].filter(Boolean).join('\n');
}

// ─── colours ────────────────────────────────────────────────────────────────

const BLUE   = '#2563eb';
const BORDER = '#dde1ee';
const LIGHT  = '#f0f3fb';
const MUTED  = '#aaaaaa';
const DARK   = '#111827';
const GRAY   = '#777777';
const GREEN  = '#1a7a4a';
const RED    = '#c0392b';
const BG     = '#f8f9fb';

// ─── styles ─────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#374151',
    paddingTop: 40,
    paddingBottom: 40,
    paddingLeft: 48,
    paddingRight: 48,
  },

  // Logo
  logoWrap: { marginBottom: 28 },
  logoImg:  { maxHeight: 56, maxWidth: 160 },
  logoBadge: {
    borderWidth: 1.5,
    borderColor: BLUE,
    color: BLUE,
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 18,
    paddingRight: 18,
    alignSelf: 'flex-start',
  },

  // Detail cards row
  cardsRow:  { flexDirection: 'row', marginBottom: 20 },
  card:      {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
    paddingTop: 14,
    paddingBottom: 14,
    paddingLeft: 16,
    paddingRight: 16,
  },
  cardGap:   { marginRight: 12 },
  cardFrom:  {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  cardName:  { fontSize: 13, fontFamily: 'Helvetica-Bold', color: DARK, marginBottom: 4 },
  cardAddr:  { fontSize: 9.5,  color: GRAY, lineHeight: 1.7 },

  // Meta bar
  metaBar:  {
    flexDirection: 'row',
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 16,
    paddingRight: 16,
    backgroundColor: LIGHT,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
    marginBottom: 22,
  },
  metaItem:  { marginRight: 36 },
  metaLbl:   {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  metaVal:   { fontSize: 11, fontFamily: 'Helvetica-Bold', color: DARK },

  // Table
  tableWrap:  { marginBottom: 22 },
  thead:      {
    flexDirection: 'row',
    backgroundColor: LIGHT,
    paddingTop: 9,
    paddingBottom: 9,
    paddingLeft: 12,
    paddingRight: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: BORDER,
  },
  th: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#666666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  trow: {
    flexDirection: 'row',
    paddingTop: 11,
    paddingBottom: 11,
    paddingLeft: 12,
    paddingRight: 12,
    borderBottomWidth: 1,
    borderColor: '#eef0f6',
  },
  trowLast: { borderBottomWidth: 2, borderColor: BORDER },

  colItem: { flex: 1 },
  colQty:  { width: 64 },
  colRate: { width: 76 },
  colSub:  { width: 84 },

  itemName: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: DARK },
  cellText: { fontSize: 10.5, color: '#555555' },
  cellBold: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: DARK },

  // Invoice Summary
  summaryOuter: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 24 },
  summaryBox: {
    width: 260,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
  },
  summaryHead: {
    backgroundColor: LIGHT,
    paddingTop: 9,
    paddingBottom: 9,
    paddingLeft: 16,
    paddingRight: 16,
    borderBottomWidth: 1,
    borderColor: BORDER,
  },
  summaryHeadTxt: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: '#444444',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  sRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 16,
    paddingRight: 16,
    borderBottomWidth: 1,
    borderColor: '#f0f1f6',
  },
  sRowLast:  { borderBottomWidth: 0 },
  sTotalRow: { backgroundColor: BG },
  sLbl:      { fontSize: 11, color: GRAY },
  sVal:      { fontSize: 11, fontFamily: 'Helvetica-Bold', color: DARK },
  sTotalLbl: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: DARK },
  sTotalVal: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: DARK },

  // Notes / Terms
  notesSec:  { marginTop: 24 },
  notesLbl:  {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 5,
  },
  notesTxt:  { fontSize: 10, color: '#555555', lineHeight: 1.65 },

  // Footer
  footer:    {
    borderTopWidth: 1,
    borderColor: '#eaeef5',
    marginTop: 32,
    paddingTop: 12,
  },
  footerTxt: { fontSize: 9, color: '#bbbbbb', textAlign: 'center' },
});

// ─── component ──────────────────────────────────────────────────────────────

export function InvoicePDFTemplate({ data: d }: { data: InvoicePdfData }) {
  const total      = d.totalAmount ?? d.total;
  const paid       = d.paidAmount ?? 0;
  const balance    = d.balanceAmount ?? (total - paid);
  const discAmt    = d.discountAmount ?? 0;
  const hasDisc    = discAmt > 0;
  const hasTax     = (d.taxAmount ?? 0) > 0;
  const hasPaid    = paid > 0;
  const net        = hasDisc ? d.subtotal + discAmt : null;

  const companyAddr = addrLines(d.company);
  const clientAddr  = addrLines(d.client);

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* ── Logo ── */}
        <View style={s.logoWrap}>
          {d.company.logo
            ? <Image src={d.company.logo} style={s.logoImg} />
            : <Text style={s.logoBadge}>{d.company.name}</Text>}
        </View>

        {/* ── From / To ── */}
        <View style={s.cardsRow}>
          <View style={[s.card, s.cardGap]}>
            <Text style={s.cardFrom}>FROM</Text>
            <Text style={s.cardName}>{d.company.name}</Text>
            <Text style={s.cardAddr}>
              {[companyAddr, d.company.email].filter(Boolean).join('\n')}
            </Text>
          </View>
          <View style={s.card}>
            <Text style={s.cardFrom}>TO</Text>
            <Text style={s.cardName}>{d.client.name}</Text>
            <Text style={s.cardAddr}>
              {[clientAddr, d.client.email].filter(Boolean).join('\n')}
            </Text>
          </View>
        </View>

        {/* ── Meta bar ── */}
        <View style={s.metaBar}>
          <View style={s.metaItem}>
            <Text style={s.metaLbl}>Invoice No</Text>
            <Text style={s.metaVal}>{d.invoiceNumber}</Text>
          </View>
          <View style={s.metaItem}>
            <Text style={s.metaLbl}>Invoice Date</Text>
            <Text style={s.metaVal}>{fmt(d.invoiceDate)}</Text>
          </View>
          <View style={s.metaItem}>
            <Text style={s.metaLbl}>Due Date</Text>
            <Text style={s.metaVal}>{fmt(d.dueDate)}</Text>
          </View>
          <View style={s.metaItem}>
            <Text style={s.metaLbl}>Currency</Text>
            <Text style={s.metaVal}>{d.currency}</Text>
          </View>
        </View>

        {/* ── Line items table ── */}
        <View style={s.tableWrap}>
          {/* Header */}
          <View style={s.thead}>
            <View style={s.colItem}><Text style={s.th}>Item</Text></View>
            <View style={s.colQty}><Text style={[s.th, { textAlign: 'center' }]}>HRS / QTY</Text></View>
            <View style={s.colRate}><Text style={[s.th, { textAlign: 'right' }]}>Rate</Text></View>
            <View style={s.colSub}><Text style={[s.th, { textAlign: 'right' }]}>Subtotal</Text></View>
          </View>
          {/* Rows */}
          {d.lineItems.map((item, i) => (
            <View
              key={i}
              style={[s.trow, i === d.lineItems.length - 1 ? s.trowLast : {}]}
            >
              <View style={s.colItem}>
                <Text style={s.itemName}>{item.description}</Text>
              </View>
              <View style={s.colQty}>
                <Text style={[s.cellText, { textAlign: 'center' }]}>{item.quantity}</Text>
              </View>
              <View style={s.colRate}>
                <Text style={[s.cellText, { textAlign: 'right' }]}>{money(item.unitPrice, d.currency)}</Text>
              </View>
              <View style={s.colSub}>
                <Text style={[s.cellBold, { textAlign: 'right' }]}>
                  {money(item.total ?? item.unitPrice * item.quantity, d.currency)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Invoice Summary ── */}
        <View style={s.summaryOuter}>
          <View style={s.summaryBox}>
            <View style={s.summaryHead}>
              <Text style={s.summaryHeadTxt}>Invoice Summary</Text>
            </View>

            {net !== null && (
              <View style={s.sRow}>
                <Text style={s.sLbl}>Net</Text>
                <Text style={s.sVal}>{money(net, d.currency)}</Text>
              </View>
            )}
            {hasDisc && (
              <View style={s.sRow}>
                <Text style={s.sLbl}>
                  Discount{d.discountType === 'Percent' ? ` (${d.discount}%)` : ''}
                </Text>
                <Text style={[s.sVal, { color: RED }]}>− {money(discAmt, d.currency)}</Text>
              </View>
            )}
            <View style={s.sRow}>
              <Text style={s.sLbl}>Subtotal</Text>
              <Text style={s.sVal}>{money(d.subtotal, d.currency)}</Text>
            </View>
            {hasTax && (
              <View style={s.sRow}>
                <Text style={s.sLbl}>Tax{d.taxRate ? ` (${d.taxRate}%)` : ''}</Text>
                <Text style={s.sVal}>{money(d.taxAmount ?? 0, d.currency)}</Text>
              </View>
            )}
            {hasPaid && (
              <View style={s.sRow}>
                <Text style={s.sLbl}>Paid</Text>
                <Text style={[s.sVal, { color: GREEN }]}>− {money(paid, d.currency)}</Text>
              </View>
            )}
            <View style={[s.sRow, s.sTotalRow, s.sRowLast]}>
              <Text style={s.sTotalLbl}>Total</Text>
              <Text style={s.sTotalVal}>{money(balance, d.currency)}</Text>
            </View>
          </View>
        </View>

        {/* ── Notes / Terms ── */}
        {(d.notes || d.terms) && (
          <View style={s.notesSec}>
            {d.notes && (
              <View style={d.terms ? { marginBottom: 14 } : {}}>
                <Text style={s.notesLbl}>Notes</Text>
                <Text style={s.notesTxt}>{stripHtml(d.notes)}</Text>
              </View>
            )}
            {d.terms && (
              <View>
                <Text style={s.notesLbl}>Terms &amp; Conditions</Text>
                <Text style={s.notesTxt}>{stripHtml(d.terms)}</Text>
              </View>
            )}
          </View>
        )}

        {/* ── Footer ── */}
        <View style={s.footer}>
          <Text style={s.footerTxt}>
            {'Thank you for your business — '}
            {d.company.name}
            {d.company.email ? ' • ' + d.company.email : ''}
          </Text>
        </View>

      </Page>
    </Document>
  );
}
