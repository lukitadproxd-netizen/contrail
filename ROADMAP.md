# Contrail Roadmap

## First public release: versioned project memory for coding agents

The architecture is stable enough for the first release. The goal is not to add
more memory infrastructure; it is to prove that a coding agent can follow an
updated project instruction and explain why an older instruction no longer
applies.

> Contrail gives coding agents versioned project memory. They follow the latest
> project instruction and can explain exactly why older instructions were replaced.

## Released foundation

- Append-only claim history with `supersedes` links.
- Current-claim and trajectory resolution.
- Repository-local JSONL store.
- CLI for creating, validating, inspecting, and comparing claims.
- MCP server for coding-agent access.
- Frozen v0.1 claim schema and fixture validation.

## Milestone 1 — Explain the current instruction

**Objective:** Make one lookup answer both “what should I do?” and “why?”

**Deliverables:**

- `contrail log <predicate>` shows the current instruction, source, timestamp,
  recorded confidence, prior instruction, and reasoning chain.
- `contrail_recall` returns the same evidence in a structured MCP result.

**Success criterion:** A developer can see the current project instruction and
its direct replacement chain without manually reading JSONL.

**Status:** Complete.

## Milestone 2 — Deterministic two-minute demo

**Objective:** Make Contrail's value visible without LLM randomness.

**Deliverables:**

- A seeded Node test-runner → Vitest policy correction.
- Fixed claim IDs, timestamps, and expected output.
- `npm run demo`, which fails if the actual CLI output drifts.

**Success criterion:** A new developer sees the stale-memory comparison and
explainable Vitest result in under two minutes.

**Status:** Complete.

## Milestone 3 — One excellent Claude Code path

**Objective:** Let a coding agent use the same project-memory proof through MCP.

**Deliverables:**

- A standard stdio executable for the MCP package.
- Claude Code setup instructions for macOS/Linux and PowerShell.
- `contrail_recall` documentation that maps directly to the demo question.

**Success criterion:** A developer can connect the local server, ask which test
framework to use, and receive the current policy with its correction evidence.

**Status:** Complete.

## Milestone 4 — Validate with target developers

**Objective:** Learn whether versioned instructions change coding-agent behavior
in real repositories.

**Deliverables:**

- 10 developer design partners using their own changed project convention.
- A paired task: ordinary saved context versus Contrail-backed context.
- A short interview and task-result template.

**Success criterion:** At least 7 of 10 developers get the current project
instruction right and can identify the superseding instruction without human
correction.

**Status:** Next.

## Explicitly postponed

Do not build these before Milestone 4 validates the workflow:

- SQLite or other storage engines
- Semantic search, embeddings, indexing, or compression
- Synchronization, collaboration, dashboards, analytics, or web UI
- Enterprise capabilities, ACLs, identities, or signatures
- SDKs, IDE extensions, and additional agent integrations
- Confidence calibration, trust algorithms, or conflict-resolution research

These may become useful later. They are not evidence that the first product is
useful, so they must not displace user validation.
