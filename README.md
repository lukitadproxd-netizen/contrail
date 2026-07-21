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
npm run demo
```

The demo compares two lookup strategies side by side on the same claim store:

- **WITHOUT CONTRAIL** — flat memory (picks highest confidence, ignores supersession)
- **WITH CONTRAIL** — temporal memory (follows the supersession chain)

```text
WITHOUT CONTRAIL
  ✗ Uses stale instruction: "Use Node's built-in test runner."
  A flat-memory agent cannot distinguish current from superseded policies.

WITH CONTRAIL
  ✓ Follows current policy: "Use Vitest."
  Explains: this supersedes the earlier Node test-runner policy.
  Source, timestamp, and recorded confidence are all available.
```

The demo is deterministic: fixed claim IDs, fixed timestamps, no LLM calls,
no network access, no random values. The output is self-contained.

For the full reproducible comparison across five scenarios:

```bash
npm run benchmark
```

Current benchmark results (deterministic, always produces these numbers):

| Scenario | Flat memory | Contrail |
|----------|-------------|----------|
| Simple evolution | ✓ (lucky — highest confidence) | ✓ + provenance |
| Three-step chain | ✗ (picks middle, not head) | ✓ |
| Stale instruction trap | ✗ (picks stale, higher confidence) | ✓ |
| Multiple predicates | 1/2 correct | 2/2 + provenance |
| Changing convention | ✓ (lucky — confidence climbs) | ✓ + provenance |
| **Total** | **50% (3/6)** | **100% (6/6)** |

The benchmark never calls an LLM, contacts a network, or uses random values.
Every claim ID and timestamp is fixed. Every run produces the same output.

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
- [Two-Minute Demo](docs/two-minute-demo.md) — walkthrough of the agent behavior comparison.
- [Agent Behavior Benchmark](bench/compare-agent-behavior/) — reproducible side-by-side comparison.
- [FAQ](docs/faq.md) — scope, confidence, and current limitations.
- [Specification](spec/SPEC.md) — the normative claim format, for implementers.

## License

[Apache-2.0](LICENSE)
