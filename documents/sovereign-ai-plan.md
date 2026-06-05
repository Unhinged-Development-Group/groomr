# Plan: A Sovereign, Constitution-Governed Local AI

## Context

The aim is a personal AI that runs entirely on your own laptop, with **no calls
to any external service**, and whose behaviour is governed by a **written
constitution that you author and control** — rather than inheriting the hidden
values, policies, and alignment of a remote frontier provider ("a separate
entity"). Its primary job is to answer questions over **your own documents**
(RAG), and the constitution should be **living governance**: versioned,
auditable, enforced at runtime, and amendable through a defined process.

This document is the build-and-deploy plan for that system. It is hardware-
tiered because the machine isn't chosen yet (Windows/Linux). Every component
chosen below runs **locally and offline** — the sovereignty requirement is a
hard constraint, not a preference.

---

## Goals & Non-Goals

**Goals**
- 100% offline inference and retrieval — verifiable air-gap (no telemetry, no
  model/API callouts).
- Answers grounded in *your* documents, with citations back to source files.
- A constitution that is (a) injected into every interaction, (b) enforced by a
  runtime checker, (c) versioned and logged, (d) amendable via a defined loop
  in which the AI may *propose* but a human *ratifies*.
- Reproducible build you can stand up on a fresh machine.

**Non-Goals**
- Matching frontier-model quality. Local open-weight models are good but not
  GPT-class; the plan optimises for control and grounding, not raw IQ.
- Multi-user / hosted service. This is single-operator, single-laptop.
- Training/fine-tuning a model from scratch (optional later extension only).

---

## Design Principles ("what sovereign + constitution-governed means here")

1. **Single choke point.** All model traffic flows through one local service
   (the *Governor*). The constitution, retrieval, guardrails, and logging live
   there — not scattered across UIs. This is what makes "it operates from the
   constitution" structurally true rather than aspirational.
2. **Constitution as data, not code.** The constitution is a versioned,
   human-readable document loaded at runtime, so amending it never requires a
   code change.
3. **Provenance on every answer.** Each response records: constitution version
   hash, retrieved source chunks, model + params, and guardrail verdict.
4. **Offline by construction.** Default-deny network at the OS/firewall level
   for the AI processes; sovereignty is verified, not assumed.

---

## Architecture Overview

```
            ┌──────────────────────────────────────────────┐
            │                 Your Laptop                    │
            │                                                │
  You ──▶  UI (Open WebUI / CLI)                            │
            │        │                                       │
            │        ▼                                       │
            │   ┌──────────── GOVERNOR (local service) ───┐ │
            │   │ 1. Load constitution (versioned)        │ │
            │   │ 2. Retrieve doc chunks (vector search)  │ │
            │   │ 3. Compose prompt: constitution+context │ │
            │   │ 4. Call local model (generation)        │ │
            │   │ 5. Guardrail/critic pass vs constitution│ │
            │   │ 6. Log interaction + provenance         │ │
            │   └───────┬───────────────┬─────────────────┘ │
            │           ▼               ▼                    │
            │   Inference runtime   Vector store             │
            │   (Ollama / llama.cpp) (Chroma/Qdrant/LanceDB) │
            │           ▲               ▲                    │
            │   Local model weights  Local embeddings        │
            │                                                │
            │   Ingestion pipeline ──▶ (watches your docs)   │
            └──────────────────────────────────────────────┘
                    NO OUTBOUND NETWORK (firewall-enforced)
```

The **Governor** is the heart of the system and the reason the constitution
actually governs behaviour. Everything else is a swappable backend.

---

## Hardware Tiers & Model Recommendations

Pick at build time based on the machine. Prioritise **strong instruction-
following** (so the model obeys the constitution) and a **long context window**
(so the constitution + retrieved docs both fit).

| Tier | Spec (rough) | Generation model (4–5 bit quant) | Notes |
|---|---|---|---|
| **High** | 24GB+ VRAM (e.g. RTX 4090) or 64GB+ RAM | Llama 3.3 70B / Qwen2.5 72B (quantized) | Best instruction adherence; comfortable for guardrail self-critique |
| **Mid** | 8–16GB VRAM | Qwen2.5 14B, Gemma 2 27B (q4), Llama 3.1 8B | Sweet spot for most laptops |
| **Low** | CPU-only / ≤6GB VRAM | Llama 3.2 3B, Qwen2.5 3B/7B, Phi-3.x | Works but slower; keep context tight |

> Confirm exact current-best open-weight checkpoints at build time (the field
> moves fast). Selection criteria over leaderboard rank: instruction-following,
> ≥32k context, permissive license.

**Embeddings (local, required for RAG):** `nomic-embed-text`, `mxbai-embed-large`,
or `bge-large` — all runnable via Ollama, fully offline.

**Runtime choice:**
- **Ollama** — default recommendation. Cross-platform (Windows/Linux), GPU +
  CPU fallback, simple model management, OpenAI-compatible local API the
  Governor can call. Easiest path to sovereign.
- **llama.cpp** directly — maximum control, lower-level.
- **vLLM** — only if NVIDIA GPU and you want max throughput; heavier setup.

**Vector store (local):** **Chroma** or **LanceDB** for simplicity (embedded,
no server); **Qdrant** (local container) if you want a more scalable store.

**UI:** **Open WebUI** as the front door (local, polished chat, document upload)
— but pointed at the **Governor**, not directly at Ollama, so the constitution
and guardrails can't be bypassed. A thin **CLI/TUI** is a good secondary
interface for scripting and admin.

---

## The Constitution

### Format
A versioned Markdown document, git-tracked, with structured, addressable
sections so the Governor and the critic can cite specific clauses:

```
constitution/
  constitution.md            # current ratified version (symlink or pointer)
  versions/
    v1.0.0.md
    v1.1.0.md
  CHANGELOG.md               # amendment history + rationale
  meta.yaml                  # current version, hash, ratified_at, ratified_by
```

Suggested clause structure (each clause has a stable ID, e.g. `P-3`, `PR-2`):
- **Preamble** — purpose, scope, who it serves.
- **Principles (P-*)** — positive values (honesty, grounding-in-sources,
  deference to the operator, privacy of the corpus).
- **Prohibitions (PR-*)** — hard limits (e.g. never fabricate citations, never
  exfiltrate data, never act outside retrieved evidence without flagging it).
- **Behavioural rules (B-*)** — tone, citation requirements, uncertainty
  handling, refusal style.
- **Escalation rules (E-*)** — what to do on conflict/ambiguity (ask, refuse,
  defer to operator).
- **Amendment process (A-*)** — how the constitution itself changes (below).

### Governance / amendment lifecycle ("self-revising, governed")
The AI may **propose**; a human **ratifies**. The loop:

1. **Propose** — Either you, or the AI (via a dedicated `/amend` flow), drafts a
   proposed change with rationale.
2. **Consistency review** — The Governor runs the *proposed* amendment through
   the model with a prompt that checks it against all existing clauses for
   contradiction, redundancy, or scope creep, and reports conflicts.
3. **Ratify** — You approve. The Governor writes a new
   `versions/vX.Y.Z.md`, updates `meta.yaml` (new semver + content hash +
   timestamp), appends to `CHANGELOG.md`, and commits.
4. **Pin & log** — From that moment, every response logs the new version hash.
   Old logged answers remain attributable to the constitution version that
   produced them.

Versioning convention (semver-ish): **major** = changed/removed a principle or
prohibition; **minor** = added a clause; **patch** = wording/clarity only.

---

## Enforcement (Layered Guardrails)

The constitution is enforced in three layers — all inside the Governor:

1. **Injection (pre-generation).** The current constitution is prepended to the
   system prompt on every call, followed by retrieved document context, then the
   user query. Constitution always wins precedence in the prompt ordering.
2. **Critic pass (post-generation).** A second model call (same or a smaller
   local model) reviews the draft answer *against the constitution clauses* and
   the retrieved sources, returning a structured verdict:
   `{compliant: bool, violated_clauses: [...], grounding_ok: bool, fix: ...}`.
   On failure → one automatic revision attempt, then refuse/flag if still
   non-compliant. This catches fabricated citations and ungrounded claims (the
   main RAG failure mode).
3. **Audit log (always).** Every interaction appended to a local, append-only
   log: timestamp, constitution version hash, model+params, retrieved source
   IDs, the critic verdict, and the final answer. This is your accountability
   trail and the substrate for later constitution tuning.

---

## Document Ingestion (RAG) Pipeline

1. **Sources** — a watched folder (e.g. `~/corpus/`) of PDF/DOCX/MD/TXT/HTML.
2. **Parse & chunk** — extract text, chunk with overlap (start ~800 tokens /
   100 overlap; tune later), preserve source path + page/section metadata.
3. **Embed** — local embeddings model → vectors.
4. **Index** — upsert into the local vector store with metadata for citation.
5. **Re-index on change** — file-watcher triggers incremental re-embedding so
   the corpus stays current without a full rebuild.
6. **Retrieve at query time** — top-k semantic search (optionally hybrid with
   keyword/BM25), passed to the Governor as cited context.

Library options: **LlamaIndex** or **LangChain** for a fast start, or a lean
custom pipeline for full control/auditability. All run offline.

---

## Suggested Repository Layout

```
sovereign-ai/
  governor/            # the orchestration service (the choke point)
    main.py            # local API: /chat, /amend, /reindex
    constitution.py    # load/version/hash; inject into prompt
    retrieval.py       # vector search + citation assembly
    guardrails.py      # critic pass + revision loop
    logging.py         # append-only audit log
  constitution/        # versioned constitution + governance (see above)
  ingestion/           # parse/chunk/embed/index + file watcher
  corpus/              # your documents (git-ignored; private)
  logs/                # audit trail (git-ignored)
  models/              # local weights / Ollama modelfiles
  deploy/
    firewall/          # egress-deny rules + verification script
    setup.sh / setup.ps1
  README.md
```

---

## Build Phases (deployment)

**Phase 0 — Hardware & sovereignty baseline**
- Finalise the machine; install OS prerequisites (Python, git, GPU drivers if
  applicable).
- Set up egress-deny firewall rules for the AI processes; write a verification
  script (`deploy/firewall/verify.sh`) that proves no outbound traffic.

**Phase 1 — Inference runtime + model**
- Install Ollama; pull a model matching the hardware tier and the embeddings
  model. Confirm generation + embeddings both work **with networking disabled**.

**Phase 2 — RAG ingestion**
- Build the ingestion pipeline; index a small sample corpus; sanity-check
  retrieval quality and citation metadata.

**Phase 3 — The Governor (MVP)**
- Implement constitution loading + injection, retrieval, single model call,
  and audit logging. Expose a local `/chat` endpoint. Wire Open WebUI to point
  at the Governor (not Ollama directly).

**Phase 4 — Constitution v1.0.0**
- Author the first constitution (preamble, principles, prohibitions,
  behavioural + escalation rules, amendment process). Ratify → version → log.

**Phase 5 — Guardrails**
- Add the critic pass + one-shot revision loop; record verdicts in the audit
  log. Test against deliberately adversarial / ungrounded queries.

**Phase 6 — Governance loop**
- Implement `/amend`: propose → consistency review → ratify → version bump →
  commit. Verify old logs stay pinned to their original version.

**Phase 7 — Hardening & ergonomics**
- File-watcher auto-reindex, backup of corpus/logs/constitution, CLI admin
  commands, and a one-command bring-up (`setup.sh`/`setup.ps1`).

---

## Sovereignty / Offline Verification Checklist

- [ ] Firewall blocks all outbound from runtime + Governor; verified with a
      live network monitor while running a query.
- [ ] Models, embeddings, and dependencies are cached locally; system answers
      a question with **Wi-Fi/ethernet physically off**.
- [ ] No telemetry: Ollama/Open WebUI analytics disabled; deps audited for
      callouts.
- [ ] Corpus and logs are local-only and git-ignored.

---

## Verification (how to test end-to-end)

1. **Grounding test** — Ask a question answerable only from a known document;
   confirm the answer cites the right source chunk. Ask a question *not* in the
   corpus; confirm it declines/flags rather than fabricating (PR clause).
2. **Constitution adherence** — Issue a request that violates a prohibition;
   confirm the guardrail blocks/refuses and the log records the violated clause.
3. **Air-gap test** — Disable networking entirely; confirm full chat + RAG still
   function (the sovereignty proof).
4. **Amendment test** — Propose an amendment that contradicts an existing
   principle; confirm the consistency review flags the conflict. Ratify a clean
   amendment; confirm the version hash in subsequent logs changes and prior
   logs remain pinned to the old version.
5. **Provenance audit** — Inspect the log for a sample interaction; confirm it
   contains constitution version, model params, retrieved sources, and critic
   verdict.

---

## Risks & Limitations

- **Capability ceiling.** Local models trail frontier models; mitigate with
  good retrieval and tight prompts, and choose the highest tier your hardware
  allows.
- **Guardrail is probabilistic.** The critic pass reduces but cannot guarantee
  zero violations; the audit log is the backstop. Higher-capability critic
  models help.
- **Constitution drift.** Self-proposed amendments could erode original intent;
  the human-ratify gate + semver + immutable changelog are the defence.
- **Maintenance.** Open-weight models update frequently; plan periodic re-eval
  of the chosen checkpoint against your own test set.

---

## Open Decisions (to confirm before/at build)

- Final hardware → fixes the model tier and runtime flags.
- Governor implementation language (Python recommended for the RAG/ML ecosystem).
- Vector store (Chroma/LanceDB vs Qdrant) and ingestion library (LlamaIndex vs
  custom).
