# Groomr Policy Document Guide

How to build a new Groomr policy HTML document from scratch, using the shared component library.

**Stylesheets (load in this order):**
1. `public/policies/policy-tailwind.css` — compiled Tailwind v3 utilities; regenerate with `npm run build:policy-css` if you add new Tailwind classes
2. `public/policies/policy.css` — component library + local `@font-face` declarations (Fredoka, Nunito served from `/public/fonts/`)

**Canonical reference:** `public/policies/acceptable-use.html`  
**Output location:** `public/policies/` — e.g. `public/policies/my-new-policy.html`  
**Existing documents:** `terms-platform.html`, `terms-owner.html`, `terms-groomer.html`, `privacy-policy.html`, `cookie-policy.html`, `acceptable-use.html`, `verification-policy.html`, `disputes-policy.html`, `refunds-policy.html`, `code-of-conduct.html`, `personal-development-policy.html`, `employee-benefits-policy.html`, `holidays-policy.html`, `sickness-policy.html`, `remote-working-policy.html`, `travel-for-work-policy.html`, `expenses-policy.html`, `use-of-company-equipment-policy.html`

---

## Quick Start

1. Copy the shell below into a new file in `public/policies/`.
2. Update the `<title>`, header label, print cover content, and title block.
3. Build sections using the component classes documented here.
4. Add your sections to the TOC with matching `id` anchors.
5. Register a route handler in `app/[your-route]/route.ts` pointing to `public/policies/[your-file].html`.

> Do not copy any inline `<style>` block. Do not add Google Fonts link tags — fonts are served locally. Do not add a Tailwind CDN script — the compiled build is already in `policy-tailwind.css`.

---

## File Shell

```html
<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>YOUR DOCUMENT TITLE | Groomr</title>

    <link rel="icon" type="image/png" href="https://res.cloudinary.com/dr8adq7nl/image/upload/v1774753273/DEEP_SLATE_auun2o.png">

    <!-- Groomr Policy Stylesheets — order matters, do not swap -->
    <link rel="stylesheet" href="/policies/policy-tailwind.css">
    <link rel="stylesheet" href="/policies/policy.css">
</head>
<body class="font-nunito antialiased selection:bg-groomr-gold selection:text-deep-slate flex flex-col min-h-screen">

    <!-- Header — change label text only -->
    <header class="w-full bg-alabaster-cream border-b border-pebble-grey/20 sticky top-0 z-50">
        <div class="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
            <a href="https://groomr.uk" class="focus-ring rounded outline-none block">
                <img src="https://res.cloudinary.com/dr8adq7nl/image/upload/v1774753252/Horizontal_Lockup_-_DEEP_SLATE_lg5q91.png" alt="Groomr Logo" class="h-8 md:h-10 w-auto object-contain">
            </a>
            <div class="hidden md:flex items-center space-x-6 text-sm font-bold tracking-wider uppercase text-sage-leaf">
                <span class="opacity-70">Policy Document</span>
            </div>
        </div>
    </header>

    <!-- Print Cover Page — update title, version, and contacts as needed -->
    <div class="print-cover" aria-hidden="true">
        <div style="display: flex; flex-direction: column; align-items: center; gap: 28px; padding: 20px; width: 100%; max-width: 500px;">
            <img src="https://res.cloudinary.com/dr8adq7nl/image/upload/v1774753252/Horizontal_Lockup_-_DEEP_SLATE_lg5q91.png" alt="Groomr" style="height: 54px; object-fit: contain;">
            <div style="width: 64px; height: 3px; background-color: #2c3e50; border-radius: 2px;"></div>
            <div>
                <h1 style="font-family: 'Fredoka', sans-serif; font-size: 33pt; font-weight: 700; color: #2c3e50; margin: 0 0 10px 0; line-height: 1.2;">YOUR DOCUMENT TITLE</h1>
                <p style="font-family: 'Nunito', sans-serif; font-size: 11pt; color: #88a096; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin: 0;">Version 1 &nbsp;·&nbsp; [MONTH YEAR]</p>
            </div>
            <div style="width: 180px; height: 1px; background-color: #95a5a6;"></div>
            <div style="font-family: 'Nunito', sans-serif; color: #2c3e50; text-align: center; line-height: 1.95;">
                <p style="font-size: 12pt; font-weight: 700; margin: 0 0 4px 0;">Unhinged Development Group Ltd</p>
                <p style="font-size: 10pt; color: #88a096; margin: 0 0 2px 0;">Trading as Groomr</p>
                <p style="font-size: 10pt; color: #88a096; margin: 0 0 18px 0;">groomr.uk</p>
                <!-- Add only the contacts relevant to this document -->
                <p style="font-size: 10pt; color: #2c3e50; margin: 0 0 3px 0;">General enquiries: <strong>hello@groomr.uk</strong></p>
            </div>
            <div style="width: 180px; height: 1px; background-color: #95a5a6;"></div>
            <p style="font-family: 'Nunito', sans-serif; font-size: 9pt; color: #95a5a6; margin: 0; text-transform: uppercase; letter-spacing: 0.08em;">Edited by [NAME]</p>
        </div>
    </div>

    <!-- Main Content -->
    <main class="flex-1 max-w-4xl mx-auto px-6 md:px-12 py-16 space-y-12 w-full">

        <!-- Title Block -->
        <div class="text-center space-y-4 py-6 no-print">
            <h1 class="font-fredoka text-4xl md:text-6xl font-bold text-deep-slate">YOUR DOCUMENT TITLE</h1>
            <div class="text-sage-leaf font-bold text-sm tracking-wider uppercase">
                <p>Version 1 &nbsp;·&nbsp; [Month Year] &nbsp;·&nbsp; Edited by [Name]</p>
            </div>
            <div class="flex justify-center pt-2">
                <button id="print-button" onclick="window.print()" class="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-sage-leaf bg-pebble-grey/5 border border-pebble-grey/20 hover:bg-pebble-grey/10 hover:text-deep-slate rounded-full transition-all duration-300 focus-ring cursor-pointer shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                    Save as PDF
                </button>
            </div>
        </div>

        <!-- Table of Contents — add one .toc-link per section -->
        <div class="toc-card p-8 md:p-10">
            <h2 class="toc-title">Contents</h2>
            <div class="toc-grid">
                <a href="#s1" class="toc-link">1.&nbsp; Section One Title</a>
                <a href="#s2" class="toc-link">2.&nbsp; Section Two Title</a>
            </div>
        </div>

        <!-- Sections go here -->
        <section id="s1" class="policy-section p-8 md:p-12">
            <h2 class="policy-section-h2">1. Section Title</h2>
            <p class="policy-body">Content here.</p>
        </section>

    </main>

    <!-- Footer — do not modify -->
    <footer class="w-full bg-deep-slate text-alabaster-cream py-12 px-8 md:px-12 text-center relative overflow-hidden mt-8 no-print">
        <div class="absolute top-0 left-0 w-full h-2 bg-groomr-gold"></div>
        <img src="https://res.cloudinary.com/dr8adq7nl/image/upload/v1774753253/Horizontal_Lockup_-_GROOMR_GOLD_kfzzzr.png" alt="Groomr Logo" class="h-8 md:h-10 w-auto object-contain mx-auto mb-6">
        <div class="space-y-1">
            <p class="font-nunito font-bold tracking-wider text-sage-leaf text-sm uppercase">Unhinged Development Group Ltd</p>
            <p class="text-xs text-pebble-grey opacity-50 uppercase mt-2">&copy; 2026 Groomr. All rights reserved.</p>
        </div>
    </footer>

</body>
</html>
```

---

## Route Handler

Every policy document needs a Next.js route handler so it's accessible at a clean URL (e.g. `/my-policy` rather than `/policies/my-policy.html`).

Create `app/my-policy/route.ts`:

```typescript
import { readFileSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";

export function GET() {
  const html = readFileSync(
    join(process.cwd(), "public", "policies", "my-policy.html"),
    "utf-8"
  );
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
```

Then add the route to the public routes list in `proxy.ts`:

```typescript
'/my-policy(.*)',
```

---

## Component Reference

### Rule: CSS classes vs Tailwind

The component library lives in `policy.css`. Tailwind is used **only** for layout and spacing utilities. The rule is:

- **Never** add Tailwind equivalents of a CSS component property (e.g. don't add `bg-white` to a `.policy-section` element — the CSS class already sets the background).
- **Do** pair CSS classes with Tailwind responsive spacing: `class="policy-section p-8 md:p-12"`.
- Tailwind margin overrides (`mb-4`, `mb-8`) on `.policy-body` elements work as documented in the Body Text section below.

**Adding new Tailwind classes:** `policy-tailwind.css` is a pre-compiled build generated by scanning all policy HTML files. If you introduce a Tailwind utility class that isn't already used in any existing policy document, it won't be in the compiled output and will have no effect. Run `npm run build:policy-css` after adding the new document to regenerate the compiled CSS.

---

### Section Card — `.policy-section`

The white rounded card that wraps each numbered section. Always pair with responsive padding.

```html
<section id="s1" class="policy-section p-8 md:p-12">
    <!-- section content -->
</section>
```

**Anchor IDs:** Every section must have an `id` matching its TOC entry (`id="s1"`, `id="s2"`, etc.). The `scroll-padding-top: 72px` on `html` offsets the sticky header so the heading isn't hidden behind it on jump.

---

### Section Heading — `.policy-section-h2`

Large Fredoka heading with a sage-leaf bottom border. Sets its own font, size, weight, colour, and spacing — **do not add Tailwind typography classes**.

```html
<h2 class="policy-section-h2">1. Section Title</h2>
```

---

### Subsection Heading — `.policy-section-h3`

Smaller Fredoka heading. Includes `margin-top: 2rem` by default to separate it from the preceding content.

**CSS sibling rule:** When a `.policy-section-h3` immediately follows a `.policy-section-h2` (no element between them), the top margin is automatically removed by:

```css
.policy-section-h2 + .policy-section-h3 { margin-top: 0; }
```

This means you use the **same class** for both the first and subsequent subsections — the CSS handles it:

```html
<section id="s2" class="policy-section p-8 md:p-12">
    <h2 class="policy-section-h2">2. Section Title</h2>

    <!-- First h3: immediately follows h2 → margin-top auto-removed -->
    <h3 class="policy-section-h3">2.1 First Subsection</h3>
    <p class="policy-body">...</p>

    <!-- Subsequent h3: has paragraph before it → margin-top: 2rem applies -->
    <h3 class="policy-section-h3">2.2 Second Subsection</h3>
    <p class="policy-body">...</p>
</section>
```

> If a section opens with a paragraph before the first `h3` (e.g. section 1 which has introductory text before 1.1), the `h3` correctly receives the full `2rem` top margin because it is no longer an adjacent sibling of the `h2`.

---

### Body Text — `.policy-body`

Standard paragraph. Default `margin-bottom: 1.5rem` (24px). **Do not add `text-deep-slate`, `leading-relaxed`, or `text-lg`** — these are already in the class.

```html
<p class="policy-body">Standard paragraph with 1.5rem bottom margin.</p>
```

#### Margin overrides

Use Tailwind margin utilities to control spacing around `.policy-body` elements:

| Usage | Class | When to use |
|---|---|---|
| Default | `policy-body` | Standalone paragraphs, final paragraphs in a subsection |
| Tighter | `policy-body mb-4` | Paragraph that directly introduces a bullet list |
| Wider | `policy-body mb-8` | Intro paragraph in a Contact section or before a prominent block |

```html
<!-- Paragraph introducing a list — tighter gap -->
<p class="policy-body mb-4">You must not:</p>
<ul class="policy-list">...</ul>

<!-- Contact section intro — extra breathing room -->
<p class="policy-body mb-8">Please use the appropriate contact below.</p>
```

---

### Bullet List — `.policy-list` / `.policy-list-item` / `.policy-list-dot`

Three classes work together. The `<ul>` uses `.policy-list`, each `<li>` uses `.policy-list-item`, and the visual dot is a `<span class="policy-list-dot">`.

```html
<ul class="policy-list">
    <li class="policy-list-item">
        <span class="policy-list-dot"></span>
        <span>List item text here.</span>
    </li>
    <li class="policy-list-item">
        <span class="policy-list-dot"></span>
        <span>Another item, with a <a href="/page" class="policy-link">link</a> inline.</span>
    </li>
</ul>
```

The dot's `margin-top: 0.625rem` aligns it with the cap-height of the text regardless of line wrapping.

#### List with a following paragraph

When a paragraph follows the list, reduce the list's bottom margin:

```html
<ul class="policy-list mb-4">
    <li class="policy-list-item">...</li>
</ul>
<p class="policy-body">This paragraph follows the list.</p>
```

#### Rich list items

Items can contain `<strong>`, `<a>`, or both inside the text `<span>`:

```html
<li class="policy-list-item">
    <span class="policy-list-dot"></span>
    <span><strong>Animal welfare concerns</strong> — email <a href="mailto:safety@groomr.uk" class="policy-link">safety@groomr.uk</a></span>
</li>
```

---

### Hyperlinks — `.policy-link`

All clickable links within policy text (inline links, email addresses, cross-references). Renders sage-leaf, turns gold on hover, has a gold focus ring.

```html
<!-- Internal page link -->
<a href="/privacy-policy" class="policy-link">Privacy Policy</a>

<!-- Email link -->
<a href="mailto:hello@groomr.uk" class="policy-link">hello@groomr.uk</a>

<!-- External link — always add target and rel -->
<a href="https://stripe.com/legal" target="_blank" rel="noopener noreferrer" class="policy-link">stripe.com/legal</a>
```

> Do **not** use `.policy-link` for TOC entries — those use `.toc-link`.

---

### Key-Value Info Block — `.policy-info-block`

For structured company or reference data where each line is a bold label followed by a value. The flex column with `gap: 0.25rem` produces tight line spacing. Inner `<p>` tags require no class — styling is inherited.

```html
<div class="policy-info-block">
    <p><strong>Company name:</strong> Unhinged Development Group Ltd</p>
    <p><strong>Trading as:</strong> Groomr</p>
    <p><strong>Registered office:</strong> [REGISTERED OFFICE ADDRESS]</p>
    <p><strong>General contact:</strong> <a href="mailto:hello@groomr.uk" class="policy-link">hello@groomr.uk</a></p>
</div>
```

---

### Contact Section — `.policy-contact-list` / `.policy-contact-row` / `.policy-contact-label`

Used in the final "Contact Us" section. Each row is a label–value pair that wraps gracefully on mobile. The label has a `min-width: 240px` so values align in a column on wider screens.

```html
<div class="policy-contact-list">
    <div class="policy-contact-row">
        <span class="policy-contact-label">General enquiries:</span>
        <a href="mailto:hello@groomr.uk" class="policy-link">hello@groomr.uk</a>
    </div>
    <div class="policy-contact-row">
        <span class="policy-contact-label">Postal:</span>
        <span>Unhinged Development Group Ltd, [REGISTERED OFFICE ADDRESS]</span>
    </div>
</div>
```

**Standard contact order for all policy documents:**
1. General enquiries — `hello@groomr.uk`
2. Legal & complaints — `legal@groomr.uk`
3. Disputes (if relevant) — `disputes@groomr.uk`
4. Animal welfare & safety (if relevant) — `safety@groomr.uk`
5. Verification (if relevant) — `verification@groomr.uk`
6. Postal — registered office address
7. Data protection — `privacy@groomr.uk`

Include only the contacts that are relevant to the specific document. Do not include all contacts on every document.

---

### Callout Box — `.policy-callout` / `.policy-callout-warn`

An icon + body callout for drawing attention to important information. Two variants: default (sage-leaf, informational) and warn (terracotta, urgent).

**Structure:**
```html
<div class="policy-callout">
    <svg class="policy-callout-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <div class="policy-callout-body">
        <p><strong>Note:</strong> Informational message here.</p>
    </div>
</div>
```

**Warning variant** — add `.policy-callout-warn` to the outer div:
```html
<div class="policy-callout policy-callout-warn">
    <svg class="policy-callout-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
    <div class="policy-callout-body">
        <p><strong>Important:</strong> Urgent notice here.</p>
    </div>
</div>
```

| Variant | Background | Border | Icon colour | Use for |
|---|---|---|---|---|
| Default | Sage-leaf tint | Sage-leaf | `#88a096` | General notes, process explanations |
| `.policy-callout-warn` | Terracotta tint | Terracotta | `#c87964` | Legal warnings, critical information, pending items |

---

### Table of Contents — `.toc-card` / `.toc-title` / `.toc-grid` / `.toc-link`

Place immediately after the title block, before the first section. Uses a two-column grid on `sm` screens and above. The layout is interleaved — left column holds odd sections, right column holds even sections.

```html
<div class="toc-card p-8 md:p-10">
    <h2 class="toc-title">Contents</h2>
    <div class="toc-grid">
        <a href="#s1"  class="toc-link">1.&nbsp; First Section</a>
        <a href="#s6"  class="toc-link">6.&nbsp; Sixth Section</a>
        <a href="#s2"  class="toc-link">2.&nbsp; Second Section</a>
        <a href="#s7"  class="toc-link">7.&nbsp; Seventh Section</a>
        <a href="#s3"  class="toc-link">3.&nbsp; Third Section</a>
        <a href="#s8"  class="toc-link">8.&nbsp; Eighth Section</a>
    </div>
</div>
```

> The `&nbsp;` after single-digit numbers preserves column alignment. Multi-digit numbers (`10.`) do not need it.

**Anchor requirement:** Every `href="#sN"` must have a matching `<section id="sN">` in the document. The `scroll-padding-top: 72px` on `html` ensures the sticky header does not overlap the target.

---

### Print Cover Page — `.print-cover`

A full-page cover is hidden on screen (`display: none`) and revealed on print (`display: flex`). It uses inline styles throughout because it must render correctly even when Tailwind classes are unavailable in the print context.

The cover sits **outside** `<main>`, between the `<header>` and `<main>` tags. It forces a page break after itself (`break-after: page`) so the document content begins on page 2.

**What to customise:**
- `<h1>` — document title (match the screen title block)
- Version/date line
- Contact list — include only contacts relevant to this document
- "Edited by" line

**What not to change:**
- The outer `<div class="print-cover">` structure
- The `max-width: 500px` inner container
- The logo URLs
- The divider styles

---

## Print Behaviour

The `@media print` block in `policy.css` handles all print formatting automatically. Key behaviours:

| Element | Print behaviour |
|---|---|
| `header`, `footer`, `#print-button`, `.no-print` | Hidden |
| `.print-cover` | Full-page cover, forced page break after |
| `.policy-section` | Borders/shadows removed, short sections stay together (`break-inside: avoid`) |
| `.toc-card` | Light border, transparent background, links rendered as plain dark text |
| `.policy-section-h2` | Never orphaned — always followed by content on same page |
| `.policy-section-h3` | Same — always followed by its content |
| `.policy-list-item` | Never split across pages |
| `.policy-body` | 3-line orphan/widow minimum |
| `.policy-link` | Rendered as plain dark text (no colour, no underline) |

**Adding screen-only elements:** Apply `class="no-print"` to any element that should be hidden when printing (e.g. navigation badges, interactive controls).

**Sections longer than one page:** `break-inside: avoid` is respected as a preference. If a section is too long to fit on a single page, the browser will break it — this is correct behaviour. The rule prevents unnecessary breaks in shorter sections.

---

## Gotchas

**New Tailwind classes require a rebuild**  
`policy-tailwind.css` is compiled from the set of Tailwind classes found in all policy HTML files at build time. Adding a class that exists in no other policy document — say, a new responsive breakpoint or colour variant — will silently have no effect until you run `npm run build:policy-css`. Always check whether the class you're adding is already used elsewhere before deciding if a rebuild is needed.

**No Google Fonts, no CDN Tailwind script**  
Fonts are served locally from `/public/fonts/` via `@font-face` rules in `policy.css`. Do not add Google Fonts preconnect or stylesheet links — they'll cause a redundant network request and a flash of wrong font if the local font hasn't loaded. Do not add a Tailwind CDN script — it conflicts with the compiled build.

**h3 top margin and the sibling rule**  
The CSS rule `.policy-section-h2 + .policy-section-h3 { margin-top: 0; }` only fires when the `h3` is the *immediate next sibling* of the `h2` — no elements between them. If there is any content (even a `<!-- comment -->`) between the `h2` and the first `h3`, the rule will not apply and the `h3` will get its default `2rem` top margin. This is usually correct, but be aware of it.

**Anchor scroll offset**  
The `scroll-padding-top: 72px` on `html` compensates for the sticky header height. If the header height is ever changed, update this value in `policy.css`.

**Print cover contacts**  
The print cover contact list is separate from the Contact Us section. When adding or removing contacts from the body, also update the print cover manually — they are not linked.

**`no-print` class**  
The title block (`<div class="... no-print">`) is hidden on print because the print cover page replaces it. Do not remove this class from the title block, or the document title will appear twice in the printed output (once in the cover, once as the screen title block).

**External links in print**  
`.policy-link` is rendered in black with no underline or decoration in print. External links (e.g. `stripe.com/legal`) will appear as plain text. If you need URLs to be visible in print, add the URL as visible text alongside the link text: `Stripe's terms (<a href="https://stripe.com/legal" class="policy-link">stripe.com/legal</a>)`.

**Stylesheet paths are absolute**  
Both `<link href="/policies/policy-tailwind.css">` and `<link href="/policies/policy.css">` use absolute paths. This works correctly regardless of which URL the document is served from (e.g. `/disputes-policy`, `/terms`). Do not use relative paths like `./policy.css` or `../policies/policy.css` — they break depending on the route.
