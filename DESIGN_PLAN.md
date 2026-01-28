# Ushnik-Swarna – Design Plan

Design plan for the **Ushnik-Swarna** jewellery e-commerce and digital gold platform. Covers user journeys, admin workflows, digital gold and scheme lifecycles, database concepts, and API modules.

---

## 1. Project Overview

**Ushnik-Swarna** is a full-stack jewellery platform with:

- **Jewellery store** – Browse, book ornaments, store pickup.
- **Digital gold** – Buy anytime; sell via request → admin approval.
- **Savings schemes** – Gold/silver monthly plans; track balance and maturity.
- **Admin panel** – Products, orders, users, schemes, sell requests.

Inspired by Joyalukkas / Lalitha Jewellery, with added digital gold and savings.

---

## 2. User Journeys

### 2.1 Browse & Book Jewellery

```
[Landing] → [Products / Categories] → [Product Detail] → [Add to Cart]
    → [Checkout] → [Payment] → [Order Confirmed] → [Store Pickup]
```

- User browses categories, applies filters, opens product detail.
- Adds to cart, proceeds to checkout, pays (e.g. Razorpay).
- Order created; user selects store pickup.
- Email confirmation; user collects from store.

### 2.2 Buy Digital Gold

```
[Digital Gold Page] → [Enter Amount] → [Payment] → [Wallet Credited]
    → [Dashboard: Wallet Balance]
```

- User enters amount, pays; balance is credited to wallet.
- Transaction recorded in wallet ledger.

### 2.3 Sell Digital Gold

```
[Dashboard: Wallet] → [Sell Gold] → [Enter Amount + Bank Details] → [Submit Request]
    → [Status: Pending] → [Admin Approves] → [Payout Initiated] → [Wallet Debited]
```

- User submits sell request with amount and bank details.
- Request is “pending” until admin approves.
- On approval: payout initiated, wallet debited, user notified.

### 2.4 Join Savings Scheme

```
[Schemes Page] → [Choose Plan] → [Enrol] → [Pay First Instalment]
    → [Dashboard: My Schemes] → [Pay Instalments] … → [Maturity]
```

- User selects a scheme (e.g. 11‑month gold), enrols, pays first instalment.
- Subsequent instalments paid via dashboard (or future auto-debit).
- On maturity: gold redemption or payout as per scheme rules.

---

## 3. Admin Workflows

### 3.1 Sell Request Approval

```
[Admin: Sell Requests] → [View Pending] → [Review Amount, User, Bank]
    → [Approve / Reject]
        → Approve: [Trigger Payout] → [Debit Wallet] → [Notify User]
        → Reject: [Notify User] → [Optional Reason]
```

### 3.2 Order Management

```
[Admin: Orders] → [List / Filter] → [View Detail] → [Update Status]
    → [Confirm] / [Ready for Pickup] / [Picked Up] / [Cancel]
```

### 3.3 Product Management

```
[Admin: Products] → [Add / Edit / Delete] → [Categories, Images, Pricing]
    → [Publish] → [Visible on Website]
```

### 3.4 Scheme Management

```
[Admin: Schemes] → [Create / Edit] → [Name, Type, Tenure, Instalment]
    → [Activate] → [Users Can Enrol]
[Admin: Enrolments] → [View Enrolments] → [Track Instalments]
```

### 3.5 User Management

```
[Admin: Users] → [List / Search] → [View Profile] → [Edit Role / Status]
```

---

## 4. Digital Gold Lifecycle

```
                    ┌─────────────────┐
                    │   USER BUYS     │
                    │   (Payment)     │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐     ┌─────────────────┐
                    │  WALLET         │────►│  USER SELL      │
                    │  (Balance +     │     │  REQUEST        │
                    │   Ledger)       │     │  (Pending)      │
                    └─────────────────┘     └────────┬────────┘
                             ▲                       │
                             │                       ▼
                    ┌────────┴────────┐     ┌─────────────────┐
                    │  CREDIT         │     │  ADMIN          │
                    │  (Buy success)  │     │  APPROVE/REJECT │
                    └─────────────────┘     └────────┬────────┘
                                                     │
                              ┌──────────────────────┴──────────────────────┐
                              │                                               │
                              ▼                                               ▼
                    ┌─────────────────┐                             ┌─────────────────┐
                    │  APPROVE        │                             │  REJECT         │
                    │  → Payout       │                             │  → Notify User  │
                    │  → Debit Wallet │                             │  → Request Done │
                    │  → Notify User  │                             └─────────────────┘
                    └─────────────────┘
```

- **Buy:** Payment → credit wallet → ledger entry.
- **Sell:** Request → admin decision → approve (payout + debit + notify) or reject (notify).

---

## 5. Scheme Lifecycle

```
[Scheme Created by Admin] → [Active]
        │
        ▼
[User Enrols] → [Pay 1st Instalment] → [Enrolled]
        │
        ▼
[Pay 2nd … Nth Instalment] (manual or future auto-debit)
        │
        ▼
[All Instalments Paid] → [Maturity]
        │
        ▼
[Redemption / Payout] (per scheme rules)
```

- Admin defines scheme (type, tenure, instalment amount).
- User enrols, pays instalments; system tracks due dates and paid status.
- At maturity, handle via jewellery redemption or cash payout as designed.

---

## 6. Database Design Concepts

Collections below are **conceptual**; adjust to your actual Firestore/API design.

### 6.1 Core Collections

| Collection | Purpose | Key Fields (Conceptual) |
|------------|---------|--------------------------|
| **users** | User profiles, roles | `uid`, `email`, `role`, `displayName`, `phone`, `createdAt` |
| **products** | Jewellery catalog | `name`, `slug`, `category`, `price`, `images`, `specs`, `active` |
| **categories** | Product categories | `name`, `slug`, `order` |
| **orders** | Booked orders | `userId`, `items`, `total`, `status`, `storePickup`, `createdAt` |
| **wallet** | Digital gold balance per user | `userId`, `balance`, `currency` |
| **walletLedger** | Wallet transactions | `userId`, `type` (credit/debit), `amount`, `refId`, `createdAt` |
| **sellRequests** | Digital gold sell requests | `userId`, `amount`, `status`, `bankDetails`, `adminNotes`, `resolvedAt` |
| **schemes** | Gold/silver plans | `name`, `type`, `tenureMonths`, `instalmentAmount`, `active` |
| **schemeEnrolments** | User scheme subscriptions | `userId`, `schemeId`, `instalments`, `paidCount`, `status`, `enrolledAt` |
| **instalments** | Scheme instalment records | `enrolmentId`, `dueDate`, `paidAt`, `amount`, `status` |

### 6.2 Supporting Collections

- **stores** – Store list for pickup (name, address, contact).
- **auditLogs** – Admin actions (who, what, when) for security and compliance.

### 6.3 Status Conventions

- **Orders:** `pending` | `confirmed` | `ready_for_pickup` | `picked_up` | `cancelled`
- **Sell requests:** `pending` | `approved` | `rejected`
- **Scheme enrolments:** `active` | `completed` | `cancelled`
- **Instalments:** `pending` | `paid` | `overdue`

---

## 7. API Modules

### 7.1 Public (Website)

| Module | Endpoints (Conceptual) | Purpose |
|--------|------------------------|---------|
| **Products** | `GET /api/products`, `GET /api/products/[category]`, `GET /api/products/[category]/[slug]` | Catalog, categories, product detail |
| **Schemes** | `GET /api/schemes`, `GET /api/schemes/[id]` | List active schemes, scheme detail |
| **Digital gold** | `GET /api/digital-gold/price` (if applicable) | Display buy/sell price |
| **Contact** | `POST /api/contact` | Contact form |
| **Stores** | `GET /api/stores` | Store list for pickup |

### 7.2 Authenticated (User)

| Module | Endpoints (Conceptual) | Purpose |
|--------|------------------------|---------|
| **Orders** | `GET /api/orders`, `GET /api/orders/[id]`, `POST /api/orders` | List, detail, create |
| **Wallet** | `GET /api/wallet`, `GET /api/wallet/ledger` | Balance, ledger |
| **Digital gold** | `POST /api/digital-gold/buy`, `POST /api/digital-gold/sell-request` | Buy, submit sell request |
| **Schemes** | `GET /api/schemes/my`, `POST /api/schemes/enrol`, `POST /api/schemes/[id]/pay` | My schemes, enrol, pay instalment |
| **Sell requests** | `GET /api/sell-requests` | User’s sell request list |

### 7.3 Admin Only

| Module | Endpoints (Conceptual) | Purpose |
|--------|------------------------|---------|
| **Products** | `GET/POST /api/admin/products`, `GET/PUT/DELETE /api/admin/products/[id]` | CRUD products |
| **Orders** | `GET /api/admin/orders`, `PATCH /api/admin/orders/[id]` | List, update status |
| **Users** | `GET /api/admin/users`, `PATCH /api/admin/users/[id]` | List, update role/status |
| **Sell requests** | `GET /api/admin/sell-requests`, `PATCH /api/admin/sell-requests/[id]` (approve/reject) | Manage requests |
| **Schemes** | `GET/POST /api/admin/schemes`, `GET/PUT/DELETE /api/admin/schemes/[id]` | CRUD schemes |
| **Reports** | `GET /api/admin/reports/*` | Sales, digital gold, schemes |

All admin routes must enforce **admin** role (e.g. middleware + API checks).

---

## 8. UI/UX Guidelines

- **Theme:** Light only; primary gold `#D4AF37`; premium jewellery aesthetic.
- **Trust:** Clear pricing, scheme terms, and sell approval flow.
- **Mobile-first:** Responsive layouts for store, dashboard, and admin.
- **Accessibility:** Semantic HTML, keyboard navigation, sufficient contrast.

---

## 9. Security Considerations

- **Auth:** Firebase Auth; session/token validation on protected routes and APIs.
- **Roles:** Enforce `admin` for `/admin` and admin APIs; redirect unauthorised users.
- **PII:** Encrypt or restrict access to bank details; compliant handling of sell requests.
- **Audit:** Log admin actions (approvals, user/product changes) in `auditLogs`.
- **Rate limiting:** Apply to auth, checkout, and sell-request APIs.

---

## 10. Success Metrics (Conceptual)

- Order conversion rate (visits → orders).
- Digital gold buy/sell volume and wallet growth.
- Scheme enrolments and completion rate.
- Sell request turnaround time (request → approval/rejection).
- Admin dashboard usage and error rates.

---

- **Last updated:** 2026-01-28  
- **Status:** Planning  
- **Version:** 1.0  
