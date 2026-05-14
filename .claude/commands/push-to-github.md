# push-to-github

Stages all changes, auto-generates a commit message based on what changed, and pushes to `main` of the groomr repo.

## Steps

### 1. Check you're in a git repo

```bash
git status
```

If this fails or returns "not a git repository", stop and tell the user. Do not proceed.

### 2. Check for changes

```bash
git status --short
```

- If there's nothing to commit (clean working tree), tell the user and stop — no point pushing nothing.
- If there are changes, note what files have been added, modified, or deleted. You'll use this in step 4.

### 3. Stage everything

```bash
git add -A
```

### 4. Generate a commit message

Based on the list of changed files and what you know about the work done in this session, write a short, specific commit message. Rules:
- Use imperative mood ("Add login page", not "Added login page")
- Max ~72 characters
- Be specific — mention the actual files or features changed, not generic fluff like "update stuff"
- If there are many unrelated changes, use a short summary line

### 5. Commit

```bash
git commit -m "<your generated message>"
```

### 6. Push to main

```bash
git push git@github.com:andyyhughes/groomr.git main
```

### 7. Confirm

Tell the user:
- What was committed (the message)
- That it was pushed to `main`
- The short git hash if available (`git rev-parse --short HEAD`)

## Error handling

| Problem | What to do |
|---|---|
| `git push` rejected (non-fast-forward) | Tell the user there are remote changes they need to pull first. Run `git pull --rebase origin main` and retry the push, but **ask the user before doing the rebase**. |
| Merge conflicts after pull | Stop. Tell the user exactly which files conflict and ask them to resolve manually. |
| No remote named `origin` | Tell the user no remote is configured. Set it up with `git remote add origin git@github.com:andyyhughes/groomr.git` |
| Untracked large files / `.env` | Warn the user if anything sensitive-looking (`.env`, secrets, credentials) is being staged. Ask for confirmation before committing. |

## Repository

- **Remote URL**: `git@github.com:andyyhughes/groomr.git`
- **Branch**: `main`

## Notes

- Always push to `main` — don't push to other branches unless the user explicitly asks
- Never force push (`--force`) without explicit user instruction
- If the repo has a `.gitignore`, respect it — don't try to add ignored files
