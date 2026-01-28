# Ushnik-Swarna – Jewellery & Digital Gold Platform

A full-stack jewellery e-commerce and digital gold platform built with Next.js. Buy gold ornaments online, invest in digital gold, join gold/silver savings schemes, and manage everything through a unified admin panel—inspired by Joyalukkas and Lalitha Jewellery, with added digital gold and savings features.

---

## Overview

**Ushnik-Swarna** combines traditional jewellery retail with digital gold and savings schemes. Customers can browse and book ornaments, buy/sell digital gold (sell subject to admin approval), enrol in monthly gold/silver schemes, and track wallet and scheme balances. Admins manage products, orders, sell requests, schemes, and users.

---

## Description

- **Full-stack jewellery website** – Public storefront for ornaments, schemes, and digital gold.
- **Buy gold ornaments online** – Product catalog, filters, and booking with store pickup options.
- **Digital gold** – Buy anytime; sell via request → admin approval → payout.
- **Gold & silver savings schemes** – Monthly plans (e.g. 6/11/24 months); track balance and maturity.
- **Admin approval flows** – Sell requests, scheme enrolments, and other sensitive operations.
- **Order booking + store pickup** – Book ornaments, pay/part-pay, collect from store.

---

## Architecture

Next.js App Router structure:

| Route Group | Path | Purpose |
|-------------|------|---------|
| **Public website** | `app/(website)` | Home, products, schemes, digital gold, about, contact |
| **Admin panel** | `app/(admin)/admin` | Admin-only management (products, orders, users, schemes, sell requests) |
| **User dashboard** | `app/(admin)/dashboard` | Logged-in users: orders, wallet, schemes, sell requests |

---

## User Features

- **Browse jewellery** – Categories, search, filters, product detail pages.
- **Book ornaments** – Add to cart, book orders, choose store pickup.
- **Buy digital gold** – Add to wallet via payment; view balance.
- **Sell digital gold** – Submit sell request → admin reviews → approval → payout to bank/wallet.
- **Join savings schemes** – Enrol in gold/silver monthly plans; view instalments and maturity.
- **Track wallet & scheme balance** – Dashboard for wallet history, scheme progress, and statements.

---

## Admin Features

- **Approve sell requests** – Review, approve, or reject digital gold sell requests.
- **Manage schemes** – Create/edit gold/silver schemes, tenures, instalment amounts.
- **Manage users** – View users, roles, status; basic user administration.
- **Product management** – CRUD for jewellery products, categories, images, pricing.
- **Order management** – View, update status, handle store pickup and cancellations.

---

## UI / Theme

- **Theme:** Light only (no dark mode).
- **Primary colour:** Gold `#D4AF37` (or similar) for CTAs, highlights, accents.
- **Style:** Premium jewellery aesthetic—clean layouts, quality imagery, trust-oriented UI.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Framework** | Next.js 16 (App Router) | SSR, API routes, routing |
| **Language** | TypeScript | Type safety |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **UI** | shadcn/ui, Radix UI | Buttons, forms, dialogs, tables |
| **Database** | Firebase Firestore | Products, orders, users, wallet, schemes |
| **Auth** | Firebase Auth | Login, roles |
| **Validation** | Zod + React Hook Form | Forms, API validation |
| **Media** | Cloudinary | Product images, uploads |
| **Email** | Nodemailer | Notifications, OTP (if used) |
| **Charts** | Recharts | Dashboard and reports |

---

## Project Structure

```
Ushnik-Swarna/
├── app/
│   ├── (website)/           # Public website
│   │   ├── page.tsx         # Home
│   │   ├── products/        # Jewellery catalog
│   │   ├── schemes/         # Savings schemes
│   │   ├── digital-gold/    # Digital gold buy/sell
│   │   ├── about/
│   │   ├── contact/
│   │   └── ...
│   ├── (admin)/
│   │   ├── admin/           # Admin panel
│   │   │   ├── products/
│   │   │   ├── orders/
│   │   │   ├── users/
│   │   │   ├── schemes/
│   │   │   ├── sell-requests/
│   │   │   └── ...
│   │   └── dashboard/       # User dashboard
│   │       ├── orders/
│   │       ├── wallet/
│   │       ├── schemes/
│   │       └── ...
│   ├── (login)/             # Login
│   └── api/                 # API routes
├── components/
├── lib/
├── context/
└── docs/
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Firebase project (Auth + Firestore)
- Cloudinary account (optional, for images)
- SMTP credentials (for emails)

### Installation

```bash
git clone <repository-url>
cd Ushnik-Swarna
npm install
```

### Environment Variables

Create `.env.local` and configure:

```env
# Firebase (client)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (server only)
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=

# Site
NEXT_PUBLIC_SITE_URL=https://ushnik-swarna.com
NEXT_PUBLIC_CONTACT_EMAIL=
NEXT_PUBLIC_CONTACT_PHONE=

# Email (server only)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=

# Cloudinary (optional)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### Run

```bash
npm run dev
```

- **Website:** [http://localhost:3000](http://localhost:3000)
- **Admin:** [http://localhost:3000/admin](http://localhost:3000/admin)
- **User dashboard:** [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- **Login:** [http://localhost:3000/login](http://localhost:3000/login)

---

## Deployment

### Build

```bash
npm run build
npm start
```

### Checklist

- [ ] All required env variables set in production.
- [ ] **Admin protection:** Admin routes guarded by role checks (e.g. middleware + API checks).
- [ ] **Role-based routing:** Redirect users without `admin` role away from `/admin`.
- [ ] Firestore rules restrict access by role where applicable.
- [ ] Cloudinary and SMTP tested in production-like environment.

### Recommended Platforms

- **Vercel** – Next.js optimised.
- **Netlify** – Alternative.
- **Self-hosted** – Node + reverse proxy (e.g. Docker).

---

## Documentation

- [DESIGN_PLAN.md](./DESIGN_PLAN.md) – User journeys, workflows, data model, API overview.
- [TODO.md](./TODO.md) – Phased roadmap and tasks.
- [docs/](./docs/) – API details, implementation notes.

---

## License

Private. All rights reserved.
