# Contrail

**Versioned project memory for coding agents.**

Contrail prevents a coding agent from treating changing project instructions as
timeless facts. It preserves the current instruction, the instruction it
replaced, and the evidence for that change.

## The problem

Project conventions change. A team can move from Node's built-in test runner to
Vitest, change its package manager, or reverse an architecture decision. Normal
agent memory either keeps stale context or overwrites it without an explanation.

When an agent is asked what to do, the important questions are:

- What is the current instruction?
- Who recorded it, and when?
- What did it replace?

## The solution

Contrail stores repository-local project instructions as append-only claims.
When an instruction changes, the new claim supersedes the old one. A coding
agent retrieves the current claim with its source, timestamp, recorded
confidence, and complete correction chain.

## See the value in two minutes

```bash
npm install
npm run demo
```

The demo is deterministic: it seeds these two project decisions with fixed IDs
and timestamps.

```text
WITHOUT CONTRAIL
  A stale memory says: "Use Node's built-in test runner."
  It cannot prove that a later project decision replaced it.

WITH CONTRAIL
CURRENT INSTRUCTION
  "Use Vitest."
  Current since: 2026-06-15T14:30:00Z
  Source: project-maintainer (corrected)
  Recorded confidence: 0.98

WHY THIS IS CURRENT
  This claim supersedes the previous Node test-runner policy.
```

The real CLI output is compared with a checked-in expected result; no model call
or generated timestamp is involved. See the [Two-Minute Demo](docs/two-minute-demo.md).

## Quick install

Requires Node.js 20 or later.

```bash
git clone https://github.com/lukitadproxd-netizen/contrail.git
cd contrail
npm install
npm run demo
```

## Use it with Claude Code

Build the local MCP server, add it for this repository, then ask the agent for
the current project policy.

```bash
npm run build:mcp
claude mcp add --scope local contrail -- node "$(pwd)/packages/adapters/mcp/dist/cli.js"
claude
```

In Claude Code:

> What testing framework should I use? Explain the current project policy.

See [Claude Code MCP setup](docs/quick-start.md#connect-claude-code) for
PowerShell and Windows instructions, plus a complete seeded walkthrough.

## What Contrail does in this release

- Stores a project instruction locally.
- Replaces it without deleting the previous instruction.
- Resolves the current instruction.
- Explains its source, timestamp, recorded confidence, and supersession chain.

Contrail does **not** yet do semantic search, conflict resolution, confidence
calibration, synchronization, dashboards, or enterprise access control. Those
are deliberately out of scope until this core workflow proves useful.

## How it fits

```text
Coding agent ──MCP──> Contrail ──> .contrail/claims.jsonl
                         ▲
                         │
                    contrail CLI
```

The store is append-only JSONL in the repository. The architecture stays small:
the CLI and MCP server both use the same claim and trajectory logic.

## Documentation

- [Quick Start](docs/quick-start.md) — install, seed a store, and connect Claude Code.
- [Two-Minute Demo](docs/two-minute-demo.md) — the exact proof and expected output.
- [Why Contrail?](docs/why-contrail.md) — why changing project instructions need versioned memory.
- [Common Use Cases](docs/common-use-cases.md) — focused coding-assistant examples.
- [FAQ](docs/faq.md) — scope, confidence, and current limitations.
- [Specification](spec/SPEC.md) — the normative claim format, for implementers.

## License

[Apache-2.0](LICENSE)
