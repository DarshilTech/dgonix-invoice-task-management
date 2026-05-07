# Production Invoice CRM - Complete Implementation Guide

## 🎉 What's Been Built

### Phase 1-5: Core System ✅ COMPLETE

#### ✓ Authentication System
- JWT tokens with HTTP-only cookies
- Refresh token rotation  
- bcrypt password hashing (12 rounds)
- Login/Signup pages
- Password reset flow
- Multi-role support (Admin & Client)

#### ✓ Database Models
- User (admin + client users)
- Company (multi-tenant)
- Client (customer accounts)
- Invoice (with line items)
- Payment (proof upload + verification)
- Settings (config per company)

#### ✓ Admin Dashboard
- Company management
- Client management
- Invoice CRUD (create, view, edit, delete)
- Invoice PDF generation with Puppeteer
- Email sending with attachments
- Payment verification dashboard
- Settings page

#### ✓ Client Portal
- Secure login
- Invoice listing and filtering
- Invoice detail view with payment reference
- PDF download
- Payment proof submission
- Payment status tracking

#### ✓ Invoice Management
- Auto-generated invoice numbers
- UUID payment references
- Line items with individual tax
- PDF generation (professional layout)
- Email delivery to clients
- Status tracking (draft → sent → paid)

#### ✓ Payment System
- Client submits payment proof (image/PDF)
- Admin verifies or rejects payments
- Automatic invoice status update
- Payment history tracking

#### ✓ Email System
- Nodemailer integration
- Professional HTML templates
- Invoice PDF attachments
- Password reset emails
- Payment confirmation emails

---

## 🚀 Deployment Instructions

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas or local MongoDB
- Vercel account (for hosting)
- SMTP credentials (Gmail, SendGrid, etc.)

### Step 1: Prepare Environment

```bash
# Copy environment template
cp .env.example .env.local

# Edit with your actual values
nano .env.local
```

**Required Environment Variables:**
```env
# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/invoice-crm

# JWT Secrets (generate strong random strings)
JWT_SECRET=your-super-secret-key-minimum-32-chars
REFRESH_TOKEN_SECRET=another-super-secret-key-minimum-32-chars

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or your domain

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourcompany.com
```

### Step 2: Install & Test Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Visit http://localhost:3000
```

**First-time setup:**
1. Click "Sign up" 
2. Create admin account + company
3. Add clients
4. Create invoices
5. Send via email

### Step 3: Generate Strong Secrets

Use this command to generate random secrets:

```bash
# On macOS/Linux
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Run twice, use output for JWT_SECRET and REFRESH_TOKEN_SECRET
```

### Step 4: Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow prompts:
# - Link to Git repo
# - Set project name
# - Set root directory: ./
```

### Step 5: Add Environment Variables to Vercel

```bash
# Via CLI
vercel env add MONGODB_URI
vercel env add JWT_SECRET
vercel env add REFRESH_TOKEN_SECRET
# ... add all other env vars

# OR via Vercel Dashboard:
# 1. Go to Project Settings
# 2. Environment Variables
# 3. Add all vars from .env.local
```

### Step 6: Deploy Production

```bash
# Deploy to production
vercel --prod
```

---

## 📋 API Endpoints Summary

### Authentication
```
POST   /api/auth/login              - User login
POST   /api/auth/signup             - Register new admin
POST   /api/auth/logout             - Logout
POST   /api/auth/refresh            - Refresh JWT token
POST   /api/auth/reset-password     - Request password reset
```

### Invoices (Admin creates, both view)
```
GET    /api/invoices                - List invoices (filtered by role)
POST   /api/invoices                - Create invoice
GET    /api/invoices/[id]           - Get invoice detail
PUT    /api/invoices/[id]           - Update invoice
DELETE /api/invoices/[id]           - Delete invoice
GET    /api/invoices/[id]/pdf       - Download PDF
POST   /api/invoices/[id]/email     - Send invoice email
```

### Payments (Both submit & view)
```
GET    /api/payments                - List payments
POST   /api/payments                - Submit payment proof
GET    /api/payments/[id]           - Get payment detail
POST   /api/payments/verify         - Admin: Verify payment
```

### Companies & Clients
```
GET    /api/companies               - List admin's companies
POST   /api/clients                 - Create client
GET    /api/clients                 - List clients
```

---

## 🔐 Security Checklist

Before Production:
- ✅ HTTP-only cookies enabled (no localStorage)
- ✅ Refresh token rotation implemented
- ✅ CORS properly configured for your domain
- ✅ Rate limiting on login endpoint
- ✅ HTTPS enforced (Vercel does this automatically)
- ✅ Strong JWT secrets (minimum 32 characters)
- ✅ SMTP credentials secured in environment
- ✅ MongoDB connection uses encryption
- ✅ Zod validation on all inputs
- ✅ Role-based access control enforced

---

## 📊 Database Setup

### MongoDB Atlas (Free Tier)

1. **Create Cluster**
   - Go to mongodb.com/cloud/atlas
   - Create free account
   - Create M0 cluster (free tier)

2. **Get Connection String**
   - Click "Connect"
   - Choose "Drivers"
   - Copy connection string
   - Replace `<password>` with your password

3. **Add IP Whitelist**
   - Security → Network Access
   - Add IP: 0.0.0.0/0 (for Vercel)

Example connection string:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/invoice-crm?retryWrites=true&w=majority
```

---

## 🧪 Testing the System

### Local Testing

```bash
# 1. Start dev server
npm run dev

# 2. Open http://localhost:3000

# 3. Create admin account at /signup

# 4. Login at /login

# 5. Add company (already created)

# 6. Create a client
#    - Go to /admin/clients
#    - Click "+ Add Client"

# 7. Create invoice
#    - Go to /admin/invoices
#    - Click "+ Create Invoice"
#    - Select company & client
#    - Add line items
#    - Click "Create Invoice"

# 8. Send invoice
#    - Click invoice detail
#    - Click "📧 Send Email"
#    - Check email (if SMTP configured)

# 9. Client login
#    - Go to /login
#    - Use client credentials
#    - View invoice
#    - Submit payment proof

# 10. Admin verify payment
#     - Go to /admin/payments
#     - Review proof
#     - Click "Verify Payment"
```

### Test User Accounts

After signup, create test users:

```javascript
// Database query to add test client user
db.users.insertOne({
  email: "client@test.com",
  passwordHash: "bcrypt-hashed-password",
  firstName: "Test",
  lastName: "Client",
  role: "client",
  clientId: ObjectId("..."), // Link to client
  companyId: ObjectId("..."), // Link to company
  emailVerified: true
})
```

---

## 📈 Performance Tips

### Optimize Images
- Compress invoice logos before uploading
- Use WebP format where possible
- Max logo size: 500KB

### Database Indexing
Indexes are already created on:
- `User.email` (unique)
- `Invoice.invoiceNumber` (unique)
- `Invoice.paymentReference` (unique)
- `Invoice.companyId + status`
- `Payment.companyId + status`

### Reduce PDF Generation Time
- Puppeteer headless Chrome on Vercel
- Typical time: 2-5 seconds per PDF
- Consider caching generated PDFs

---

## 🐛 Troubleshooting

### Login Not Working
```
Check:
- MongoDB connection string correct
- User created in database
- Password hash correct
```

### Email Not Sending
```
Check:
- SMTP credentials in .env
- Gmail: Enable "Less secure apps"
- SendGrid: API key correct
- Firewall not blocking SMTP port
```

### PDF Generation Fails
```
Check:
- Puppeteer installed: npm list puppeteer
- Chrome/Chromium available on system
- Enough disk space for temp files
```

### Invoice Not Appearing for Client
```
Check:
- Invoice status = "sent" (not "draft")
- Client user linked to correct client company
- Client user companyId matches invoice companyId
```

---

## 📝 Next Features to Add

1. **Reporting & Analytics**
   - Revenue by client
   - Invoice aging
   - Payment statistics

2. **Payments Integration**
   - Wise API integration for auto-verification
   - Stripe/PayPal for online payments
   - Recurring invoices

3. **Advanced Features**
   - Invoice templates
   - Bulk invoice sending
   - Client custom portal branding
   - Multi-language support

4. **Admin Enhancements**
   - Staff user management
   - Two-factor authentication
   - Audit logging
   - Invoice approval workflow

---

## 📞 Support & Monitoring

### Vercel Monitoring
- Go to Vercel Dashboard
- Check "Deployments" tab
- Monitor "Analytics"

### MongoDB Monitoring
- Atlas dashboard
- Check "Monitoring" tab
- Set up alerts for connection issues

### Error Logging (Optional)
Add Sentry for error tracking:
```bash
npm install @sentry/nextjs
```

---

## 📜 License

MIT - Feel free to use commercially

---

## 🎓 Key Learnings for Future Development

1. **Data Isolation** - Always filter queries by companyId + role
2. **Payment References** - Use UUIDs, never sequential IDs
3. **Email Reliability** - Consider email queue system for large volumes
4. **PDF Caching** - Cache generated PDFs for common invoices
5. **Mobile** - Test all flows on mobile devices

Good luck! 🚀
