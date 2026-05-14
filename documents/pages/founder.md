# Founder Page — `/founder`

**File:** `app/founder/page.tsx`
**Type:** Server Component (static)
**Auth required:** No

## Purpose

Personal letter from Andrew Hughes (founder) about his background, Murphy (his dog), and why Groomr exists. Trust-building page — linked from the global footer.

## Metadata

```ts
title: "Our Founder — Groomr"
description: "A note from Andrew Hughes, founder of Groomr — and his co-pilot Murphy."
```

## Sections

### 1. Letterhead
- Groomr mark image (Cloudinary) centred
- Italic tagline: "Your dog deserves a regular."

### 2. Hero
- H1: "A Note from the Founder"
- Circular photo of Andrew (Cloudinary, 48/56px) + opening quote about hospitality
- Side text: "Groomr isn't just a tech project..."

### 3. Two-col split
- **Left — "The Journey"**: Murphy story, why finding groomers is hard when moving cities
- **Right — "Meet Murphy"**: White card, sage-leaf eyebrow header, Murphy photo (Cloudinary), dog description

### 4. From Hospitality to Hub
- `bg-sage-leaf/20` rounded section
- 2-col: early education/hospitality background paragraph + Groomr purpose paragraph

### 5. My Lifetime Commitment
- Centred text with `border-t-2 border-pebble-grey/30`
- Promise text with "free of charge for life" in `text-muted-terracotta font-extrabold`
- Groomr mark image
- Signature image (Cloudinary, gold, rotated -2deg)
- "Andrew Hughes" in Fredoka, "Founder & Dog Dad · Murphy, Co-Pilot" in small uppercase

## Images (all Cloudinary)

| Asset | URL |
|---|---|
| Groomr mark | `https://res.cloudinary.com/dr8adq7nl/image/upload/v1774753273/DEEP_SLATE_auun2o.png` |
| Andrew photo | `https://res.cloudinary.com/dr8adq7nl/image/upload/v1774800795/Gemini_Generated_Image_ym8cypym8cypym8c_saonpr.png` |
| Murphy photo | `https://res.cloudinary.com/dr8adq7nl/image/upload/v1774800794/Gemini_Generated_Image_riff5mriff5mriff_cwvncg.png` |
| Signature (gold) | `https://res.cloudinary.com/dr8adq7nl/image/upload/v1775260142/SignatureGroomrGold_lxgo1l.png` |

All Cloudinary URLs are allowed via `remotePatterns` in `next.config.ts`.

## Inline SVG Icons

This page uses raw SVG elements (not GroomrIcons) for section markers:
- Pin/location icon → "The Journey" eyebrow
- Heart icon → "Meet Murphy" eyebrow
- Lightning bolt → "The Background" eyebrow

These are one-off decorative icons — not worth adding to the icon system.

## Editing Notes

- No external data, no auth, no client components — everything is static JSX
- To update copy: edit text directly in the file
- The signature image rotation is `-rotate-2` Tailwind class on the `<Image>` element
- "free of charge for life" intentionally has no underline — it's `text-muted-terracotta font-extrabold` with no `.text-link` class (design decision)
- Max content width: `max-w-3xl` centred
