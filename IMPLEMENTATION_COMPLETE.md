# Implementation Status

The app has been upgraded from a basic invoice project into a tenant-aware SaaS CRM foundation.

## Completed

Phase 1: Project foundation

- Scalable folders added: `app`, `components`, `lib`, `models`, `services`, `api`, `hooks`, `types`
- Shared admin/client app shell with sidebar, header, and max-width container layout
- Tailwind CSS, ESLint, Prettier, TypeScript, and env validation

Phase 2: Authentication

- Signup, login, logout, and refresh token routes
- JWT access/refresh cookies using HTTP-only cookies
- bcrypt password hashing
- Role middleware for admin/client pages

Phase 3: Multi-tenancy

- `Tenant` model added; `Company` remains as product-facing alias
- `tenantId` added to users, clients, invoices, payments, settings, and payment methods
- API queries enforce tenant scope and client data scope

Phase 4: Clients and companies

- Company create/edit/disable UI and APIs
- Client create/edit/delete UI and APIs
- Client search and pagination
- Desktop table and mobile card layout for clients

Phase 5: Invoices

- Invoice create UI with dynamic line items
- Server-side subtotal, tax, total, paid, and balance calculations
- Invoice list/detail pages

Phase 6: PDFs

- HTML invoice template
- Puppeteer-first PDF rendering with PDFKit fallback
- Invoice PDF download route

Phase 7: Email

- Nodemailer SMTP transporter
- Invoice email route with PDF attachment
- Tenant/company SMTP fields in the data model

Phase 8: Manual payments

- `Payment` and `PaymentMethod` models
- Payment method CRUD APIs and settings UI
- Manual payment create/edit/delete
- Pending/confirmed/failed payment states
- Partial/full payment support
- Invoice balance and status recalculation
- Overpayment prevention

Phase 9: Client portal

- `/client/dashboard`
- `/client/invoices`
- `/client/invoices/[id]`
- `/client/payments`
- `/client/profile`
- Client data is filtered by both `tenantId` and `clientId`

Phase 10: UI/UX polish

- Consistent layout shell
- Responsive tables/cards
- Empty/loading/message states on core screens
- Status indicators for invoices and payments

Phase 11: Production readiness

- `.env.example` sanitized
- Build verified with `npm run build`
- Prettier configured
- Deployment notes updated in `README.md`

## Verified

```bash
npx tsc --noEmit --pretty false
npm run build
```

Both commands pass.
