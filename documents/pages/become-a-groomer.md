# Become a Groomer — `/become-a-groomer`

**File:** `app/become-a-groomer/page.tsx`
**Type:** Server Component (static)
**Auth required:** No

## Purpose

Groomer acquisition marketing page. Converts groomers to registrations. CTA points to `/register/groomer`.

## Metadata

```ts
title: "Become a Groomr — Less admin, more grooming"
description: "Join 2,400+ verified groomers. Online booking, automatic reminders, payments — all in one. Free to list."
```

## Sections

### 1. Hero
- `bg-alabaster-cream` with bottom border
- 2-col desktop: copy left, mock booking widget right (identical to landing page widget, 4 rows)
- `BecomeGroomerCTA` (client component) renders the primary CTA button
- Stats strip: 2,400+ / 38hrs / £0

### 2. Benefits (4 cards)
- 2-col grid on desktop
- Data in `BENEFITS` const array: `{ Icon, title, body }`
- Icons: `CalendarIcon`, `ScissorsIcon`, `ShieldIcon`, `FavoritesIcon`

### 3. Steps (4 cards — "Up and running by Friday")
- `bg-alabaster-cream` with border-y
- Data in `STEPS` const: `{ n, t, d }` — number, title, description
- Steps: List for free → Get discovered → Bookings come in → Get paid

### 4. Calculator
- 2-col: copy left, `CalculatorWidget` right
- `CalculatorWidget` is a client component (`_components/CalculatorWidget.tsx`) — interactive sliders for bookings/week and avg price, shows live take-home calculation

### 5. Groomer Testimonials
- 3-col grid on desktop
- `bg-sage-leaf/10` background
- Data in `GROOMER_TESTIMONIALS` const: `{ name, biz, text }`

### 6. FAQ
- `FaqAccordion` client component (`_components/FaqAccordion.tsx`) — expand/collapse
- Data passed as `faqs` prop from `FAQS` const: `{ q, a }[]`
- 4 questions: pricing, importing clients, calendar usage, payouts

### 7. Final CTA
- `bg-alabaster-cream` rounded block with gold blur blob behind
- `BecomeGroomerCTA` with custom label and className

## Key Components

| Component | File | Notes |
|---|---|---|
| `BecomeGroomerCTA` | `app/_components/BecomeGroomerCTA.tsx` | Client — navigates to `/register/groomer` (or Clerk sign-up if not authed) |
| `CalculatorWidget` | `_components/CalculatorWidget.tsx` | Client — two range sliders, computes earnings dynamically |
| `FaqAccordion` | `_components/FaqAccordion.tsx` | Client — toggle open/close per FAQ item |
| `Eyebrow`, `Badge` | `components/ui/` | Standard UI components |

## Data

All content hardcoded in const arrays. No Supabase queries. No auth.

## Editing Notes

- CTAs: `BecomeGroomerCTA` handles both authenticated (redirect to `/register/groomer`) and unauthenticated (Clerk modal) states — don't replace with a plain `<Link>`
- Calculator logic is in `CalculatorWidget.tsx` — edit slider ranges and fee calculation there
- FAQ items: edit `FAQS` array in `page.tsx`
- The mock booking widget is 4 rows (landing page has 3) — both are fully static JSX
