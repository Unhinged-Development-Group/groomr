# Groomer Dashboard — `/dashboard/groomer`

**File:** `app/dashboard/groomer/page.tsx`
**Client shell:** `app/dashboard/groomer/_components/GroomerDashboardClient.tsx`
**Tab components:** `app/dashboard/groomer/_components/`
**Type:** Async Server Component (page) + Client Component (everything else)
**Auth required:** Yes

## Purpose

Full back-office for groomers. Five tabs: Bookings, Clients, Earnings, Reviews, Profile.

## Server Component (`page.tsx`)

Calls `currentUser()` — redirects to `/sign-in` if null.

Runs four parallel fetches:
- `getGroomerAppointments()` — appointments for this groomer
- `getGroomerReviews()` — reviews for this groomer
- `getGroomerPayments()` — payment records
- `loadProfileEditorData()` — full profile + services + availability + team data

Derives:
- `businessName` from `editorData.profile.businessName` (falls back to "Your Studio")
- `unrespondedReviews` — count of reviews where `groomer_reply` is null

Passes all data as props to `<GroomerDashboardClient>`.

## Client Shell (`GroomerDashboardClient.tsx`)

### Header
- Business name + "Open · Accepting bookings" status chip (always shown, hardcoded)
- Owner name + rating (4.9, 184 reviews — hardcoded, from mock)
- Actions row:
  - `ScopeSelector` (only for owners with team members)
  - "Block time" button (stub — no functionality)
  - "Messages" link → `/dashboard/groomer/messages`
  - "New booking" button → opens `NewBookingModal`

### Stat Strip (4 cards)
All calculations are real, derived from props data:
- **Today** — appointments matching today's date, not cancelled + total hours
- **This week** — sum of `payments.amount` since last Monday (divided by 100 for £)
- **Next payout** — same value as "This week" (estimated, not yet real)
- **Repeat rate** — `repeatClients.length / uniqueClients.size * 100`

### Tab Navigation
5 tabs: Bookings, Clients, Earnings, Reviews, Profile.
- Active tab: `bg-deep-slate text-alabaster-cream`
- Reviews tab shows a badge dot with count of unresponded reviews
- Tab state: `useState<Tab>("bookings")`

### Scope Selector
- Only shown when `viewerRole === "owner"` AND team has accepted members
- Dropdown: Full salon / My data / individual team member names
- Team members who are `invite_status === "accepted"` only
- `effectiveScope` — if viewer is a `team_member`, scope is locked to their own `teamMemberId`

### New Booking Modal
`NewBookingModal` (`_components/NewBookingModal.tsx`) — receives services list from `editorData.services`.

## Tab Components

### `BookingsView` — `_components/BookingsView.tsx`
- **Mock data only** — receives `appointments` prop (real from server) but display logic uses mock data
- Scope filtering is wired: filters by `assigned_to_team_member_id` based on `effectiveScope`

### `ClientsView` — `_components/ClientsView.tsx`
- **Mock data only**
- Receives `appointments` prop — scope-filtered

### `EarningsView` — `_components/EarningsView.tsx`
- **Mock data only**
- Receives `payments` prop (real from server)

### `ReviewsView` — `_components/ReviewsView.tsx`
- Receives `reviews` prop (real from server)
- Groomers can submit replies — wired to a server action

### `ProfileEditor` — `_components/ProfileEditor.tsx`
- **Real — wired to live Supabase data**
- Edits `groomer_profiles` (name, tagline, bio, address, etc.)
- Manages services (add/edit/delete from `services` table)
- Manages availability (days + times from `availability` table)
- Team member management (invite, view, remove)
- Dirty-state tracking — sticky save bar appears only when changes exist
- Save via server actions in `app/actions/profile-editor.ts` and `app/actions/team-members.ts`

## Server Actions Used

| Action | File | Purpose |
|---|---|---|
| `getGroomerAppointments` | `app/actions/groomer.ts` | Fetch appointments |
| `getGroomerReviews` | `app/actions/groomer.ts` | Fetch reviews |
| `getGroomerPayments` | `app/actions/groomer.ts` | Fetch payment records |
| `loadProfileEditorData` | `app/actions/profile-editor.ts` | Load all profile editor data |
| `saveProfile` | `app/actions/profile-editor.ts` | Save groomer profile fields |
| `saveServices` | `app/actions/profile-editor.ts` | Save services list |
| `inviteTeamMember` | `app/actions/team-members.ts` | Clerk invite + DB row |
| `removeTeamMember` | `app/actions/team-members.ts` | Delete + revoke Clerk invite |

## Types

From `types/groomer-dashboard.ts`:
- `ProfileEditorInitialData` — full shape of `editorData` prop
- `ProfileFormData` — profile fields
- `ServiceRow` — individual service
- `TeamMemberRow` — team member with `inviteStatus`

## What's Real vs Mock

| Feature | Status |
|---|---|
| Profile editor | **Real** — live Supabase writes |
| Team management | **Real** — Clerk invites + Supabase |
| Stat strip calculations | **Real** — derived from real data |
| Bookings/Clients/Earnings tabs | **Mock** — display logic not wired |
| Reviews tab | **Real** — shows real reviews, reply wired |

## Editing Notes

- `businessName` falls back to `"Your Studio"` if `editorData.profile.businessName` is empty — this happens for groomers who haven't completed the profile editor yet
- The "Open · Accepting bookings" status chip is hardcoded — needs a real `is_accepting_bookings` flag when implemented
- Scope filtering for Bookings/Clients/Earnings happens in `GroomerDashboardClient` before passing props down — tab components receive pre-filtered data
- To wire a mock tab: replace mock data with the prop data received from the server
