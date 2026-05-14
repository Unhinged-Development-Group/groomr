# Groomer Registration — `/register/groomer`

**File:** `app/register/groomer/page.tsx`
**Wizard:** `app/register/groomer/_components/GroomerWizard.tsx`
**Type:** Async Server Component (page) + Client Component (wizard)
**Auth required:** No — account creation is step 0 of the wizard

## Purpose

Multi-step registration wizard for new groomers. Creates a Clerk account (if needed), then collects business details, services, availability, and verification info. On completion, writes to Supabase.

## Server Component (`page.tsx`)

Calls `currentUser()` to check if the user is already signed in.
- If signed in: pre-fills `initialName` and `initialEmail` from Clerk user data, sets `startAuthenticated={true}` (skips step 0)
- If not signed in: passes empty strings, `startAuthenticated={false}` (shows Clerk sign-up step first)

Renders `<GroomerWizard>` with these props.

## Wizard Steps

6 steps total (0–5). Step 0 is skipped when already authenticated.

| Step | ID | Content |
|---|---|---|
| 0 | `account` | Clerk `<SignUp>` component (`routing="hash"`, redirects back to `/register/groomer`) |
| 1 | `you` | Full name, phone, email |
| 2 | `biz` | Trading name, business type (Studio/Home/Mobile), address (line1, line2, city, postcode), radius slider (mobile only, 1–30 miles) |
| 3 | `services` | Preset service checkboxes (17 options) + price input per service, custom service add/remove, deposit policy (none/percentage/full) |
| 4 | `avail` | Day toggles (Mon–Sun), time inputs per active day, minimum notice slider (0–72h) |
| 5 | `verify` | Insurance upload placeholder (disabled), bank details info, launch button |

## State

All form data lives in a single `FormState` object in `GroomerWizard`. State is updated via a generic `set<K>(k, v)` helper.

```ts
interface FormState {
  fullName, phone, email           // step 1
  biz, type, addressLine1..., radius  // step 2
  selectedServices, servicePrices, customServices, depositType, depositPercentage  // step 3
  days, lead                       // step 4
}
```

## Navigation

- Left sidebar: sticky step rail with progress bar (`groomr-gold`) and step list
  - Completed steps show `CheckIcon` in sage-leaf circle
  - Active step: deep-slate circle
  - Future steps: disabled, 50% opacity
  - Authenticated users cannot click back to step 0
- Right panel: current step form
- "Back" / "Continue" / "Launch My Profile" buttons at the bottom
  - Back: `setStep(Math.max(firstStep, step - 1))`
  - Continue: `setStep(step + 1)`
  - Launch (last step): calls `handleLaunch()`
- Step 0 (Clerk SignUp): no nav buttons — Clerk handles its own submit and redirects

## Submission (`handleLaunch`)

Uses `useTransition`. Calls `registerGroomer()` server action (`app/actions/groomer-registration.ts`) with:
- Personal info, business info, services (preset + custom merged), deposit config, availability days/hours, lead hours

The server action:
1. Adds `groomer` role to `profiles.roles`
2. Inserts `groomer_profiles` row (`is_listed: true`, `is_verified: false`)
3. Inserts rows into `services` table
4. Inserts rows into `availability` table
5. Redirects to `/dashboard/groomer`

## Key Constants

- `PRESET_SERVICES` — 17 service name strings (Bath & Brush, Full Groom, Hand-Strip, etc.)
- `BIZ_TYPES` — Studio, Home, Mobile options
- `DEFAULT_DAYS` — Mon, Tue, Thu, Fri, Sat on; Wed, Sun off; all 09:00–17:00
- `DAY_LABELS` — `{ mon: "Mon", ... }`

## Editing Notes

- To add a preset service: append to `PRESET_SERVICES` array
- To add a wizard step: add to `STEPS` array, add a conditional render block `{step === N && ...}`, update `isLast` logic if needed
- The radius slider only shows when `form.type === "mobile"` — intentional, studio/home groomers don't need it
- Insurance upload on step 5 is `disabled` — it's a placeholder for future file upload functionality
- Mobile van groomers submit `radiusMiles: form.radius`; studio/home submit `radiusMiles: 0`
- `depositPercentage` dropdown options: 10, 15, 20, 25, 30, 33, 50%
