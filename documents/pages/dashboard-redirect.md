# Dashboard Redirect — `/dashboard`

**File:** `app/dashboard/page.tsx`
**Type:** Async Server Component
**Auth required:** Yes (redirects to `/sign-in` if unauthenticated)

## Purpose

Role-based routing hub. Reads the user's roles from Supabase and redirects to the correct dashboard. No UI — this page is never seen by the user.

## Flow

1. `currentUser()` — gets Clerk user. If null → redirects to `/sign-in?redirect_url=/dashboard`
2. Queries `profiles` table in Supabase by `clerk_id`:
   ```sql
   SELECT roles FROM profiles WHERE clerk_id = $1
   ```
   Uses `supabaseAdmin` (service role client).
3. Falls back to `["owner"]` if no profile row exists yet (webhook race condition)
4. Decision:
   - `roles.includes("groomer")` → `redirect("/dashboard/groomer")`
   - otherwise → `redirect("/dashboard/owner")`

## Notes

- This page contains no JSX — it only calls Next.js `redirect()` which throws internally
- A user with both `owner` and `groomer` roles is sent to the groomer dashboard (groomer check runs first)
- The webhook race condition (profile row not yet created when user first hits /dashboard) is handled by the `["owner"]` default — worst case they're briefly redirected to the owner dashboard and can navigate from there
- The full profile creation fallback is in `app/dashboard/owner/page.tsx → getOrCreateProfile()`

## Editing Notes

- To add a new role type: add another `if (roles.includes("newrole"))` before the final `redirect`
- Role check order matters — groomer takes priority over owner if someone has both roles
