import mongoose, { Schema, Document } from 'mongoose';

export interface IClient extends Document {
  tenantId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;

  // Company Details
  name: string;
  number?: string;
  group?: string;
  idNumber?: string;
  vatNumber?: string;
  website?: string;
  phone?: string;
  routingId?: string;
  validVatNumber: boolean;
  taxExempt: boolean;
  classification?: string;
  status: 'active' | 'inactive';

  // Primary Contact
  firstName?: string;
  lastName?: string;
  email: string;
  contactPhone?: string;
  addToInvoices: boolean;
  ccOnly: boolean;

  // Billing Address
  billingStreet?: string;
  billingApt?: string;
  billingCity?: string;
  billingState?: string;
  billingPostalCode?: string;
  billingCountry?: string;

  // Shipping Address
  shippingStreet?: string;
  shippingApt?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;

  createdAt: Date;
  updatedAt: Date;
}

const clientSchema = new Schema<IClient>(
  {
    tenantId:  { type: Schema.Types.ObjectId, required: true, index: true },
    companyId: { type: Schema.Types.ObjectId, index: true },

    name:            { type: String, required: true },
    number:          String,
    group:           String,
    idNumber:        String,
    vatNumber:       String,
    website:         String,
    phone:           String,
    routingId:       String,
    validVatNumber:  { type: Boolean, default: false },
    taxExempt:       { type: Boolean, default: false },
    classification:  String,
    status:          { type: String, enum: ['active', 'inactive'], default: 'active', index: true },

    firstName:    String,
    lastName:     String,
    email:        { type: String, required: true, lowercase: true, trim: true },
    contactPhone: String,
    addToInvoices: { type: Boolean, default: true },
    ccOnly:        { type: Boolean, default: false },

    billingStreet:      String,
    billingApt:         String,
    billingCity:        String,
    billingState:       String,
    billingPostalCode:  String,
    billingCountry:     String,

    shippingStreet:     String,
    shippingApt:        String,
    shippingCity:       String,
    shippingState:      String,
    shippingPostalCode: String,
    shippingCountry:    String,
  },
  { timestamps: true }
);

clientSchema.pre('validate', function (next) {
  if (!this.tenantId && this.companyId) this.tenantId = this.companyId;
  if (!this.companyId && this.tenantId) this.companyId = this.tenantId;
  next();
});

clientSchema.index({ tenantId: 1, email: 1 }, { unique: true });

if (process.env.NODE_ENV !== 'production') {
  delete (mongoose.models as Record<string, unknown>).Client;
}

export const Client = mongoose.model<IClient>('Client', clientSchema);
