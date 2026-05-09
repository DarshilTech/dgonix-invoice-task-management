import { z } from 'zod';

export const createClientSchema = z.object({
  tenantId:  z.string().optional(),
  companyId: z.string().min(1, 'Company is required'),

  name:           z.string().min(1, 'Client name is required'),
  number:         z.string().optional(),
  group:          z.string().optional(),
  idNumber:       z.string().optional(),
  vatNumber:      z.string().optional(),
  website:        z.string().optional(),
  phone:          z.string().optional(),
  routingId:      z.string().optional(),
  validVatNumber: z.boolean().default(false),
  taxExempt:      z.boolean().default(false),
  classification: z.string().optional(),
  status:         z.enum(['active', 'inactive']).default('active'),

  firstName:    z.string().optional(),
  lastName:     z.string().optional(),
  email:        z.string().email('Invalid email'),
  contactPhone: z.string().optional(),
  addToInvoices: z.boolean().default(true),
  ccOnly:        z.boolean().default(false),

  billingStreet:     z.string().optional(),
  billingApt:        z.string().optional(),
  billingCity:       z.string().optional(),
  billingState:      z.string().optional(),
  billingPostalCode: z.string().optional(),
  billingCountry:    z.string().optional(),

  shippingStreet:     z.string().optional(),
  shippingApt:        z.string().optional(),
  shippingCity:       z.string().optional(),
  shippingState:      z.string().optional(),
  shippingPostalCode: z.string().optional(),
  shippingCountry:    z.string().optional(),
});

export const updateClientSchema = createClientSchema.partial();

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
