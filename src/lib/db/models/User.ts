import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  tenantId: mongoose.Types.ObjectId;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'client';
  companyIds?: mongoose.Types.ObjectId[];
  clientId?: mongoose.Types.ObjectId;
  companyId?: mongoose.Types.ObjectId;
  emailVerified: boolean;
  isActive: boolean;
  resetPasswordToken?: string;
  resetPasswordExpiry?: Date;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'client'],
      default: 'admin',
    },
    companyIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Tenant',
      },
    ],
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    resetPasswordToken: String,
    resetPasswordExpiry: Date,
    lastLogin: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes for queries
userSchema.pre('validate', function syncTenantId(next) {
  if (!this.tenantId) {
    const fallbackTenantId =
      this.companyId || (Array.isArray(this.companyIds) ? this.companyIds[0] : undefined);

    if (fallbackTenantId) {
      this.tenantId = fallbackTenantId;
    }
  }

  if (!this.companyId && this.tenantId) {
    this.companyId = this.tenantId;
  }

  if ((!this.companyIds || this.companyIds.length === 0) && this.tenantId) {
    this.companyIds = [this.tenantId];
  }

  next();
});

userSchema.index({ tenantId: 1, role: 1 });
userSchema.index({ role: 1 });
userSchema.index({ companyIds: 1 });
userSchema.index({ clientId: 1 });

export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
