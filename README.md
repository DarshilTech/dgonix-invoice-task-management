# Invoxa — Invoice & CRM Platform

A multi-tenant invoice management and CRM web application built with Next.js 14, MongoDB, and Tailwind CSS.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | MongoDB + Mongoose |
| Styling | Tailwind CSS |
| UI Components | Headless UI v1.7, Lucide React |
| Auth | JWT (cookie-based, httpOnly) |
| Email | Nodemailer |
| Validation | Zod |
| Charts | Recharts |

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/                  # Auth pages (login, signup, reset-password)
│   ├── admin/                   # Admin panel
│   │   ├── dashboard/
│   │   ├── clients/             # Client list, create, edit
│   │   ├── invoices/            # Invoice list, create, edit, view
│   │   ├── payments/
│   │   ├── reports/
│   │   └── settings/
│   ├── client/                  # Client portal (public invoice view)
│   └── api/
│       ├── auth/                # login, signup, logout, reset-password
│       ├── clients/
│       ├── companies/
│       ├── company-config/
│       ├── dashboard/
│       ├── invoices/
│       ├── onboarding/
│       ├── payment-methods/
│       ├── payments/
│       ├── upload/
│       └── users/
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx         # Sidebar + layout wrapper
│   │   └── AppLogo.tsx
│   └── ui/
│       ├── ActionMenu.tsx       # Headless UI dropdown menu
│       ├── Combobox.tsx         # Searchable select (Headless UI)
│       ├── ConfirmModal.tsx     # Confirm/danger dialog (Headless UI Dialog)
│       ├── Select.tsx           # Styled listbox (Headless UI Listbox)
│       ├── Switch.tsx           # Toggle switch (Headless UI Switch)
│       ├── PageHeader.tsx       # Page title + breadcrumbs + actions bar
│       ├── StatusBadge.tsx
│       ├── DataTable.tsx
│       ├── EmptyState.tsx
│       └── Pagination.tsx
├── hooks/
│   ├── useDocumentTitle.ts      # Sets "<Page> | Invoxa" browser tab title
│   └── useDebouncedValue.ts
└── lib/
    ├── auth/                    # JWT helpers
    ├── db/
    │   ├── connect.ts
    │   └── models/
    │       ├── User.ts
    │       ├── Company.ts       # Tenant/company config
    │       ├── CompanyConfig.ts # Invoice settings per company
    │       ├── Client.ts
    │       ├── Invoice.ts
    │       ├── Payment.ts
    │       ├── PaymentMethod.ts
    │       └── Setting.ts
    ├── email/
    │   ├── transporter.ts
    │   └── templates.ts
    └── validation/              # Zod schemas
```

---

## Data Models

### User
- `email`, `password` (bcrypt hashed)
- `firstName`, `lastName` (optional)
- `role`: `admin` | `client`
- `companyIds[]`, `tenantId`
- `emailVerified`, `emailVerificationToken`, `emailVerificationExpiry`

### Company (Tenant)
- `name`, `email`, `phone`, `website`
- `address`, `city`, `state`, `zip`, `country`
- `logo`, `subdomain`, `language`
- `invoicePrefix`, `invoiceSequence` — per-tenant invoice numbering
- `ownerId` — links to User

### Client
- **Company Details**: `name`, `number`, `group`, `idNumber`, `vatNumber`, `website`, `phone`, `routingId`, `validVatNumber`, `taxExempt`, `classification`, `status`
- **Contact**: `firstName`, `lastName`, `email`, `contactPhone`, `addToInvoices`, `ccOnly`
- **Billing Address**: `billingStreet`, `billingApt`, `billingCity`, `billingState`, `billingPostalCode`, `billingCountry`
- **Shipping Address**: `shippingStreet`, `shippingApt`, `shippingCity`, `shippingState`, `shippingPostalCode`, `shippingCountry`
- Unique index: `{ tenantId, email }`

### Invoice
- `invoiceNumber` — unique per tenant via compound index `{ tenantId, invoiceNumber }`
- `status`: `draft` | `sent` | `paid` | `overdue` | `cancelled`
- `clientId`, `tenantId`, `lineItems[]`
- `subtotal`, `taxAmount`, `totalAmount`, `paidAmount`, `balanceAmount`
- `dueDate`, `issueDate`

### Payment
- `invoiceId`, `clientId`, `tenantId`
- `amount`, `method`, `reference`, `notes`
- `paymentDate`

---

## Authentication

- JWT stored in an `httpOnly` cookie (`token`)
- `src/middleware.ts` — protects `/admin/*` routes, redirects unauthenticated users to `/login`
- `src/lib/auth/` — `signToken`, `verifyToken`, `requireAuth` helpers used in API route handlers

### Auth Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/login` | Email + password → sets JWT cookie |
| POST | `/api/auth/signup` | Register → sends verification email |
| POST | `/api/auth/logout` | Clears cookie |
| POST | `/api/auth/reset-password` | Password reset flow |
| POST | `/api/auth/verify-email` | Confirm email via token |
| POST | `/api/auth/resend-verification` | Re-send verification email |

---

## API Reference

All admin API routes require the `token` cookie. Responses follow `{ success, data, error, pagination }`.

### Clients

| Method | Path | Description |
|---|---|---|
| GET | `/api/clients` | List clients (pagination, search, status filter) |
| POST | `/api/clients` | Create client |
| GET | `/api/clients/:id` | Get single client |
| PUT | `/api/clients/:id` | Update client |
| DELETE | `/api/clients/:id` | Delete client |

### Invoices

| Method | Path | Description |
|---|---|---|
| GET | `/api/invoices` | List invoices (pagination, filters) |
| POST | `/api/invoices` | Create invoice (auto-increments per-tenant sequence) |
| GET | `/api/invoices/:id` | Get invoice with line items |
| PUT | `/api/invoices/:id` | Update invoice |
| DELETE | `/api/invoices/:id` | Delete invoice |

### Payments

| Method | Path | Description |
|---|---|---|
| GET | `/api/payments` | List payments |
| POST | `/api/payments` | Record payment |
| DELETE | `/api/payments/:id` | Delete payment |

### Companies

| Method | Path | Description |
|---|---|---|
| GET | `/api/companies` | List companies owned by authenticated user |
| POST | `/api/companies` | Create company |
| PUT | `/api/companies/:id` | Update company |

### Dashboard

| Method | Path | Description |
|---|---|---|
| GET | `/api/dashboard/stats` | Counts + financial totals for the admin's companies |
| GET | `/api/dashboard/chart` | Monthly revenue data for chart |
| GET | `/api/dashboard/recent` | Recent invoices + payments |

---

## Invoice Numbering

Each company maintains its own `invoiceSequence` counter. On invoice creation:

1. Find the highest existing `invoiceNumber` for that tenant
2. Atomically update `Company.invoiceSequence` using an aggregation pipeline `$max` so it's always `>= existingMax + 1`
3. Format: `{prefix}-{sequence padded to 6 digits}` e.g. `INV-000001`

This ensures no duplicate invoice numbers per tenant, even when multiple companies share the same default prefix.

---

## UI Component Library

Built on **Headless UI v1.7** for accessible, unstyled primitives styled with Tailwind.

### `<Select options value onChange />`
Listbox-based styled dropdown. Accepts `{ value, label }[]` options.

### `<Combobox options value onChange placeholder />`
Searchable select with live filtering. Falls back gracefully when no match.

### `<ActionMenu items label />`
Dropdown `Menu` with `{ label, onClick, danger?, disabled? }` items. Renders as "Actions" button with chevron.

### `<Switch checked onChange label? size? />`
Toggle switch. `size="sm"` or `size="md"` (default). Optional `label` renders as `Switch.Group`.

### `<ConfirmModal open title description onConfirm onCancel danger? loading? />`
Modal dialog with backdrop blur. `danger=true` shows red trash icon + red confirm button.

### `<PageHeader title breadcrumbs actions? />`
Sticky-friendly header bar with breadcrumb trail and right-side action slot.

---

## Environment Variables

Create `.env.local`:

```env
MONGODB_URI=mongodb://localhost:27017/invoxa
JWT_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Email (Nodemailer)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=password
SMTP_FROM=noreply@example.com
```

---

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Type check
npx tsc --noEmit

# Build for production
npm run build
npm start
```

---

## Key Design Decisions

- **Multi-tenant by `tenantId`**: Every resource (client, invoice, payment) is scoped to a `tenantId`. All queries include a `tenantId` filter derived from the authenticated user's company ownership.
- **Companies as infrastructure**: The companies module has no frontend page — it is accessed only via API, used internally by clients, invoices, and settings.
- **Per-tenant invoice sequences**: Global unique index on `invoiceNumber` was replaced with a compound `{ tenantId, invoiceNumber }` index to prevent cross-company conflicts.
- **Headless UI for interactions**: All dropdowns, modals, and toggles use Headless UI primitives for keyboard navigation and ARIA compliance without fighting native browser defaults.
