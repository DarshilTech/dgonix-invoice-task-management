import { z } from 'zod';

const dateInput = z.union([z.string().min(1), z.date()]);

export const lineItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().positive('Quantity must be positive'),
  unitPrice: z.number().positive('Unit price must be positive'),
  tax: z.number().optional(),
});

export const createInvoiceSchema = z.object({
  tenantId: z.string().optional(),
  companyId: z.string().min(1, 'Company is required'),
  clientId: z.string().min(1, 'Client is required'),
  invoiceDate: dateInput,
  dueDate: dateInput,
  lineItems: z.array(lineItemSchema).min(1, 'At least one line item is required'),
  taxRate: z.number().optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  currency: z.string().default('USD'),
  status: z.enum(['draft', 'sent']).default('draft'),
});

export const updateInvoiceSchema = createInvoiceSchema.partial();

export type LineItemInput = z.infer<typeof lineItemSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
