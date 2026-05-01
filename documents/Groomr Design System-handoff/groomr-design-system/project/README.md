# Groomr Design System

> *"Your dog deserves a regular."*

This is the single source of truth for designing anything Groomr — interfaces, decks, marketing assets, prototypes. It captures the brand's visual language, voice, and component vocabulary as defined in the **2026 Brand Guidelines**.

---

## What is Groomr?

**Groomr** is a consumer-first marketplace connecting dog owners with trusted local groomers — and giving those groomers the tools to run a brilliant business. Instant booking, verified reviews, and a powerful dashboard. Better for owners. Better for groomers.

The product was born from a real frustration: a founder couldn't find a great groomer for their long-haired chihuahua, Murphy. So they built a place where dog owners can find, book, and trust a local groomer — and where independent groomers get the tools and visibility they deserve.

**Mission.** To make dog grooming effortless for owners and rewarding for groomers — by connecting local communities through a platform built on trust, simplicity, and a genuine love of dogs.

**Vision.** A world where every dog has a groomer they love, and every groomer has a business they're proud of.

**Core values.**
1. **Trust first** — we only feature groomers we'd trust with our own dogs.
2. **Community over competition** — we champion independent groomers, not corporate chains.
3. **Simple by design** — booking should take seconds, not a Sunday afternoon.
4. **Dogs at the centre** — every decision starts with what's best for the dog.

## Products in this system

Groomr has two surfaces today, both web (mobile-responsive):

1. **Consumer Website** — landing page, search results, groomer profiles, customer dashboard. Public, conversion-driven.
2. **Groomer Dashboard** — appointment management, client list, business tools. Authenticated.

A native mobile app is not currently planned.

## Sources

This system was assembled from materials in the user-attached `Groomr/` shared drive:

- `Groomr/Brand/Brand Guidelines 2026.html.html` — the canonical guidelines doc.
- `Groomr/Brand/Logo/` + `Groomr/Brand/Logo/Extra Styles/` — all logo lockups in 4 colourways (Deep Slate, Groomr Gold, Sage Leaf, Pebble Grey) and 3 formats (Mark, Wordmark, Horizontal/Vertical Lockup).
- `Groomr/Systems/Website/Consumer Landing Page.html` — production HTML for the marketing landing page.
- `Groomr/Systems/Website/Search Results.html` — production HTML for groomer search + map.
- `Groomr/Systems/Website/Customer Profile.html` — production HTML for the logged-in customer dashboard.
- `Groomr/Business Planning/*` — context for tone, copy and product framing.

The reader of this README may not have the same access; everything needed is mirrored or distilled into this project.

---

## CONTENT FUNDAMENTALS

The Groomr voice is **warm, direct, and quietly confident**. It speaks like a knowledgeable local friend, not a faceless tech company.

### Four pillars
1. **Warm & Approachable** — friendly, not slick.
2. **Direct & Simple** — short sentences, clear actions, zero jargon.
3. **Quietly Confident** — we don't shout; the platform speaks for itself.
4. **Dog-Obsessed** — every line ultimately comes back to the dog.

### Casing rules
- **Brand name** — always written `Groomr`, capital G, no full stop. Never substitute the logo graphic inline.
- **H1 / H2 (display)** — Title Case. Capitalise every major word: *"Find a Local Groomer"*, *"Our Grooming Services"*.
- **H3 / body / sub-headings** — Sentence case. First word + proper nouns only: *"Everything starts with the dog."*
- **Buttons** — Title Case for confidence: *"Sign Up Now"*, *"Book Appointment"*, *"View Profile"*.
- **Eyebrows / meta labels** — UPPERCASE with `0.15em` letter-spacing.

### Voice (you / we)
- We speak in **first-person plural** ("we built this", "we genuinely care") for brand-led copy.
- We address users in **second-person** ("your dog", "you'll get") for product copy.
- We **don't** say "the user", "consumers", or "customers" in user-facing copy.

### Punctuation & phrasing
- **British English** spellings throughout (`colour`, `centre`, `realise`).
- **Em dashes** — used minimally in marketing copy.
- Contractions are fine and encouraged (`don't`, `we're`, `you'll`).
- **One pun is plenty.** Avoid "fur baby", "pawsome", "fur-ever". Don't undermine credibility.
- **No emoji.** Not in the brand. (See ICONOGRAPHY below.)

### Tagline
> *"Your dog deserves a regular."*

**Always quoted. Always italics. Always full stop. Never paraphrased.** A "regular" isn't just a booking — it's a relationship. Use only for hero moments, not as a recurring footer line.

### Examples — write this, not that

| ✅ Write this | ❌ Not this |
|---|---|
| *"Find a local groomer in minutes. Real availability, instant confirmation — no phone tag."* | *"Welcome to Groomr, your premier destination for professional canine grooming services…"* |
| *"Your dog deserves a regular. Someone who knows their name, their coat, and exactly how they like their ears done."* | *"Our amazing groomers are pawsome professionals who will make your fur baby look their absolute best!"* |
| *"Oops! Something went wrong. Let's try that again."* | *"An unexpected error has occurred. Please contact support."* |

---

## VISUAL FOUNDATIONS

### Colour — six-colour palette, cream-led
The whole system runs on six colours. **Alabaster Cream does the heavy lifting**; everything else is an accent.

| Token | Hex | Role |
|---|---|---|
| Alabaster Cream | `#f9f8f4` | **Primary canvas.** Every page starts here. Let it breathe. |
| Deep Slate | `#2c3e50` | Headings, body text, footer background, primary icon strokes. High-contrast without harsh black. |
| Groomr Gold | `#eae45c` | **Primary CTA fill only.** Reserve for the most critical interaction. **Never use for text.** |
| Sage Leaf | `#88a096` | Secondary text, alt section backgrounds, "quiet confidence" structure. |
| Pebble Grey | `#95a5a6` | Subtle borders, placeholder text, alt backgrounds. The quietest one. |
| Muted Terracotta | `#c87964` | Warm accent, secondary CTA, **primary-CTA hover state**. Small doses only. |

**Don't.** Use Gold for typography. Layer Terracotta on Sage (it vibrates). Make everything colourful — accents only land on calm cream. Use Gold or Terracotta as a large background. Use Deep Slate as a wide cream-text background.

### Typography — Fredoka + Nunito
- **Fredoka Bold (display)** — H1 and H2 only. Hero headers, campaign headlines, big brand moments. Soft, rounded, warm. Variable font with `wght 300–700` and `wdth 75–125%`.
- **Nunito (workhorse)** — H3, body, UI labels, buttons, microcopy. Variable font with `wght 200–1000`; separate Italic variable file for proper italics.
- Both ship as **local variable TTFs in `fonts/`** — no Google Fonts dependency. *Substitution flag:* none.
- **Tagline italic note** — Fredoka does not carry an italic axis, so the *"Your dog deserves a regular."* tagline is set in **Nunito Italic Bold** rather than Fredoka. The original Google-Fonts implementation likely synthesized a faux slant; the local TTFs do not, so we use Nunito's real italic.

**Hierarchy** (from spec):
- H1 — Fredoka Bold, 36–48 px
- H2 — Fredoka Bold, 24–32 px
- H3 — Nunito Extra-Bold (800), 18–22 px
- Body — Nunito Regular (400), 16 px
- Buttons / UI — Nunito Bold (700), 16 px / 12 px

### Spacing & layout
- **Section gaps:** 40 px or 60 px baseline between major sections. Generous, never cramped.
- **Page padding:** 24 px mobile, 48 px tablet, 80 px desktop (`px-6 lg:px-12 xl:px-20`).
- **Max content width:** 1280 px (`max-w-7xl`) for content-heavy pages; full-bleed cream for marketing.
- **Card padding:** 32–48 px (`p-8` to `p-12`).

### Backgrounds
- **No gradients.** No textures. No patterns. No hand-drawn illustrations. The system is intentionally photography-led + flat colour.
- **Imagery** — real photos of real dogs, warm-toned, natural light. No B&W, no heavy filters, no stock-y composites. Photos sit on cream with `border-radius: 8–12 px` and a soft shadow.
- **Full-bleed dark sections** — Deep Slate panels, sparingly, for tagline moments and footers. Top edge of footer gets an **8 px Groomr Gold accent border** as a brand signature.

### Animation & motion
- **Default duration:** `0.3s` (300 ms). Spec'd explicitly.
- **Default easing:** standard ease — `cubic-bezier(0.4, 0, 0.2, 1)`. No bounce, no overshoot, no spring.
- Buttons fade colour smoothly over 0.3s. Cards lift `translateY(-4px)` with a soft shadow over 0.3s.
- **No fades on page load.** No scroll-driven parallax. No looping motion. Animation serves interaction, not decoration.

### Hover states
- **Primary button** — `groomr-gold` background fades to `muted-terracotta`, text flips from `deep-slate` to `alabaster-cream`. 0.3s.
- **Secondary outline button** — fills with Deep Slate, text flips to cream.
- **Cards** — `translateY(-4px)` + `shadow-lift`.
- **Text links** — colour shifts from current → `muted-terracotta` (or `groomr-gold` on dark backgrounds).
- **Icon-only nav** — hovers from `pebble-grey` to `deep-slate`.

### Press / active / focus states
- **Focus ring** — `0 0 0 3px #eae45c` (Groomr Gold). Crisp, no blur. Applied to every interactive element including buttons, inputs, and links. Never use the browser default.
- We **don't** shrink-on-press; the language is "soft and confident", not "playful and bouncy".

### Borders, radii, shadows
- **Buttons** — `border-radius: 9999px` (fully pill-shaped, always).
- **Image cards** — 8 px or 12 px (`var(--radius-md)` / `var(--radius-lg)`).
- **Modals + large feature cards** — 24 px.
- **Inputs** — 12 px (`rounded-xl`).
- **Borders** — `1px solid rgba(149, 165, 166, 0.20)` (Pebble Grey @ 20% alpha) for subtle dividers. `2px solid var(--deep-slate)` for secondary buttons.
- **Shadow system** — three steps:
  - `--shadow-subtle` — resting state on cards over cream.
  - `--shadow-lift` — hover state on cards (Pebble Grey @ 40%).
  - `--shadow-modal` — modal overlays (Deep Slate @ 25%).
- **No inner shadows.** No glows. No coloured shadows beyond Pebble Grey-tinted neutral.

### Transparency, blur, capsules
- **Modal overlay** — `rgba(44, 62, 80, 0.6)` + `backdrop-filter: blur(4px)`. The only place blur lives.
- **Capsule pills** for status / tags / filters — full pill radius, tinted bg (`bg-sage-leaf/10`, `bg-groomr-gold/20`, `bg-muted-terracotta/10`) with matching border at 20% alpha. Eyebrow-cased text inside.
- **No glassmorphism.** No translucent navbars over photos. The header is a clean `alabaster-cream` bar with a 1px Pebble Grey divider.

### Imagery vibe
- Warm, naturally lit, candid photography of dogs and groomers.
- **No AI-generated dogs.** Use real stock from Unsplash etc. Crop tight on faces, fur texture, expression.
- Always sits on cream, with the subtle shadow + 12 px radius.

### Layout rules
- The header sticks to the top (`position: sticky`) on a clean cream background with a 1 px Pebble Grey divider.
- The footer is **always Deep Slate** with the 8 px Groomr Gold top accent.
- Forms / search bars are rendered as **fully-rounded white pills** sitting on cream, with the focus ring expanding outward.

---

## ICONOGRAPHY

Groomr uses a **custom inline-SVG icon system** with a very specific recipe — it is the brand's most distinctive UI signature.

### The recipe
Each icon is composed of **two layers**:
1. **An offset coloured "splash" circle** behind the glyph — `#eae45c` Groomr Gold *or* `#c87964` Muted Terracotta — at `opacity: 0.55`. The circle is positioned slightly off-centre from the glyph so it pokes out as a soft accent shape.
2. **A 2 px Deep Slate stroke glyph** on top — literal, recognisable shapes (paw prints, calendar, scissors, map pin, shield-with-tick).

```svg
<!-- Pattern -->
<svg viewBox="0 0 24 24" fill="none">
  <circle cx="10" cy="11" r="7" fill="#eae45c" opacity="0.55"/>
  <!-- glyph paths in stroke="#2c3e50" stroke-width="2" -->
</svg>
```

**Stroke weight:** 2 px at 24-px viewBox. **Caps & joins:** rounded. **Fill:** none on the glyph itself.

### Where to find them
The seven core icons (Pets, Services / Scissors, Booking / Calendar, Local / Map Pin, Trust / Shield, Community / Users, Heart) all live inline in:
- `Groomr/Brand/Brand Guidelines 2026.html.html` (the "Iconography Library" section)
- and are reused throughout the production HTML files.

We **don't** ship them as a separate sprite or icon font today; they're inlined per-page in the codebase. When building new screens, lift the SVG verbatim and recolour the splash circle (Gold or Terracotta) to fit the surrounding colour rhythm.

### CDN fallback
For icons not in the custom set (chevrons, close X, hamburger, search magnifier, star, clock, plus), we use **Heroicons (outline, 24-px, 2-px stroke)** inline — they match the Deep Slate stroke recipe naturally. No icon font dependency.

> **Substitution flag:** the brand has no published "official" icon library beyond the seven brand-pattern icons above. For all utility chrome (chevron, close, search, clock, etc.) we substitute Heroicons outline at 2 px stroke. If the brand publishes an official set, swap them in.

### Emoji
**Never.** Emoji are not part of the brand. They feel inconsistent with the warm-but-considered voice.

### Unicode symbols
Use sparingly — `•` (bullet) for inline list separators, `★` rendered as a Deep Slate or Groomr Gold SVG (not the Unicode glyph), `—` (em dash) for typographic pause. Never `✓` or `✗` Unicode — use the SVG checkmark / X.

### Logo
- **Mark only** — favicon, social avatar, smallest digital uses (32 px min).
- **Wordmark only** — rare; companion to a separate visual mark.
- **Horizontal lockup** — *use 90% of the time.* Default for headers, footers, hero badges. Min 120 px wide.
- **Vertical lockup** — last resort, for square crops.
- **Colourways** — Deep Slate (on cream), Groomr Gold (on Deep Slate), Sage Leaf and Pebble Grey (rare quiet contexts). Mirror the colour to the surface it sits on.
- **Clear space** — equal to the height of the "g" in the wordmark. Nothing enters that zone.
- **Never** stretch, rotate, recolour outside the four official colourways, place over a busy photo, or apply effects (drop shadow, glow, outline).

---

## Index — what's in this folder

| File | Purpose |
|---|---|
| `README.md` | You are here. Brand bible. |
| `SKILL.md` | Agent-Skills front-matter so this folder is portable to Claude Code. |
| `colors_and_type.css` | All design tokens as CSS custom properties. Import once, use everywhere. |
| `assets/` | Logos in every official colourway + lockup. Drop these into HTML directly. |
| `preview/` | Small ~700-px-wide cards that populate the Design System tab in the IDE — type, colour, spacing, components, brand. |
| `ui_kits/website/` | High-fidelity React/JSX recreation of the Groomr consumer website. Click-thru prototype. |

### Asset filenames
All in `assets/`, all PNG, transparent backgrounds:

- `logo-mark-deep-slate.png` / `logo-mark-groomr-gold.png` / `logo-mark-sage-leaf.png` / `logo-mark-pebble-grey.png`
- `wordmark-deep-slate.png`
- `horizontal-lockup-deep-slate.png` / `horizontal-lockup-groomr-gold.png` / `horizontal-lockup-sage-leaf.png` / `horizontal-lockup-pebble-grey.png`
- `vertical-lockup-deep-slate.png` / `vertical-lockup-groomr-gold.png`

---

## Notes for the next designer

- **Don't reinvent the wheel.** The production HTML in `Groomr/Systems/Website/` is the closest thing we have to a working component library. When in doubt, mirror what's there.
- **Tailwind tokens** — the production code uses Tailwind with a small `theme.extend` block defining the six brand colours and two font families. The full config sits at the top of every HTML file in `Groomr/Systems/Website/` — copy that block verbatim if you're starting a new Tailwind page. The same tokens are mirrored as CSS variables in `colors_and_type.css` for non-Tailwind work.
- **The cream comes first.** If a design feels stressful or busy, the answer is more cream and fewer accents — never another colour.
