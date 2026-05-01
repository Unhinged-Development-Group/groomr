# Groomr Website UI Kit

A pixel-faithful recreation of the Groomr consumer marketing + customer-account web experience, built as small reusable React (JSX) components on top of the design tokens in `colors_and_type.css`.

This kit mirrors the production HTML in `Groomr/Systems/Website/`:
- `Consumer Landing Page.html` → `index.html` Landing screen
- `Search Results.html` → Search screen (groomer cards + filters)
- `Customer Profile.html` → Dashboard screen (logged-in)
- Booking modal (lifted from Search Results)

## Files

- `index.html` — interactive click-thru prototype. Open this to preview.
- `Header.jsx` — sticky cream nav with logo + auth state.
- `Footer.jsx` — Deep Slate footer with 8px Gold accent.
- `Buttons.jsx` — primary, secondary, ghost.
- `SearchPill.jsx` — the rounded-pill search bar used across the site.
- `GroomerCard.jsx` — search result card.
- `AppointmentCard.jsx` — upcoming + past appointment rows on the dashboard.
- `Modal.jsx` — backdrop-blur modal shell + login + booking flows.
- `Icons.jsx` — the seven brand-pattern SVGs (splash + Slate stroke).
- `screens/Landing.jsx`, `screens/Search.jsx`, `screens/Dashboard.jsx` — composed screens.

## Stack

Single-file React + Babel-standalone, Tailwind CDN with the brand `theme.extend` block matching production. Fonts: Fredoka + Nunito from Google CDN.

## What it covers

- Marketing hero with primary search
- "What we believe" three-up feature row
- Search results with filter pills + groomer cards
- Click-to-book modal (date picker stub)
- Logged-in dashboard with greeting, upcoming appointment, past grooms, favourites, "My dogs"

## What it doesn't cover

- Real maps integration (the production Search Results uses Leaflet — we render a stylised placeholder).
- The full groomer-side dashboard (a separate product surface, not in scope here).
- Add-a-dog / settings / messaging flows beyond a button trigger.
