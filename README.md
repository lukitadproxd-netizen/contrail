# Contrail

**Deterministic temporal memory for AI coding agents.**

[![npm version](https://img.shields.io/npm/v/@contrail-spec/core?color=blue)](https://www.npmjs.com/package/@contrail-spec/core)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-42%20passing-brightgreen)](#)

AI coding assistants don't remember between sessions. Contrail gives them
deterministic, auditable memory with **conflict detection** — so when
instructions contradict each other, you know about it instead of getting
a wrong answer silently.

```bash
npx @contrail-spec/cli init
npx @contrail-spec/cli add project.testing.framework "Use Vitest." --confidence 0.98
npx @contrail-spec/cli log project.testing.framework
```

## Why Contrail?

Existing memory solutions (Mem0, Zep, Claude Code native memory)
store the **latest value** and forget the past. That works until
two instructions contradict each other — then the agent picks one
arbitrarily and you get an incorrect answer.

Contrail stores **trajectories**: every claim can explicitly replace
(`supersede`) a previous claim, forming an auditable chain. When
two claims conflict without a clear superseder, Contrail **reports
the conflict** instead of guessing.

| | Flat memory | Contrail |
|---|---|---|
| Remembers history | ❌ | ✅ Full supersession chain |
| Detects conflicts | ❌ | ✅ MULTIPLE_HEADS |
| Deterministic | ✅ | ✅ |
| Offline / no API cost | ✅ | ✅ |
| MCP native | ❌ | ✅ |

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

For the full reproducible comparison across six scenarios:

```bash
npm run benchmark
```

The benchmark compares two memory strategies:

- **Flat memory (confidence-only)**: picks the highest-confidence claim for a given subject/predicate.
  This is the best a system without temporal awareness can do — no supersession
  tracking, no provenance.
- **Temporal memory (Contrail)**: follows the `supersedes` chain to find the current
  instruction and its full history.

Results (deterministic — same output every run, no LLM calls, no network):

| Scenario | Flat memory (confidence-only) | Temporal memory (Contrail) |
|----------|-------------|----------|
| Simple evolution | ✓ (correct by chance — highest confidence is current) | ✓ + provenance |
| Three-step chain | ✗ (picks middle instruction, not head) | ✓ |
| Stale instruction trap | ✗ (picks stale rule — it has higher confidence) | ✓ |
| Multiple predicates | 1/2 correct | 2/2 + provenance |
| Changing convention | ✓ (correct by chance) | ✓ + provenance |
| Confidence drops | ✗ (picks stale Lambda — confidence 0.95 > 0.55) | ✓ + provenance |
| **Total** | **43% (3/7)** | **100% (7/7)** |

Contrail provides full provenance (superseded value, chain length, source,
timestamp) in every query. Confidence-only provides none.

> **Note:** this compares against the best possible flat-memory strategy
> (highest confidence wins), not against specific tools like Mem0 or Zep,
> which use different retrieval strategies. The benchmark measures the gap
> that temporal awareness fills, not a comparison against any specific product.

## Quick install

**Try it without cloning:**
```bash
npx @contrail-spec/cli init
npx @contrail-spec/cli add preference.editor "neovim" --confidence 0.95 \
  --source-tool my-brain --source-kind explicit-statement
npx @contrail-spec/cli log preference.editor
```

**Or clone the repo for the demo and benchmarks:**

Requires Node.js 20 or later.

```bash
git clone https://github.com/contrail-spec/contrail.git
cd contrail
npm install
npm run demo
```

## Use it with Claude Code

Connect in one line (no build needed):

```bash
claude mcp add contrail -- npx @contrail-spec/mcp
claude
```

Then ask: *"What testing framework should I use?"*

For a full seeded walkthrough with local development, see
[Claude Code MCP setup](docs/quick-start.md#connect-claude-code).

## What Contrail does

| Capability | Status |
|---|---|
| Claim storage (JSONL) | ✅ |
| Supersession chain (temporal resolution) | ✅ |
| Conflict detection (MULTIPLE_HEADS) | ✅ |
| MCP server (Claude Code integration) | ✅ |
| CLI (init, add, log, diff) | ✅ |
| Deterministic benchmark suite | ✅ |
| Semantic search / embeddings | ❌ deliberate |
| Cloud / SaaS | ❌ deliberate |
| Dashboard / web UI | ❌ deliberate |

Contrail is intentionally **offline-first, dependency-minimal, and
deterministic**. It doesn't call any LLM, doesn't need API keys,
and doesn't generate ongoing costs.

## How it fits

```text
Coding agent ──MCP──> Contrail ──> .contrail/claims.jsonl
                         ▲
                         │
                    contrail CLI
```

The store is append-only JSONL in the repository — compatible with
Claude Code's native memory format. The CLI and MCP server share
the same core trajectory logic.

## Packages

| Package | npm | Description |
|---------|-----|-------------|
| `@contrail-spec/core` | [![npm](https://img.shields.io/npm/v/@contrail-spec/core?color=blue)](https://www.npmjs.com/package/@contrail-spec/core) | Claim validation, trajectory resolution, conflict detection |
| `@contrail-spec/cli` | [![npm](https://img.shields.io/npm/v/@contrail-spec/cli?color=blue)](https://www.npmjs.com/package/@contrail-spec/cli) | CLI tool (init, add, log, diff) |
| `@contrail-spec/mcp` | [![npm](https://img.shields.io/npm/v/@contrail-spec/mcp?color=blue)](https://www.npmjs.com/package/@contrail-spec/mcp) | MCP server for Claude Code |
| `@contrail-spec/engram` | [![npm](https://img.shields.io/npm/v/@contrail-spec/engram?color=blue)](https://www.npmjs.com/package/@contrail-spec/engram) | [EXPERIMENTAL] Engram adapter |

## Documentation

- [Quick Start](docs/quick-start.md) — install, seed a store, and connect Claude Code.
- [Two-Minute Demo](docs/two-minute-demo.md) — walkthrough of the agent behavior comparison.
- [Agent Behavior Benchmark](bench/compare-agent-behavior/) — reproducible side-by-side comparison.
- [FAQ](docs/faq.md) — scope, confidence, and current limitations.
- [Specification](spec/SPEC.md) — the normative claim format, for implementers.

## License

[Apache-2.0](LICENSE)

---

*Built with [vibe coding](https://en.wikipedia.org/wiki/Vibe_coding) and a lot of coffee.*
