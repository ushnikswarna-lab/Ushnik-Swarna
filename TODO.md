# Ushnik-Swarna – Roadmap

Scalable development roadmap. Use `[ ]` Pending, `[~]` In Progress, `[x]` Done.

---

## Phase 1 – Core Setup

- [ ] Auth – Firebase Auth (email/password, OTP if needed)
- [ ] Roles – `admin`, `user` (extend as needed)
- [ ] Routing – Route groups `(website)`, `(admin)/admin`, `(admin)/dashboard`; role-based guards
- [ ] Theme – Light-only UI; primary gold `#D4AF37`; premium jewellery styling
- [ ] Base layout – Public header/footer, dashboard shell, admin shell

---

## Phase 2 – Jewellery Store

- [ ] Product catalog – Categories, listing, filters, search
- [ ] Product detail – Images, specs, pricing, “Book” CTA
- [ ] Booking flow – Add to cart → checkout → order creation
- [ ] Orders – Order list, detail, status; store pickup option
- [ ] Store pickup – Store selection, pickup instructions

---

## Phase 3 – Digital Gold

- [ ] Wallet – User gold balance, credit/debit ledger
- [ ] Buy flow – Select amount → payment → credit to wallet
- [ ] Sell request system – User submits sell → pending review
- [ ] Admin approvals – Approve/reject sell requests; trigger payout
- [ ] Sell confirmation – Notify user; update wallet on approval

---

## Phase 4 – Savings Schemes

- [ ] Monthly schemes – Gold/silver plans (e.g. 6/11/24 months)
- [ ] Scheme enrolment – User joins plan; first instalment
- [ ] Instalment tracking – Due dates, paid status, balance
- [ ] Scheme dashboard – User view of active schemes, maturity
- [ ] Auto debit (future) – Optional auto-debit for instalments
- [ ] Maturity handling – Payout or jewellery redemption (future)

---

## Phase 5 – Admin Dashboard

- [ ] User management – List users, roles, status; basic admin actions
- [ ] Sell requests – List, filter, approve/reject with notes
- [ ] Products – CRUD, categories, images, pricing
- [ ] Orders – List, filters, status updates, store pickup
- [ ] Schemes – Create/edit schemes; view enrolments
- [ ] Reports – Sales, digital gold, schemes (high-level metrics)

---

## Phase 6 – Payments

- [ ] Razorpay integration – Orders, digital gold buy, scheme instalments
- [ ] Wallet ledger – Audit trail for wallet credits/debits
- [ ] Payout flow – Bank/wallet payout for approved sell requests (manual or via Razorpay)

---

## Phase 7 – Security & Scale

- [ ] Audit logs – Key admin actions (approvals, user changes, etc.)
- [ ] Rate limits – API and auth endpoints
- [ ] Monitoring – Errors, latency; optional APM
- [ ] Firestore rules – Role-based read/write; index optimisation

---

*Update status as work progresses. Add sub-tasks under each item as needed.*
