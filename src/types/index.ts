export type UserRole = 'admin' | 'client';
export type InvoiceStatus = 'draft' | 'sent' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';
export type PaymentStatus = 'pending' | 'confirmed' | 'failed';

export interface User {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  companyIds?: string[];
  clientId?: string;
  companyId?: string;
  emailVerified: boolean;
}

export interface Company {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  logo?: string;
  taxId?: string;
  fromEmail: string;
  invoicePrefix: string;
}

export interface Client {
  id: string;
  tenantId: string;
  companyId: string;
  name: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  status: 'active' | 'inactive';
}

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  tax?: number;
  total: number;
}

export interface Invoice {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  clientId: string;
  invoiceDate: string;
  dueDate: string;
  paymentReference: string;
  status: InvoiceStatus;
  lineItems: LineItem[];
  subtotal: number;
  taxRate?: number;
  taxAmount?: number;
  total: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  currency: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  tenantId: string;
  invoiceId: string;
  clientId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  status: PaymentStatus;
  proofUrl?: string;
  notes?: string;
  createdAt: string;
}

export interface PaymentMethod {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}
