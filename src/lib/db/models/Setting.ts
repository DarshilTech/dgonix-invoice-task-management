import mongoose, { Schema, Document } from 'mongoose';

export interface ISetting extends Document {
  tenantId?: mongoose.Types.ObjectId;
  companyId?: mongoose.Types.ObjectId;
  key: string;
  value: any;
  createdAt: Date;
  updatedAt: Date;
}

const settingSchema = new Schema<ISetting>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      index: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      index: true,
    },
    key: {
      type: String,
      required: true,
    },
    value: Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

// Compound index for company-specific settings
settingSchema.pre('validate', function syncTenantId(next) {
  if (!this.tenantId && this.companyId) {
    this.tenantId = this.companyId;
  }

  if (!this.companyId && this.tenantId) {
    this.companyId = this.tenantId;
  }

  next();
});

settingSchema.index({ tenantId: 1, key: 1 }, { unique: true, sparse: true });
settingSchema.index({ companyId: 1, key: 1 });

export const Setting =
  mongoose.models.Setting || mongoose.model<ISetting>('Setting', settingSchema);
