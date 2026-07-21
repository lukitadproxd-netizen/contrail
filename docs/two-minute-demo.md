# Two-Minute Demo

## Goal

Show why a coding agent needs more than a current-value memory when project
instructions evolve.

## Scenario

A project originally used Node's built-in test runner. At a later architecture
review, the maintainer standardized on Vitest. A coding agent is asked:

> What testing framework should I use?

## Without Contrail

Give the agent only the old saved instruction:

```text
Use Node's built-in test runner.
```

It may follow stale context. Even if another system overwrote the value with
`Vitest`, it cannot show when the change happened, who made it, or which policy
was replaced.

## With Contrail

Run the proof from the repository root:

```bash
npm install
npm run demo
```

Contrail prints this resolved outcome:

```text
CURRENT INSTRUCTION
  "Use Vitest."
  Current since: 2026-06-15T14:30:00Z
  Source: project-maintainer (corrected)
  Recorded confidence: 0.98

WHY THIS IS CURRENT
  This claim supersedes 01J00000000000000000000000, so it is the current instruction.
  Previous instruction: "Use Node's built-in test runner."
```

The complete terminal output is checked into
[expected-cli-output.txt](../examples/testing-policy-evolution/expected-cli-output.txt).
The runner fails if the live CLI output differs. No LLM, network call, current
clock, or manual data entry affects the result.

## What to say after the demo

> Contrail lets a coding agent follow the latest project instruction and show
> exactly why it replaced the previous one.

That is the first release. Do not introduce scale, semantic retrieval, or
multi-user features into this demonstration.
