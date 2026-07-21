# Two-Minute Demo

## Goal

Show that an agent using Contrail follows the current project policy and
explains why, while a flat-memory agent falls for stale instructions.

## Scenario

A project originally used Node's built-in test runner. At a later architecture
review, the maintainer standardized on Vitest. A coding agent is asked:

> What testing framework should I use?

## Without Contrail

A flat-memory agent stores only the latest instruction value. It cannot
distinguish current policy from superseded policy. It picks by confidence,
which can be higher on a stale instruction.

```text
✗ Returns: "Use Node's built-in test runner."
  No provenance.
  No explanation of why this is current.
```

## With Contrail

Contrail's resolveCurrentBelief follows the supersession chain to find the
head — the current instruction. It also exposes the replaced instruction,
source, timestamp, and recorded confidence.

```text
✓ Returns: "Use Vitest."
  Current since: 2026-06-15T14:30:00Z
  Source: project-maintainer (corrected)
  This supersedes: "Use Node's built-in test runner."
```

## Run it

```bash
npm run demo
```

The demo is deterministic: fixed claim IDs, fixed timestamps, no LLM calls.
It runs the same comparison and prints both results side by side.

## Run the full benchmark

```bash
npm run benchmark
```

Five scenarios compare flat-memory vs. Contrail on correctness and
provenance. The benchmark always produces exactly the same output.
