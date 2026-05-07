import { z } from 'zod';

export const createClientSchema = z.object({
  tenantId: z.string().optional(),
  companyId: z.string().min(1, 'Company is required'),
  name: z.string().min(1, 'Client name is required'),
  email: z.string().email('Invalid email'),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zip: z.string().min(1, 'Zip is required'),
  country: z.string().min(1, 'Country is required'),
  taxId: z.string().optional(),
  portalAccess: z.boolean().default(true),
});

export const updateClientSchema = createClientSchema.partial();

export const createClientUserSchema = z.object({
  email: z.string().email('Invalid email'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type CreateClientUserInput = z.infer<typeof createClientUserSchema>;
