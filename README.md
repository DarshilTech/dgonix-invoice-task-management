# Invoice CRM

A production-oriented SaaS CRM for companies, clients, invoices, manual payments, PDFs, and SMTP invoice email.

## Current Build

- Next.js App Router with TypeScript
- Tailwind CSS design system with sidebar/header app shell
- JWT auth with HTTP-only access and refresh cookies
- Admin and client role routing
- MongoDB/Mongoose multi-tenant models
- Tenant-scoped APIs for companies, clients, invoices, payments, and payment methods
- Manual payment workflow with partial/full payments and invoice balance updates
- HTML invoice template with Puppeteer rendering when available, plus a PDFKit fallback
- SMTP-ready email sending with invoice PDF attachments

## Project Structure

```txt
src/
  app/                 Next.js routes, layouts, pages, and app/api route handlers
  components/          Reusable UI and layout components
  hooks/               Client-side reusable React hooks
  lib/                 Infrastructure utilities: auth, db, email, pdf, validation, config
  models/              Public re-export surface for Mongoose models
  services/            Business logic that should not live inside route handlers
  api/                 API documentation/helpers; actual Next route handlers stay in app/api
  types/               Shared TypeScript domain types
```

This scales better for SaaS because route handlers stay thin, services own business rules, models own persistence shape, and UI components are reusable across admin/client portals. As the app grows, features can be added without mixing tenant access, calculations, and page code in one place.

## SaaS Architecture Notes

Every business document uses `tenantId`: users, clients, invoices, payments, settings, and payment methods. `Company` is kept as a product-facing alias for `Tenant`, so the UI can say "companies" while the database enforces workspace isolation.

Tenant isolation works by always querying with `tenantId` from the verified JWT. Admins can access their tenant list; clients are additionally filtered by `clientId`. This prevents cross-company data leaks even if someone guesses another document ID.

## Auth And Security

Auth routes:

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`

Passwords are hashed with bcrypt. JWTs are stored in HTTP-only cookies so browser JavaScript cannot read them, which limits token theft during XSS. Cookies use `SameSite=Lax`, which reduces CSRF exposure for normal cross-site form/navigation attacks. For high-risk mutations, add a CSRF token header before production hardening.

Middleware protects `/admin/*` and `/client/*` by role. API routes also verify auth and tenant access because page middleware alone is not enough security.

## Multi-Tenant Models

Collections:

- `Tenant` / `Company`: workspace, branding, SMTP, invoice settings
- `User`: admin/client user attached to a tenant
- `Client`: customer company/contact attached to a tenant
- `Invoice`: line items, status, totals, `paidAmount`, `balanceAmount`
- `Payment`: manual payment records linked to invoice/client/tenant
- `PaymentMethod`: tenant-configurable payment options
- `Setting`: tenant-scoped key/value settings

MongoDB relationships are references: invoices reference clients, payments reference invoices and clients, and every document includes `tenantId` so queries can remain isolated.

## Manual Payments

Payment routes:

- `POST /api/payments`
- `GET /api/payments?invoiceId=...`
- `PUT /api/payments/[id]`
- `DELETE /api/payments/[id]`
- `POST /api/payments/verify`
- `GET/POST /api/payment-methods`
- `PUT/DELETE /api/payment-methods/[id]`

Admin-created payments default to `confirmed`; client proof uploads default to `pending`. Confirmed payments recalculate invoice fields from source payments:

- `paidAmount`
- `balanceAmount`
- `status`: `sent`, `partially_paid`, or `paid`

The app prevents confirmed overpayments. Derived fields are stored because dashboards and invoice lists need fast totals, but the service recalculates them from payment records to keep consistency after create/edit/delete.

## CRUD And Pagination

Clients support create, edit, delete, search, and pagination. Pagination is required in SaaS apps because tenant datasets grow quickly; loading every client or invoice makes pages slower and increases database cost.

## Invoice Logic

Invoice calculations live in `src/services/invoiceService.ts`. The API accepts dynamic line items, calculates subtotal/tax/total on the server, and stores both `totalAmount` and payment-derived balance fields. Server-side calculations are important because the browser can be modified by users.

For financial precision, keep rounding centralized. For larger production systems, store money as integer cents or use decimal types end to end.

## PDF And Email

PDF generation starts from an HTML invoice template. Puppeteer is useful because it renders the same HTML/CSS used for branded documents, which is more flexible than low-level PDF drawing libraries. This code attempts Puppeteer first and falls back to PDFKit if Puppeteer is not installed on the host.

Email is handled with Nodemailer/SMTP. SMTP sends mail through a configured mail server using host, port, username, and password. Protect SMTP credentials as secrets, never commit real credentials, and prefer provider app passwords or scoped credentials.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Seed sample data:

```bash
npm run seed
```

Build check:

```bash
npm run build
```

## Production

Set these in Vercel or your host:

- `MONGODB_URI`
- `JWT_SECRET`
- `REFRESH_TOKEN_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

Common deployment mistakes:

- Using weak/default JWT secrets
- Forgetting `NEXT_PUBLIC_APP_URL`
- Running without HTTPS in production
- Missing MongoDB indexes after schema changes
- Committing real SMTP or database credentials
- Trusting client-side role checks without API tenant filters
