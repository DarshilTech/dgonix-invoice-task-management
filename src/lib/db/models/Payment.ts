import mongoose, { Schema, Document } from 'mongoose';

export type PaymentStatus = 'pending' | 'confirmed' | 'failed';

export interface IPayment extends Document {
  tenantId: mongoose.Types.ObjectId;
  invoiceId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  paymentDate: Date;
  paymentMethod: string;
  paymentMethodId?: mongoose.Types.ObjectId;
  status: PaymentStatus;
  proofUrl?: string;
  proofType?: 'image' | 'pdf';
  referenceNumber?: string;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    invoiceId: {
      type: Schema.Types.ObjectId,
      ref: 'Invoice',
      required: true,
      index: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    paymentDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    paymentMethod: {
      type: String,
      required: true,
      trim: true,
    },
    paymentMethodId: {
      type: Schema.Types.ObjectId,
      ref: 'PaymentMethod',
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'failed'],
      default: 'pending',
      index: true,
    },
    proofUrl: String,
    proofType: {
      type: String,
      enum: ['image', 'pdf'],
    },
    referenceNumber: String,
    notes: String,
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: Date,
  },
  {
    timestamps: true,
  }
);

paymentSchema.pre('validate', function syncTenantId(next) {
  if (!this.tenantId && this.companyId) {
    this.tenantId = this.companyId;
  }

  if (!this.companyId && this.tenantId) {
    this.companyId = this.tenantId;
  }

  next();
});

paymentSchema.index({ tenantId: 1, status: 1 });
paymentSchema.index({ tenantId: 1, invoiceId: 1 });
paymentSchema.index({ tenantId: 1, clientId: 1 });

export const Payment =
  mongoose.models.Payment || mongoose.model<IPayment>('Payment', paymentSchema);
