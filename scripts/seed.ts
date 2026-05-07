import 'dotenv/config';
import path from 'path';
import mongoose from 'mongoose';
import { User, Company, Client, Invoice, Payment, PaymentMethod } from '../src/lib/db/models';
import { hashPassword } from '../src/lib/auth/password';
import { v4 as uuidv4 } from 'uuid';

// Ensure dotenv loads from root
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error('❌ MONGODB_URI not set in .env.local');
  console.error(
    'Current env vars:',
    Object.keys(process.env).filter((k) => k.includes('MONGO'))
  );
  process.exit(1);
}

const MONGODB_URI: string = mongoUri;

console.log('🔗 Connecting to MongoDB:', MONGODB_URI.substring(0, 50) + '...');

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Drop all collections to avoid index conflicts
    const db = mongoose.connection.db;
    if (db) {
      const collections = await db.listCollections().toArray();
      for (const collection of collections) {
        try {
          await db.dropCollection(collection.name);
        } catch (err) {
          // Ignore if collection doesn't exist
        }
      }
    }
    console.log('🗑️  Cleared all collections');

    // Recreate indexes by syncing all models
    await Promise.all([
      User.collection.dropIndexes().catch(() => {}),
      Company.collection.dropIndexes().catch(() => {}),
      Client.collection.dropIndexes().catch(() => {}),
      Invoice.collection.dropIndexes().catch(() => {}),
      Payment.collection.dropIndexes().catch(() => {}),
      PaymentMethod.collection.dropIndexes().catch(() => {}),
    ]);

    await Promise.all([
      User.syncIndexes(),
      Company.syncIndexes(),
      Client.syncIndexes(),
      Invoice.syncIndexes(),
      Payment.syncIndexes(),
      PaymentMethod.syncIndexes(),
    ]);
    console.log('✅ Synced all indexes');

    // Create Admin User's Company
    const company = await Company.create({
      name: 'Acme Corporation',
      email: 'billing@acme.com',
      phone: '+1 (555) 123-4567',
      website: 'https://acme.example.com',
      address: '123 Business Ave',
      city: 'San Francisco',
      state: 'CA',
      zip: '94102',
      country: 'USA',
      taxId: 'TAX-123456789',
      businessNumber: 'BUS-987654321',
      wiseAccountEmail: 'payments@acme.wise',
      wiseTransferRef: 'ACME-TRANSFER',
      fromEmail: 'billing@acme.com',
      invoicePrefix: 'ACME',
    });
    console.log('✅ Created Company:', company.name);

    // Create Admin User
    const adminPassword = 'AdminPass123!';
    const adminPasswordHash = await hashPassword(adminPassword);
    const admin = await User.create({
      tenantId: company._id,
      email: 'admin@acme.com',
      passwordHash: adminPasswordHash,
      firstName: 'John',
      lastName: 'Admin',
      role: 'admin',
      companyIds: [company._id],
      isGlobalAdmin: true,
      emailVerified: true,
      isActive: true,
    });
    console.log('✅ Created Admin User:', admin.email);
    console.log('   Password:', adminPassword);

    // Create Sample Clients
    const clients = await Client.insertMany([
      {
        companyId: company._id,
        tenantId: company._id,
        name: 'TechStart Inc',
        email: 'billing@techstart.com',
        contactPerson: 'Sarah Johnson',
        phone: '+1 (555) 234-5678',
        address: '456 Tech Street',
        city: 'Los Angeles',
        state: 'CA',
        zip: '90001',
        country: 'USA',
        taxId: 'TAX-111111111',
        status: 'active',
        portalAccess: true,
      },
      {
        companyId: company._id,
        tenantId: company._id,
        name: 'Creative Agency LLC',
        email: 'accounts@creativeagency.com',
        contactPerson: 'Michael Chen',
        phone: '+1 (555) 345-6789',
        address: '789 Design Lane',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'USA',
        taxId: 'TAX-222222222',
        status: 'active',
        portalAccess: true,
      },
      {
        companyId: company._id,
        tenantId: company._id,
        name: 'Global Solutions Ltd',
        email: 'finance@globalsolutions.com',
        contactPerson: 'Emma Watson',
        phone: '+1 (555) 456-7890',
        address: '321 International Blvd',
        city: 'Chicago',
        state: 'IL',
        zip: '60601',
        country: 'USA',
        taxId: 'TAX-333333333',
        status: 'active',
        portalAccess: true,
      },
    ]);
    console.log('✅ Created', clients.length, 'Client Companies');

    // Create Client Portal Users
    const clientUsers = await User.insertMany([
      {
        tenantId: company._id,
        email: 'sarah@techstart.com',
        passwordHash: await hashPassword('ClientPass123!'),
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: 'client',
        clientId: clients[0]._id,
        companyId: company._id,
        emailVerified: true,
        isActive: true,
      },
      {
        tenantId: company._id,
        email: 'michael@creativeagency.com',
        passwordHash: await hashPassword('ClientPass123!'),
        firstName: 'Michael',
        lastName: 'Chen',
        role: 'client',
        clientId: clients[1]._id,
        companyId: company._id,
        emailVerified: true,
        isActive: true,
      },
      {
        tenantId: company._id,
        email: 'emma@globalsolutions.com',
        passwordHash: await hashPassword('ClientPass123!'),
        firstName: 'Emma',
        lastName: 'Watson',
        role: 'client',
        clientId: clients[2]._id,
        companyId: company._id,
        emailVerified: true,
        isActive: true,
      },
    ]);
    console.log('✅ Created', clientUsers.length, 'Client Portal Users');
    clientUsers.forEach((u) => {
      console.log(`   ${u.email} - Password: ClientPass123!`);
    });

    const paymentMethods = await PaymentMethod.insertMany([
      {
        tenantId: company._id,
        name: 'Bank Transfer',
        description: 'Manual bank transfer with invoice reference',
        isActive: true,
      },
      {
        tenantId: company._id,
        name: 'Cash',
        description: 'Cash collected and recorded by an admin',
        isActive: true,
      },
      {
        tenantId: company._id,
        name: 'UPI',
        description: 'UPI transfer with payment proof',
        isActive: true,
      },
    ]);
    console.log('✅ Created', paymentMethods.length, 'Payment Methods');

    // Create Sample Invoices
    const invoices = await Invoice.insertMany([
      {
        tenantId: company._id,
        companyId: company._id,
        clientId: clients[0]._id,
        invoiceNumber: 'ACME-001',
        invoiceDate: new Date('2026-05-01'),
        dueDate: new Date('2026-06-01'),
        paymentReference: uuidv4(),
        status: 'sent',
        lineItems: [
          {
            description: 'Web Development Services - Month 1',
            quantity: 160,
            unitPrice: 150,
            tax: 0,
            total: 24000,
          },
          {
            description: 'UI/UX Design',
            quantity: 40,
            unitPrice: 120,
            tax: 0,
            total: 4800,
          },
        ],
        subtotal: 28800,
        taxRate: 10,
        taxAmount: 2880,
        total: 31680,
        totalAmount: 31680,
        paidAmount: 0,
        balanceAmount: 31680,
        currency: 'USD',
        notes: 'Thank you for your business!',
        terms: 'Net 30',
        sentAt: new Date(),
      },
      {
        tenantId: company._id,
        companyId: company._id,
        clientId: clients[1]._id,
        invoiceNumber: 'ACME-002',
        invoiceDate: new Date('2026-04-15'),
        dueDate: new Date('2026-05-15'),
        paymentReference: uuidv4(),
        status: 'paid',
        lineItems: [
          {
            description: 'Branding & Logo Design',
            quantity: 1,
            unitPrice: 5000,
            tax: 0,
            total: 5000,
          },
          {
            description: 'Marketing Materials',
            quantity: 50,
            unitPrice: 100,
            tax: 0,
            total: 5000,
          },
        ],
        subtotal: 10000,
        taxRate: 8,
        taxAmount: 800,
        total: 10800,
        totalAmount: 10800,
        paidAmount: 10800,
        balanceAmount: 0,
        currency: 'USD',
        notes: 'Payment received on 2026-05-10',
        terms: 'Net 30',
        sentAt: new Date('2026-04-15'),
        paidAt: new Date('2026-05-10'),
      },
      {
        tenantId: company._id,
        companyId: company._id,
        clientId: clients[2]._id,
        invoiceNumber: 'ACME-003',
        invoiceDate: new Date('2026-05-05'),
        dueDate: new Date('2026-06-05'),
        paymentReference: uuidv4(),
        status: 'draft',
        lineItems: [
          {
            description: 'Consulting Services',
            quantity: 8,
            unitPrice: 250,
            tax: 0,
            total: 2000,
          },
        ],
        subtotal: 2000,
        taxRate: 10,
        taxAmount: 200,
        total: 2200,
        totalAmount: 2200,
        paidAmount: 0,
        balanceAmount: 2200,
        currency: 'USD',
        notes: 'Draft invoice - please review',
        terms: 'Net 45',
      },
    ]);
    console.log('✅ Created', invoices.length, 'Sample Invoices');
    invoices.forEach((inv) => {
      console.log(`   ${inv.invoiceNumber} - ${inv.status.toUpperCase()} - $${inv.total}`);
    });

    // Create Sample Payments
    const payments = await Payment.insertMany([
      {
        invoiceId: invoices[1]._id,
        tenantId: company._id,
        companyId: company._id,
        clientId: clients[1]._id,
        amount: 10800,
        currency: 'USD',
        paymentDate: new Date('2026-05-10'),
        paymentMethod: 'Bank Transfer',
        paymentMethodId: paymentMethods[0]._id,
        status: 'confirmed',
        referenceNumber: 'WISE-123456789',
        notes: 'Payment for branding work',
        createdBy: admin._id,
        verifiedBy: admin._id,
        verifiedAt: new Date('2026-05-10'),
      },
      {
        invoiceId: invoices[0]._id,
        tenantId: company._id,
        companyId: company._id,
        clientId: clients[0]._id,
        amount: 31680,
        currency: 'USD',
        paymentDate: new Date(),
        paymentMethod: 'UPI',
        paymentMethodId: paymentMethods[2]._id,
        status: 'pending',
        proofUrl: '/uploads/payment-proof-001.jpg',
        proofType: 'image',
        notes: 'Waiting for verification',
        createdBy: clientUsers[0]._id,
      },
    ]);
    console.log('✅ Created', payments.length, 'Sample Payments');

    console.log('\n📊 Seed Data Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Companies:', 1);
    console.log('Admin Users:', 1);
    console.log('Client Companies:', clients.length);
    console.log('Client Portal Users:', clientUsers.length);
    console.log('Invoices:', invoices.length);
    console.log('Payments:', payments.length);
    console.log('\n🔐 Test Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📌 ADMIN LOGIN:');
    console.log('Email: admin@acme.com');
    console.log('Password: AdminPass123!');
    console.log('\n📌 CLIENT PORTAL LOGINS:');
    clientUsers.forEach((u) => {
      console.log(`Email: ${u.email}`);
      console.log(`Password: ClientPass123!`);
      console.log('---');
    });
    console.log('\n✨ Seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}
if (MONGODB_URI) {
  seed();
}
