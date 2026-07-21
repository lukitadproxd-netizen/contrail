# FAQ

## Is Contrail a general AI memory engine?

Not in its first release. Contrail is for coding agents that need to follow
project conventions which change over time. The first workflow is intentionally
narrow: record an instruction, correct it, and explain the current policy.

## Why not put the latest instruction in a prompt or `AGENTS.md` file?

That works for the current instruction, but it loses the correction trail.
Contrail lets an agent say which instruction is current, what it replaced, who
recorded the change, and when it became current. It is useful when the history
is part of deciding or reviewing an action.

## Does Contrail decide whether a source is trustworthy?

No. `confidence` is the confidence recorded with a claim; Contrail does not
calibrate it or apply a trust algorithm. The product shows that value alongside
the source and correction chain so an agent and developer can assess it.

## How does an instruction change?

Create a new claim whose `supersedes` field references the prior claim. The new
claim becomes current, while the old one remains in the append-only history.

## What happens if two instructions conflict?

The first release requires a single linear supersession chain per
`subject/predicate`. Multiple current heads are invalid rather than silently
ranked. Conflict-resolution policies are intentionally postponed.

## Is the store shared with a team?

The store is a repository-local `.contrail/claims.jsonl` file. It can be kept in
version control if that fits the repository's workflow, but collaboration and
synchronization features are not part of this release.

## Does Contrail use embeddings or semantic search?

No. The first release optimizes for an explainable exact lookup of a known
project instruction. Semantic search, indexing, and compression are postponed.

## Which coding assistant is supported?

The golden path is Claude Code through MCP. More IDE integrations and SDKs are
out of scope until this workflow is proven with users.

## What is deliberately postponed?

SQLite and other storage engines, dashboards, embeddings, semantic search,
indexing, compression, synchronization, collaboration, enterprise features,
ACLs, identities, signatures, SDKs, a VS Code extension, analytics, web UI,
confidence calibration, trust algorithms, and conflict-resolution research.
