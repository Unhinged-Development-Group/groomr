# Groomr Policy Documents

Registry of all policy HTML documents. Update this file whenever a document is created, versioned, or retired.

---

## Document Registry

| Document | URL | File | Version | Last Updated | Editor | Stylesheet |
|---|---|---|---|---|---|---|
| Platform Terms of Use | `/terms/platform` | `terms-platform.html` | 1 | June 2026 | Andrew Hughes | `policy.css` ✓ |
| Owner Terms | `/terms/owner` | `terms-owner.html` | 0.1 | May 2026 | Andrew Hughes | `policy.css` ✓ |
| Groomer Terms | `/terms/groomer` | `terms-groomer.html` | 0.1 | May 2026 | Andrew Hughes | `policy.css` ✓ |
| Privacy Policy | `/privacy-policy` | `privacy-policy.html` | 0.1 | May 2026 | Andrew Hughes | `policy.css` ✓ |
| Cookie Policy | `/cookie-policy` | `cookie-policy.html` | 0.1 | May 2026 | Andrew Hughes | `policy.css` ✓ |
| Acceptable Use Policy | `/acceptable-use` | `acceptable-use.html` | 0.1 | May 2026 | Andrew Hughes | `policy.css` ✓ |
| Groomer Verification Policy | `/verification-policy` | `verification-policy.html` | 1.0 | May 2026 | Andrew Hughes | `policy.css` ✓ |
| Groomer Sign-Up Incentive Policy | `/groomer-sign-up-incentive` | `groomer-sign-up-incentive.html` | 1 | June 2026 | Andrew Hughes | `policy.css` ✓ |

> **Stylesheet column:** `policy.css` ✓ = uses the shared external stylesheet. `inline (legacy)` = has its own embedded `<style>` block and predates the component library. Migrate by removing the `<style>` block and adding `<link rel="stylesheet" href="/policies/policy.css">`.

---

## App Wiring

Each document requires three things in the Next.js app:

| Document | Route handler | Public route in `proxy.ts` | Footer link |
|---|---|---|---|
| Platform Terms of Use | `app/terms/platform/route.ts` | `/terms(.*)` | — |
| Owner Terms | `app/terms/owner/route.ts` | `/terms(.*)` | — |
| Groomer Terms | `app/terms/groomer/route.ts` | `/terms(.*)` | — |
| Privacy Policy | `app/privacy-policy/route.ts` | `/privacy-policy(.*)` | ✓ `SiteFooter.tsx` |
| Cookie Policy | `app/cookie-policy/route.ts` | `/cookie-policy(.*)` | ✓ `SiteFooter.tsx` |
| Acceptable Use Policy | `app/acceptable-use/route.ts` | `/acceptable-use(.*)` | ✓ `SiteFooter.tsx` |
| Groomer Verification Policy | `app/verification-policy/route.ts` | `/verification-policy(.*)` | — |

---

## Adding a New Document

1. Copy `template.html` → `public/policies/your-filename.html`
2. Work through all `TODO:` markers in the file
3. Create `app/your-route/route.ts` pointing to `public/policies/your-filename.html`
4. Add `/your-route(.*)` to the public routes list in `proxy.ts`
5. Add a row to this table
6. If it should appear in the site footer, add it to `app/_components/SiteFooter.tsx`

---

## Versioning

When making a material change to an existing document:

1. Increment the version number in the HTML title block and print cover
2. Update the Last Updated and Editor columns in this table
3. If the change affects user rights or obligations, notify users per the Terms (30 days notice, or shorter if required by law / security)

---

## Legacy Migration

All documents now use `policy.css` ✓. If you create a new document from scratch using the old inline approach, migrate it using the steps below.

To migrate a legacy document:
1. Open the file and delete the entire `<style>...</style>` block
2. Add `<link rel="stylesheet" href="/policies/policy.css">` before `</head>`
3. Replace any class names that differ from the component library (see README.md)
4. Test print layout — the legacy print CSS differs from `policy.css`
5. Update the Stylesheet column in this table to `policy.css` ✓
