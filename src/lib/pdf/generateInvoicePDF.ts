import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { InvoicePDFTemplate, type InvoicePdfData } from './InvoicePDFTemplate';

export type { InvoicePdfData };

export async function generateInvoicePDF(invoiceData: InvoicePdfData): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.createElement(InvoicePDFTemplate, { data: invoiceData }) as any;
  const buffer = await renderToBuffer(element);
  return Buffer.from(buffer);
}
