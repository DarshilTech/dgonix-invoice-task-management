import mongoose, { Schema, Document } from 'mongoose';

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  tax?: number;
  total: number;
}

export interface IInvoice extends Document {
  tenantId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  paymentReference: string;
  status: 'draft' | 'sent' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';
  lineItems: LineItem[];
  discount?: number;
  discountType?: 'Amount' | 'Percent';
  discountAmount?: number;
  partial?: number;
  poNumber?: string;
  subtotal: number;
  taxRate?: number;
  taxAmount?: number;
  total: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  currency: string;
  notes?: string;
  terms?: string;
  wiseInstructions?: string;
  sentAt?: Date;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const lineItemSchema = new Schema(
  {
    description: String,
    quantity: Number,
    unitPrice: Number,
    tax: Number,
    total: Number,
  },
  { _id: false }
);

const invoiceSchema = new Schema<IInvoice>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
    },
    invoiceDate: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    paymentReference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled'],
      default: 'draft',
      index: true,
    },
    lineItems: [lineItemSchema],
    discount:       { type: Number, default: 0 },
    discountType:   { type: String, enum: ['Amount', 'Percent'], default: 'Amount' },
    discountAmount: { type: Number, default: 0 },
    partial:        { type: Number, default: 0 },
    poNumber:       String,
    subtotal: {
      type: Number,
      required: true,
    },
    taxRate: Number,
    taxAmount: Number,
    total: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    balanceAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    notes: String,
    terms: String,
    wiseInstructions: String,
    sentAt: Date,
    paidAt: Date,
  },
  {
    timestamps: true,
  }
);

// Compound index for queries
invoiceSchema.pre('validate', function syncTenantAndBalances(next) {
  if (!this.tenantId && this.companyId) {
    this.tenantId = this.companyId;
  }

  if (!this.companyId && this.tenantId) {
    this.companyId = this.tenantId;
  }

  if (this.totalAmount === undefined || this.totalAmount === null) {
    this.totalAmount = this.total;
  }

  if (this.total === undefined || this.total === null) {
    this.total = this.totalAmount;
  }

  if (this.paidAmount === undefined || this.paidAmount === null) {
    this.paidAmount = 0;
  }

  this.balanceAmount = Math.max(0, Math.round((this.totalAmount - this.paidAmount) * 100) / 100);
  next();
});

invoiceSchema.index({ tenantId: 1, invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ tenantId: 1, status: 1 });
invoiceSchema.index({ tenantId: 1, clientId: 1 });
invoiceSchema.index({ companyId: 1, status: 1 });
invoiceSchema.index({ clientId: 1, status: 1 });

export const Invoice =
  mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', invoiceSchema);
