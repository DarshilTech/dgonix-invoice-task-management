import { z } from 'zod';

export const createPaymentSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice is required'),
  amount: z.number().positive('Amount must be positive').optional(),
  paymentDate: z.union([z.string().min(1), z.date()]).optional(),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  paymentMethodId: z.string().optional(),
  proofUrl: z.string().optional(),
  proofType: z.enum(['image', 'pdf']).optional(),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['pending', 'confirmed']).optional(),
});

export const updatePaymentSchema = createPaymentSchema
  .omit({ invoiceId: true })
  .extend({
    status: z.enum(['pending', 'confirmed', 'failed']).optional(),
  })
  .partial();

export const verifyPaymentSchema = z.object({
  paymentId: z.string().min(1, 'Payment is required'),
  status: z.enum(['confirmed', 'failed']),
  notes: z.string().optional(),
});

export const paymentMethodSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const updatePaymentMethodSchema = paymentMethodSchema.partial();

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type PaymentMethodInput = z.infer<typeof paymentMethodSchema>;
