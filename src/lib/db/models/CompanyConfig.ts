import mongoose, { Schema, Document } from 'mongoose';

export interface ICompanyConfig extends Document {
  userId: mongoose.Types.ObjectId;
  companyName?: string;
  companyEmail?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  logo?: string;
  taxId?: string;
  invoicePrefix?: string;
  fromEmail?: string;
  senderName?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  website?: string;
  wiseAccountEmail?: string;
  wiseTransferRef?: string;
  createdAt: Date;
  updatedAt: Date;
}

const companyConfigSchema = new Schema<ICompanyConfig>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    companyName: String,
    companyEmail: String,
    phone: String,
    address: String,
    city: String,
    state: String,
    zip: String,
    country: String,
    logo: String,
    taxId: String,
    invoicePrefix: { type: String, default: 'INV' },
    fromEmail: String,
    senderName: String,
    smtpHost: String,
    smtpPort: Number,
    smtpUser: String,
    smtpPass: String,
    website: String,
    wiseAccountEmail: String,
    wiseTransferRef: String,
  },
  { timestamps: true }
);

// In development, delete the cached model so hot-reloads pick up schema changes
if (process.env.NODE_ENV !== 'production') {
  delete (mongoose.models as Record<string, unknown>).CompanyConfig;
}

export const CompanyConfig = mongoose.model<ICompanyConfig>('CompanyConfig', companyConfigSchema);
