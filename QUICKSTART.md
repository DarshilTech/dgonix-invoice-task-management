# ⚡ Quick Start Guide - Invoice CRM

## 🎯 System Ready! Here's What's Built

### ✅ Complete Implementation (5 Phases)

```
Phase 1: Core Setup .......................... ✅ COMPLETE
  - Next.js project with all dependencies
  - TypeScript configuration
  - Tailwind CSS with custom theme
  - MongoDB models & connection

Phase 2: Authentication ...................... ✅ COMPLETE
  - JWT with HTTP-only cookies
  - Login/Signup pages
  - Refresh token rotation
  - bcrypt password hashing

Phase 3: Admin Panel ......................... ✅ COMPLETE
  - Dashboard with stats
  - Company management
  - Client management
  - Invoice creation/editing
  - Settings page

Phase 4: Invoice Management .................. ✅ COMPLETE
  - Full CRUD operations
  - PDF generation (Puppeteer)
  - Email sending (Nodemailer)
  - Invoice status tracking
  - Payment references (UUID)

Phase 5: Payment System ...................... ✅ COMPLETE
  - Client portal (secure)
  - Invoice viewing
  - Payment proof upload
  - Admin verification
  - Payment history
```

---

## 🚀 Get Started in 3 Minutes

### 1️⃣ Install Dependencies
```bash
cd /var/www/html/invoice
npm install
```

### 2️⃣ Setup Environment
```bash
cp .env.example .env.local
```

Edit `.env.local` - only MONGODB_URI is required for testing:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/invoice-crm
JWT_SECRET=super-secret-key-32-chars-min
REFRESH_TOKEN_SECRET=another-secret-key-32-chars-min
```

### 3️⃣ Start Dev Server
```bash
npm run dev
```

Visit: **http://localhost:3000**

---

## 📋 First-Time Setup Walkthrough

### 1. Create Admin Account
- Go to http://localhost:3000/signup
- Fill in your details
- Company is auto-created
- You're now admin!

### 2. Add Your First Client
- Go to /admin/clients
- Click "+ Add Client"
- Fill in client details
- Save

### 3. Create Invoice
- Go to /admin/invoices
- Click "+ Create Invoice"
- Select company & client
- Add line items
- Click "Create Invoice"

### 4. Send Invoice Email
- Click invoice detail
- Configure SMTP first (optional):
  - Go to /admin/settings
  - Add SMTP credentials (Gmail, SendGrid, etc.)
- Click "📧 Send Email"
- Invoice sent to client!

### 5. Client Login & Payment
- Open incognito/private browser
- Go to /login
- Use client email (from invoice header)
- View invoice in portal
- Click "✓ Mark as Paid / Upload Proof"
- Upload payment screenshot

### 6. Admin Verify Payment
- Go to /admin/payments
- Review payment proof
- Click "Verify Payment"
- Invoice auto-marked as paid!

---

## 🔑 Key Features

### Admin Panel
```
📊 Dashboard
   ├─ Total invoices
   ├─ Revenue summary
   └─ Recent activities

🏢 Companies
   ├─ Create/Edit
   ├─ SMTP configuration
   ├─ Wise account setup
   └─ Invoice prefix

👥 Clients
   ├─ Create/Manage
   ├─ Portal users
   └─ Contact details

📄 Invoices
   ├─ Create
   ├─ Edit (draft only)
   ├─ Send via email
   ├─ Download PDF
   └─ Track status

💳 Payments
   ├─ Review proofs
   ├─ Verify/Reject
   └─ Payment history

⚙️ Settings
   ├─ Email (SMTP)
   ├─ Invoice defaults
   └─ Company branding
```

### Client Portal
```
📊 Dashboard
   ├─ Invoice summary
   ├─ Paid/Pending count
   └─ Total amount due

📄 Invoices
   ├─ List all invoices
   ├─ Filter by status
   ├─ View details
   └─ Download PDF

💰 Payments
   ├─ Payment instructions
   ├─ Upload proof
   ├─ Payment history
   └─ Status tracking

👤 Profile
   ├─ Account settings
   └─ Change password
```

---

## 🗂️ Project Structure

```
invoice/
├── src/app/
│   ├── (auth)/              # Login, Signup pages
│   ├── (admin)/             # Admin portal
│   │   ├── dashboard/
│   │   ├── invoices/
│   │   ├── clients/
│   │   ├── companies/
│   │   ├── payments/
│   │   └── settings/
│   ├── (client)/            # Client portal
│   │   ├── dashboard/
│   │   ├── invoices/
│   │   └── payments/
│   └── api/                 # API routes
│       ├── auth/
│       ├── invoices/
│       ├── payments/
│       └── clients/
├── src/lib/
│   ├── db/models/          # Mongoose models
│   ├── auth/               # JWT, password utils
│   ├── email/              # Email templates
│   ├── pdf/                # PDF generation
│   └── validation/         # Zod schemas
├── .env.example            # Environment template
├── README.md               # Main documentation
├── DEPLOYMENT.md           # Deployment guide
└── package.json            # Dependencies
```

---

## 🔐 Security Features

✅ **HTTP-only Cookies** - JWT stored securely (not vulnerable to XSS)
✅ **Refresh Token Rotation** - Each refresh creates new tokens
✅ **bcrypt Hashing** - 12-round password hashing
✅ **CSRF Protection** - SameSite cookies enabled
✅ **Rate Limiting** - Login endpoint protected
✅ **Zod Validation** - All input validated
✅ **Role-Based Access** - Admin vs Client routes
✅ **Multi-Tenant** - Complete data isolation by company
✅ **UUID References** - Payment references unpredictable
✅ **HTTPS Ready** - Vercel auto-enforces

---

## 📊 Database Models

```javascript
User {
  email, passwordHash, firstName, lastName, role
  companyIds[] (admin), clientId (client)
  emailVerified, isActive, lastLogin
}

Company {
  name, email, address, city, state, zip, country
  logo, taxId, businessNumber
  smtpHost, smtpUser, smtpPass, fromEmail
  invoicePrefix
}

Client {
  companyId, name, email, contactPerson
  address, city, state, zip, country
  taxId, status, portalAccess
}

Invoice {
  companyId, clientId, invoiceNumber
  invoiceDate, dueDate, paymentReference
  lineItems[], subtotal, taxRate, total
  status, notes, terms
  sentAt, paidAt
}

Payment {
  invoiceId, companyId, clientId
  amount, currency, paymentMethod
  status (pending/submitted/verified/failed)
  proofUrl, referenceNumber, notes
  verifiedBy, verifiedAt
}
```

---

## 🌐 API Endpoints

### Auth
```
POST /api/auth/login              ✨ Login with email/password
POST /api/auth/signup             ✨ Create admin account
POST /api/auth/logout             ✨ Logout & clear cookies
POST /api/auth/refresh            ✨ Refresh JWT token
```

### Invoices
```
GET  /api/invoices                ✨ List (filtered by role)
POST /api/invoices                ✨ Create (admin only)
GET  /api/invoices/[id]           ✨ View detail
PUT  /api/invoices/[id]           ✨ Edit (admin, draft only)
DELETE /api/invoices/[id]         ✨ Delete (admin, draft only)
GET  /api/invoices/[id]/pdf       ✨ Download PDF
POST /api/invoices/[id]/email     ✨ Send email (admin)
```

### Payments
```
GET  /api/payments                ✨ List (filtered by role)
POST /api/payments                ✨ Submit proof
GET  /api/payments/[id]           ✨ Get detail
POST /api/payments/verify         ✨ Verify (admin)
```

### Clients & Companies
```
GET  /api/companies               ✨ Admin's companies
POST /api/clients                 ✨ Create client
GET  /api/clients                 ✨ List clients
```

---

## 📧 Email Templates Included

✅ **Invoice Email** - PDF attached, payment instructions
✅ **Payment Received** - Confirmation email
✅ **Password Reset** - Secure reset link
✅ **HTML Templates** - Professional styling with Tailwind

---

## 🧪 Testing Features

**Test Admin Flow:**
1. Create account at /signup
2. Add a test client at /admin/clients
3. Create invoice at /admin/invoices
4. Send email and verify
5. Download PDF

**Test Client Flow:**
1. Open private browser
2. Login with client email
3. View invoice in portal
4. Download PDF
5. Submit payment proof

**Test Payment Verification:**
1. Admin goes to /admin/payments
2. Sees client's submitted proof
3. Verifies payment
4. Client portal updates status

---

## 🚀 Deploy to Vercel (2 minutes)

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy
vercel

# 3. Add environment variables in Vercel dashboard:
#    - MONGODB_URI
#    - JWT_SECRET
#    - REFRESH_TOKEN_SECRET
#    - SMTP_* (optional)

# 4. Deploy to production
vercel --prod
```

---

## ⚠️ Important Before Production

- [ ] Generate strong JWT secrets (32+ chars)
- [ ] Configure MongoDB Atlas firewall
- [ ] Set up SMTP credentials (Gmail, SendGrid, etc.)
- [ ] Test all email flows
- [ ] Test PDF generation
- [ ] Verify Vercel deployment
- [ ] Set custom domain
- [ ] Enable HTTPS (automatic on Vercel)

---

## 🆘 Common Issues & Solutions

### "Cannot find MongoDB"
```
✓ Install MongoDB locally OR
✓ Use MongoDB Atlas cloud free tier
✓ Set MONGODB_URI in .env.local
```

### "Email not sending"
```
✓ Check SMTP credentials
✓ Gmail: Enable "Less secure apps"
✓ Check firewall not blocking port 587
✓ Verify SMTP_FROM is correct
```

### "PDF not generating"
```
✓ Puppeteer requires Chrome/Chromium
✓ npm install puppeteer
✓ May need: apt-get install chromium-browser (Linux)
```

### "Login not working"
```
✓ Check .env.local has MONGODB_URI
✓ MongoDB connection must be successful
✓ Check user exists in database
```

---

## 📞 Need Help?

1. Check **README.md** - Full documentation
2. Check **DEPLOYMENT.md** - Deployment guide
3. Review **src/app/api** - API implementation examples
4. Check browser console - Error messages
5. MongoDB Atlas dashboard - Connection issues

---

## 🎉 You're All Set!

```bash
# Start building!
npm run dev

# Visit http://localhost:3000
# Create account
# Start invoicing!
```

Happy invoicing! 🚀💼
