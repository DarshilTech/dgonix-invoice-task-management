import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentMethod extends Document {
  tenantId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const paymentMethodSchema = new Schema<IPaymentMethod>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

paymentMethodSchema.index({ tenantId: 1, name: 1 }, { unique: true });

export const PaymentMethod =
  mongoose.models.PaymentMethod ||
  mongoose.model<IPaymentMethod>('PaymentMethod', paymentMethodSchema);
