# Arya Heritage — Production E-commerce Platform

Premium Indian wellness brand e-commerce built with **Next.js 15**, **Drizzle ORM**, **Neon PostgreSQL**, **Better Auth**, and **Razorpay** (cards, UPI, Google Pay, NetBanking, wallets).

---

## What changed from the original codebase

| Area | Before | After |
|---|---|---|
| Payment gateway | ❌ Stripe (leftover enum only) | ✅ **Razorpay** + UPI / Google Pay |
| Brand | Nike shoe store scaffold | Arya Heritage — Indian wellness |
| Products | Nike shoes (no seed data) | 14 Indian wellness products seeded |
| Cart | Basic Zustand stub | Full cart with shipping threshold + drawer |
| Checkout | No checkout flow | 3-step: review → address → Razorpay |
| Confirmation | None | Success + failed pages with order summary |
| Currency | USD (`$`) | INR (`₹`) with proper formatting |
| Design tokens | Generic Tailwind | Full `#001F4D` / `#D4AF37` / `#FAF7F0` token system |
| API routes | Auth only | `/verify`, `/webhook`, `/api/payments/*` |
| Webhook | None | Idempotent `payment.captured` + `payment.failed` |
| Refunds | None | `refundOrderPayment()` — Razorpay Refunds API |

---

## Quick Start

### 1. Clone & install
```bash
git clone <your-repo>
cd e-commerce-main
npm install
```

### 2. Environment variables
```bash
cp .env.example .env.local
# Fill in all values — see .env.example for descriptions
```

Required variables:
```
DATABASE_URL           # Neon PostgreSQL connection string
BETTER_AUTH_SECRET     # Random 32+ char string
BETTER_AUTH_URL        # Your domain (http://localhost:3000 in dev)
RAZORPAY_KEY_ID        # From Razorpay Dashboard → Settings → API Keys
RAZORPAY_KEY_SECRET    # Never expose this in the browser
RAZORPAY_WEBHOOK_SECRET # From Razorpay Dashboard → Settings → Webhooks
NEXT_PUBLIC_SITE_URL   # Your domain
NEXT_PUBLIC_WHATSAPP_NUMBER  # E.164 without '+', e.g. 919876543210
```

### 3. Database
```bash
npm run db:push     # Push schema to Neon (first time)
npm run db:seed     # Seed 14 Indian wellness products
```

### 4. Development
```bash
npm run dev
```

Open http://localhost:3000

---

## Razorpay Setup

### Test mode (development)
1. Create a free account at https://dashboard.razorpay.com
2. Settings → API Keys → **Generate Test Key**
3. Copy `rzp_test_XXXXX` (key ID) and the secret into `.env.local`

### Webhook (required for reliable payment confirmation)
1. Razorpay Dashboard → Settings → Webhooks → **Add New Webhook**
2. URL: `https://your-domain.com/api/payments/webhook`
3. Subscribe to: `payment.captured`, `payment.failed`
4. Copy the generated **Webhook Secret** into `RAZORPAY_WEBHOOK_SECRET`

> **Why both webhook and client verify?**
> The client-side `/api/payments/verify` gives instant UX feedback.
> The webhook is the authoritative, server-to-server confirmation that fires
> even if the customer closes the browser mid-payment. Both call the same
> idempotent `confirmRazorpayPayment()` — whichever fires first wins, the
> other is a safe no-op (enforced by a unique index on `razorpay_payment_id`).

### UPI / Google Pay
No extra configuration needed — Razorpay Checkout automatically shows UPI and Google Pay as payment options when the customer's device supports them. On mobile, it detects installed UPI apps (GPay, PhonePe, Paytm, etc.) and shows deep-link intent buttons.

### Going LIVE
1. Complete Razorpay KYC at https://dashboard.razorpay.com → Account & Settings
2. Switch `rzp_test_*` keys to `rzp_live_*` in your production env
3. Update the webhook URL to your production domain

---

## Payment Flow

```
Cart  →  /checkout (3 steps)
          ├─ Step 1: Review cart items
          ├─ Step 2: Delivery details (name, email, phone, address)
          └─ Step 3: Pay

POST /api/payments/create-order (Server Action)
  └─ Creates internal DB order (status: pending)
  └─ Creates Razorpay order server-side (key secret never leaves server)
  └─ Returns { razorpayOrderId, keyId, amountPaise } to browser

RazorpayCheckout component
  └─ Loads checkout.js from Razorpay CDN
  └─ Opens payment modal (cards / UPI / GPay / NetBanking / wallets)
  └─ On success → POST /api/payments/verify

POST /api/payments/verify
  └─ Validates HMAC-SHA256 checkout signature
  └─ Fetches payment status from Razorpay API (defense in depth)
  └─ confirmRazorpayPayment() — idempotent via DB unique index
  └─ Decrements stock, marks order: paid
  └─ Redirects → /checkout/success?orderId=xxx

POST /api/payments/webhook  (async, from Razorpay servers)
  └─ Verifies X-Razorpay-Signature header
  └─ Handles payment.captured → same confirmRazorpayPayment()
  └─ Handles payment.failed → recordFailedPayment()
```

---

## Project Structure

```
src/
├── app/
│   ├── (root)/
│   │   ├── page.tsx                  # Homepage
│   │   ├── products/
│   │   │   ├── page.tsx              # Product listing
│   │   │   └── [id]/page.tsx         # Product detail + Add to Cart
│   │   └── checkout/
│   │       ├── page.tsx              # 3-step checkout
│   │       ├── success/page.tsx      # Order confirmation
│   │       └── failed/page.tsx       # Payment failure
│   ├── api/
│   │   ├── auth/[...all]/            # Better Auth handler
│   │   └── payments/
│   │       ├── verify/route.ts       # Client-side payment verification
│   │       └── webhook/route.ts      # Razorpay async webhook
│   └── globals.css                   # Brand design tokens + utility classes
│
├── components/
│   ├── Navbar.tsx                    # Brand nav + cart badge
│   ├── Footer.tsx                    # Brand footer + WhatsApp CTA
│   ├── CartDrawer.tsx                # Slide-out cart with shipping progress
│   ├── AddToCartButton.tsx           # Client component for product page
│   └── RazorpayCheckout.tsx          # Loads Razorpay.js + opens modal
│
├── config/
│   └── brand.ts                      # Single source of truth for brand config
│
├── lib/
│   ├── actions/
│   │   ├── order.ts                  # createCheckoutOrder, getOrderSummary
│   │   └── product.ts                # getAllProducts, getProduct, etc.
│   ├── db/
│   │   ├── schema/
│   │   │   ├── orders.ts             # orders + orderItems (Razorpay fields)
│   │   │   ├── payments.ts           # payments (Razorpay lifecycle statuses)
│   │   │   └── ...                   # users, products, variants, etc.
│   │   └── seed.ts                   # 14 Indian wellness products
│   └── payments/
│       ├── money.ts                  # rupeesToPaise, paiseToRupees, formatINR
│       └── razorpay/
│           ├── client.ts             # Server-only Razorpay SDK singleton
│           ├── signature.ts          # verifyCheckoutSignature, verifyWebhookSignature
│           └── fulfillment.ts        # confirmRazorpayPayment (idempotent), refundOrderPayment
│
└── store/
    ├── cart.ts                       # Zustand cart (persisted, with shipping calc)
    └── variant.ts                    # Variant picker state
```

---

## Brand Config

All brand identity, contact details, and business rules live in one file:

```typescript
// src/config/brand.ts
export const brand = {
  name: "Arya Heritage",
  freeShippingThreshold: 999,    // ₹999
  standardShippingFee: 79,       // ₹79
  categories: [
    { name: "Soaps", slug: "soaps", ... },
    { name: "Attars", slug: "attars", ... },
    // ...
  ],
};
```

> **Rename**: Change only `src/config/brand.ts` to rebrand. Nothing else hardcodes the name.

---

## Design System

| Token | Value | Usage |
|---|---|---|
| `--navy` | `#001F4D` | Primary background, buttons, text |
| `--gold` | `#D4AF37` | Accents, CTAs, borders on hover |
| `--cream` | `#FAF7F0` | Page background |
| `--cream-dark` | `#F0EAD9` | Section backgrounds |
| `--sand` | `#E8DCC8` | Borders, dividers |
| `--text` | `#1F2937` | Body text |

---

## Deploying to Vercel + Neon

```bash
# 1. Connect repo to Vercel
# 2. Add all env vars from .env.example in Vercel Dashboard
# 3. Set up Neon database at console.neon.tech
# 4. Push schema:
npx drizzle-kit push

# 5. Seed (run once from local, pointing at prod DATABASE_URL):
npm run db:seed

# 6. Configure Razorpay webhook URL to your production domain
```

---

## Future Additions (Architecture is Ready)

- **Refunds** — `refundOrderPayment(orderId)` in `fulfillment.ts` is production-ready
- **COD** — `payment_method` enum includes `'cod'`; add a COD flow without touching the Razorpay path
- **Admin dashboard** — all order/payment data is cleanly modelled in Drizzle
- **Email confirmations** — hook into the `paid` order status in `confirmRazorpayPayment`
- **WhatsApp order updates** — `brand.contact.whatsappNumber` is wired through the brand config
- **Coupon codes** — `coupons` table is already in the schema
- **Wishlist** — `wishlists` table is in the schema
