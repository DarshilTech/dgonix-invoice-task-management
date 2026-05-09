import mongoose from 'mongoose';
import { getServerEnv } from '@/lib/config/env';

let cached = global as any;

if (!cached.mongoose) {
  cached.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.mongoose.conn) {
    return cached.mongoose.conn;
  }

  if (!cached.mongoose.promise) {
    const { MONGODB_URI } = getServerEnv();
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    };

    cached.mongoose.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then(async (m) => {
        console.log('✅ MongoDB connected');
        // Drop stale indexes that conflict with the current schema
        try {
          await m.connection.db?.collection('companyconfigs').dropIndex('tenantId_1');
          console.log('🧹 Dropped stale companyconfigs.tenantId_1 index');
        } catch {
          // Index doesn't exist — nothing to do
        }
        return m;
      })
      .catch((err) => {
        console.error('❌ MongoDB connection failed:', err);
        throw err;
      });
  }

  try {
    cached.mongoose.conn = await cached.mongoose.promise;
  } catch (e) {
    cached.mongoose.promise = null;
    throw e;
  }

  return cached.mongoose.conn;
}

export default connectDB;
