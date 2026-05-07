import mongoose, { Schema, Document } from 'mongoose';

export interface IClient extends Document {
  tenantId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  contactPerson?: string;
  phone?: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  taxId?: string;
  status: 'active' | 'inactive';
  portalAccess: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const clientSchema = new Schema<IClient>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    contactPerson: String,
    phone: String,
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
    taxId: String,
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    portalAccess: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Unique email per company
clientSchema.pre('validate', function syncTenantId(next) {
  if (!this.tenantId && this.companyId) {
    this.tenantId = this.companyId;
  }

  if (!this.companyId && this.tenantId) {
    this.companyId = this.tenantId;
  }

  next();
});

clientSchema.index({ tenantId: 1, email: 1 }, { unique: true });
clientSchema.index({ companyId: 1, email: 1 });

export const Client = mongoose.models.Client || mongoose.model<IClient>('Client', clientSchema);
