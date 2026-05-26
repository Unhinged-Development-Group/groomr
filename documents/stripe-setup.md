# Stripe Payment Infrastructure — Setup Guide

## Status: TEST MODE ✅

All Stripe keys in `.env.local` are `sk_test_` / `pk_test_` — safe to test with.
**Do not switch to live keys until ready to launch.**

---

## What's been built

| File | Purpose |
|---|---|
| `lib/stripe.ts` | Server-side Stripe singleton + fee helpers |
| `app/actions/stripe-connect.ts` | Groomer Express account onboarding |
| `app/actions/payments.ts` | Payment intent creation + refunds |
| `app/api/webhooks/stripe/route.ts` | Stripe → Supabase event handler |
| `app/dashboard/groomer/_components/StripeConnectBanner.tsx` | Groomer dashboard CTA |
| `supabase/migrations/20260526000001_stripe_connect_columns.sql` | New columns on `groomer_profiles` |

---

## Architecture: Destination Charges

```
Customer (owner) pays → Groomr Stripe account
                     → Stripe auto-splits:
                         - 8% → Groomr (application_fee_amount)
                         - 92% → Groomer's connected Express account
```

Groomr is the **merchant of record**. Disputes and refunds go through Groomr's account.
Groomer payouts are handled automatically by Stripe (daily, to their bank).

---

## Database migration — APPLY BEFORE TESTING

Run this in the Supabase dashboard (SQL editor) or via `supabase db push`:

```
supabase/migrations/20260526000001_stripe_connect_columns.sql
```

Adds `stripe_charges_enabled` and `stripe_details_submitted` to `groomer_profiles`.

---

## Webhook setup (required for payment events)

### Local development

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Run: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
3. Copy the webhook signing secret it outputs (starts with `whsec_`)
4. Add to `.env.local`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

### Production (Vercel)

1. Go to Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL: `https://groomr.uk/api/webhooks/stripe`
3. Events to subscribe:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `account.updated`
   - `transfer.created`
4. Copy the signing secret → add as `STRIPE_WEBHOOK_SECRET` in Vercel env vars

---

## Connect platform settings (one-time, in Stripe Dashboard)

Go to: **Dashboard → Settings → Connect settings**

1. **Branding** — add Groomr logo + brand colour (`#2c3e50`)
2. **Express dashboard** — enable so groomers can view their own payouts
3. **Payouts** — confirm daily automatic payouts are enabled
4. **Statement descriptor** — set to `GROOMR`

---

## Groomer onboarding flow (implemented)

1. Groomer visits their dashboard
2. `StripeConnectBanner` shows "Connect Stripe" CTA (only to salon owners, not team members)
3. Click → calls `createConnectOnboardingLink()` → creates Stripe Express account
4. Groomer is redirected to Stripe's hosted onboarding (Stripe handles ID + bank details)
5. After completion → redirects to `/dashboard/groomer?stripe=success`
6. Webhook `account.updated` fires → syncs `charges_enabled` to Supabase
7. Banner updates to "Stripe payouts active" state

---

## Payment flow (ready for booking UI to consume)

```typescript
// After createAppointment() returns appointmentId:
const result = await createBookingPaymentIntent({ appointmentId });
if ("error" in result) { /* show error */ }

// result.clientSecret → pass to Stripe.js PaymentElement to confirm
// result.amountPence → show to user (deposit or full amount)
```

Deposit policy comes from `groomer_profiles.deposit_type`:
- `'none'` → full price charged at booking
- `'percentage'` → `deposit_percentage`% charged; remainder at appointment
- `'full'` → full price charged at booking

---

## Commission

- **8%** taken as `application_fee_amount` on every PaymentIntent
- Stored in `payments.platform_fee_pct` and `payments.platform_fee_pence`
- Groomer's net is in `payments.groomer_payout_amount_pence`
- Founding groomer 0% commission period: handled by setting `application_fee_amount = 0` (TODO: add `commission_override_pct` column or check a flag)

---

## Test cards (Stripe test mode)

| Card | Result |
|---|---|
| `4242 4242 4242 4242` | Success |
| `4000 0025 0000 3155` | Requires 3D Secure |
| `4000 0000 0000 9995` | Always declines |

Any future date, any CVC, any postcode.

---

## TODO before launch

- [ ] Apply migration `20260526000001_stripe_connect_columns.sql`
- [ ] Set up webhook in Stripe Dashboard (prod URL)
- [ ] Set `STRIPE_WEBHOOK_SECRET` in Vercel env vars
- [ ] Configure Connect platform branding in Stripe Dashboard
- [ ] Build booking checkout UI (PaymentElement)
- [ ] Founding groomer commission override (0% for 6 months)
- [ ] Switch to live keys (`sk_live_` / `pk_live_`) on launch day
