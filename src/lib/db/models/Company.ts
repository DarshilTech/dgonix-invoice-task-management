import mongoose, { Schema, Document } from 'mongoose';

export interface ICompany extends Document {
  ownerId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  logo?: string;
  taxId?: string;
  businessNumber?: string;
  fromEmail?: string;
  invoicePrefix:   string;
  invoiceSequence: number;
  subdomain?: string;
  language?: string;
  currency?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const companySchema = new Schema<ICompany>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: String,
    website: String,
    address: String,
    city: String,
    state: String,
    zip: String,
    country: String,
    logo: String,
    taxId: String,
    businessNumber: String,
    fromEmail: String,
    invoicePrefix:   { type: String, default: 'INV' },
    invoiceSequence: { type: Number, default: 0 },
    subdomain: { type: String, sparse: true, unique: true, lowercase: true, trim: true },
    language:  { type: String, default: 'en' },
    currency:  { type: String, default: 'USD' },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

export const Company =
  mongoose.models.Company || mongoose.model<ICompany>('Company', companySchema);
