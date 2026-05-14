# Groomer Messages — `/dashboard/groomer/messages`

**File:** `app/dashboard/groomer/messages/page.tsx`
**Type:** Client Component (`"use client"`)
**Auth required:** Yes (protected by `proxy.ts` middleware, but no server-side auth check in the component itself)

## Purpose

Split-pane messaging UI for groomers to communicate with clients. Currently fully mocked — no real database backing.

## Layout

Two-column grid: thread list (320px left) + active conversation (flex-1 right).

```
┌──────────────────┬─────────────────────────────────────────┐
│  Thread list     │  Active conversation                     │
│  (sidebar)       │  Header: name + "Pippa's owner"         │
│  4 mock threads  │  Message bubbles (me = dark, them = cream│
│                  │  Input field + Send button               │
└──────────────────┴─────────────────────────────────────────┘
```

## State

All state lives in this single component — no sub-components.

```ts
threads: Thread[]        // full list, mutated when unread count cleared or message sent
activeId: string         // ID of the currently selected thread
draft: string            // contents of the message input
```

## Thread Data (`GROOMER_THREADS`)

4 hardcoded mock threads:
1. Sarah Khan (Murphy's owner) — 0 unread, confirmed Saturday
2. Daniel Reid (Pippa's owner) — 2 unread, reschedule request
3. Imogen Tate (Otis's owner) — 0 unread, grooming instructions
4. Priya Nair (Bean's owner, new) — 1 unread, first-time question

Each thread: `{ id, with, from, avatar (single letter), last, when, unread, msgs: Message[] }`
Each message: `{ from: "me" | "them", t: string }`

## Interactions

### Select thread (`selectThread(id)`)
- Sets `activeId`
- Clears `unread` count to 0 on selected thread (mutates `threads` state)

### Send message (`send()`)
- Trims draft, guards against empty
- Appends `{ from: "me", t: draft }` to active thread's `msgs`
- Updates `last` preview text and `when` to "now"
- Clears draft
- Triggered by: "Send" button click OR `Enter` key in input

## UI Details

- Thread list: scrollable sidebar (`max-h-[640px] overflow-y-auto`), active thread has `bg-alabaster-cream`
- Unread badge: `bg-muted-terracotta` pill with count
- Message bubbles: `from === "me"` → right-aligned, `bg-deep-slate text-alabaster-cream`; `from === "them"` → left-aligned, `bg-alabaster-cream text-deep-slate border`
- Message scroll area: `max-height: 480px` inline style
- "Write a message…" input uses `.field` utility class
- Send button uses `.btn-primary`
- Entered from groomer dashboard via "Messages" button in the header (Link to this route)

## Real Implementation Notes

When real messaging is built, this page needs:
- Auth check (`currentUser()` or `auth()`) — currently absent
- `messages` table queries (Supabase) — scoped to `groomer_profile_id`
- Real-time subscription for incoming messages (Supabase realtime)
- Message threading by `appointment_id`

The `messages` table schema is defined in `GROOMR_CONTEXT.md` section 9 — it exists in the database but is not yet used here.

## Editing Notes

- To add a mock thread: append to `GROOMER_THREADS` array
- The component is a single file with no sub-components — keep it that way until real data is wired
- When adding real auth, use `auth()` (not `currentUser()`) since it's a client component — or move auth check to a server component wrapper
- The `page-fade` class on the outer div provides the page entrance animation
