import mongoose, { Schema, Document } from 'mongoose';

export interface ITenant extends Document {
  tenantId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  logo?: string;
  taxId?: string;
  businessNumber?: string;
  wiseAccountEmail?: string;
  wiseTransferRef?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  fromEmail: string;
  invoicePrefix: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const tenantSchema = new Schema<ITenant>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      index: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: String,
    website: String,
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    zip: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    logo: String,
    taxId: String,
    businessNumber: String,
    wiseAccountEmail: String,
    wiseTransferRef: String,
    smtpHost: String,
    smtpPort: Number,
    smtpUser: String,
    smtpPass: String,
    fromEmail: {
      type: String,
      required: true,
    },
    invoicePrefix: {
      type: String,
      default: 'INV',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

tenantSchema.pre('validate', function setTenantId(next) {
  if (!this.tenantId) {
    this.tenantId = this._id as mongoose.Types.ObjectId;
  }
  next();
});

export const Tenant = mongoose.models.Tenant || mongoose.model<ITenant>('Tenant', tenantSchema);
