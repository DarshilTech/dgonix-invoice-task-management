import { z } from 'zod';

export const companySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  email: z.string().email('Invalid company email'),
  phone: z.string().optional(),
  website: z.string().optional(),
  address: z.string().min(1, 'Address is required').default('To be updated'),
  city: z.string().min(1, 'City is required').default('To be updated'),
  state: z.string().min(1, 'State is required').default('To be updated'),
  zip: z.string().min(1, 'Zip is required').default('To be updated'),
  country: z.string().min(1, 'Country is required').default('To be updated'),
  logo: z.string().optional(),
  taxId: z.string().optional(),
  businessNumber: z.string().optional(),
  wiseAccountEmail: z.string().optional(),
  wiseTransferRef: z.string().optional(),
  smtpHost: z.string().optional(),
  smtpPort: z.number().optional(),
  smtpUser: z.string().optional(),
  smtpPass: z.string().optional(),
  fromEmail: z.string().email('Invalid from email').optional(),
  invoicePrefix: z.string().min(1).default('INV'),
});

export const updateCompanySchema = companySchema.partial();

export type CompanyInput = z.infer<typeof companySchema>;
