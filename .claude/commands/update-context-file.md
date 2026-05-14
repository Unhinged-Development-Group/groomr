# Update Context File

Your job is to keep `GROOMR_CONTEXT.md` accurate and up to date by syncing it with what just happened in this conversation.

## Step 1 — Read the current file

Read `GROOMR_CONTEXT.md` from the project root (look relative to the current working directory, or search the repo if needed).

## Step 2 — Scan the conversation for changes

Go through the conversation and identify anything that affects the context file. Common signals:

- **Schema changes** — new/modified tables, columns, enums, FK relationships, or constraints. If you spot any, use the Supabase MCP (`execute_sql` on project `fvbxjwfxcbhjoidrmzgv`) to verify the live schema before writing — the source of truth is the database, not the conversation.
- **Completed tasks** — anything that was built or shipped. Move these from "Next Up" to the "✅ Done" list in Section 12.
- **New "Next Up" items** — plans discussed for what comes next. Add them to the "🔜 Next Up" list in priority order.
- **RLS / security changes** — new policies, changes to the security model. Update Section 8.
- **New gotchas** — discoveries, footguns, or non-obvious behaviours worth capturing. Add to Section 11.
- **Resolved gotchas** — issues that have been fixed or are no longer relevant. Remove or update them.
- **Architecture or tooling decisions** — anything that changes how the system works or why.
- **New env vars** — if new environment variables were introduced, add them to Section 5.

## Step 3 — Update only what changed

Edit `GROOMR_CONTEXT.md` in place. Rules:

- Preserve the existing structure, headings, and tone exactly — this is a reference document, not a changelog
- Only touch sections that have genuinely changed
- Keep SQL accurate to the live schema (verify via MCP when in doubt)
- Don't add speculative content — only record decisions that were actually made
- Update the `Last updated` line at the bottom to today's date in the format `DD Month YYYY`

## What good looks like

- A groomer dashboard feature was built → it moves from "Next Up" to "Done"
- A new table was added mid-session → Section 7 gets the accurate column list
- A new gotcha was discovered (e.g. "PostGIS requires ST_MakePoint, not lat/lng columns") → Section 11 gets a new row
- An existing gotcha was resolved → it's removed or marked resolved
- New env vars were needed → Section 5 is updated

## What to skip

- Don't record every tool call or intermediate step — only outcomes that affect the project going forward
- Don't duplicate information already in the file
- Don't pad the file — if nothing changed in a section, leave it alone
