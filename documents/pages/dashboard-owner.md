# Owner Dashboard — `/dashboard/owner`

**File:** `app/dashboard/owner/page.tsx`
**Components:** `app/dashboard/owner/_components/`
**Type:** Async Server Component (page) + Client Components (sections)
**Auth required:** Yes

## Purpose

Dog owner's home base. Manages their dogs, upcoming appointments, and favourite groomers.

## Server Component (`page.tsx`)

Calls `currentUser()` — redirects to `/sign-in` if null.

Includes `getOrCreateProfile()` helper: if the Clerk webhook missed and no profile row exists, this function creates it with `roles: "{owner}"`. This is the fallback for the webhook race condition.

Runs three parallel data fetches:
- `fetchDogs(user.id, ...)` — queries `dogs` WHERE `owner_id = profile.id`
- `getOwnerAppointments()` — from `app/actions/appointments.ts`
- `getFavouriteGroomers()` — from `app/actions/favourites.ts`

Renders:
- Page header: Eyebrow "Dog owner", H1 greeting, subtitle
- `<DogsSection initialDogs={dogs} />`
- `<AppointmentsSection initialAppointments={appointments} />`
- `<FavouriteGroomersSection initialFavourites={favourites} />`
- Coming-soon card: "Find a groomer" (Badge tone="grey")
- Groomer CTA banner (dark slate bg): "Are you also a groomer?" → `/register/groomer`

## Client Components (`_components/`)

### `DogsSection`
- Lists dog cards from `initialDogs` prop
- "Add a dog" opens `AddDogModal`
- Each dog card has Edit / Delete actions via `DogCard`

### `DogCard`
- Shows dog name, breed, age
- Edit → opens edit modal
- Delete → calls server action, removes from local state

### `AddDogModal`
- Modal (uses `Modal` from `components/ui/Modal.tsx`)
- Fields: name, breed (text input), date of birth, sex, neutered checkbox, medical notes, photo upload (Cloudinary)
- Submits via `addDog` server action (`app/actions/dogs.ts`)
- On success: dog is added to local state in `DogsSection` (no page reload)

### `AppointmentsSection`
- Lists appointments from `initialAppointments`
- Status-aware display
- Currently wired to real Supabase data via `getOwnerAppointments()`

### `FavouriteGroomersSection`
- Lists saved groomers from `initialFavourites`
- "Find groomers" link → `/search`
- Unfavourite action calls server action

## Server Actions Used

| Action | File | Purpose |
|---|---|---|
| `addDog` / `updateDog` / `deleteDog` | `app/actions/dogs.ts` | Dog CRUD — real Supabase data |
| `getOwnerAppointments` | `app/actions/appointments.ts` | Fetch appointments for current owner |
| `getFavouriteGroomers` | `app/actions/favourites.ts` | Fetch saved groomer IDs |

## Data Model

Dog shape (`type Dog` from `app/actions/dogs.ts`):
```ts
{
  id, owner_id, name, breed, date_of_birth, size, is_neutered,
  coat_type, coat_notes, temperament_notes, health_notes,
  vaccination_doc_url, profile_image_url, created_at, updated_at
}
```

## What's Real vs Mock

| Feature | Status |
|---|---|
| Dog CRUD | **Real** — Supabase + Cloudinary |
| Appointments | **Real** — Supabase |
| Favourite groomers | **Real** — Supabase |
| "Find a groomer" card | Coming soon tile — no functionality |

## Editing Notes

- `getOrCreateProfile()` in `page.tsx` is the webhook fallback — do not remove
- Dog photos: Cloudinary upload is signed by a server action (`getCloudinarySignature` in `app/actions/dogs.ts`), upload is client-side, URL stored in Supabase
- Coming-soon cards: add new tiles to the grid at line ~90 in `page.tsx` following the same pattern
- The groomer CTA at the bottom is always shown — even to users who are already groomers (intentional for now)
