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
  businessNumber?: string;
  invoicePrefix?: string;
  invoiceSequence: number;
  subdomain?: string;
  language?: string;
  currency?: string;
  isActive: boolean;
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
    businessNumber: String,
    invoicePrefix: { type: String, default: 'INV' },
    invoiceSequence: { type: Number, default: 0 },
    subdomain: { type: String, sparse: true, unique: true, lowercase: true, trim: true },
    language: { type: String, default: 'en' },
    currency: { type: String, default: 'USD' },
    isActive: { type: Boolean, default: true },
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

// Drop the stale tenantId_1 unique index that conflicts with the current schema.
// This is idempotent — silently ignored when the index no longer exists.
async function dropStaleIndexes() {
  try {
    const conn = mongoose.connection;
    if (conn.readyState === 1) {
      await conn.db?.collection('companyconfigs').dropIndex('tenantId_1');
    }
  } catch {
    // Index doesn't exist or already dropped — nothing to do
  }
}

mongoose.connection.once('connected', () => { dropStaleIndexes(); });

// In development, delete the cached model so hot-reloads pick up schema changes
if (process.env.NODE_ENV !== 'production') {
  delete (mongoose.models as Record<string, unknown>).CompanyConfig;
}

export const CompanyConfig = mongoose.model<ICompanyConfig>('CompanyConfig', companyConfigSchema);
