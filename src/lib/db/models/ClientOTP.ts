import mongoose, { Schema, Document } from 'mongoose';

export interface IClientOTP extends Document {
  email: string;
  otp: string;
  clientId: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId;
  attempts: number;
  expiresAt: Date;
}

const clientOTPSchema = new Schema<IClientOTP>({
  email: { type: String, required: true, lowercase: true, index: true },
  otp: { type: String, required: true },
  clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  attempts: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
});

export const ClientOTP =
  mongoose.models.ClientOTP ||
  mongoose.model<IClientOTP>('ClientOTP', clientOTPSchema);
