# Quick Start

This guide gets a coding agent from a changed project instruction to an
explainable current answer.

## 1. Install and run the deterministic demo

From a local checkout, with Node.js 20 or later:

```bash
npm install
npm run demo
```

The demo uses a fixed repository policy:

1. `Use Node's built-in test runner.`
2. `Use Vitest.` — recorded as a correction that supersedes the first policy.

It compares the actual CLI output with a checked-in expected result. If the
output changes, the command fails instead of presenting a misleading demo.

## 2. Inspect a current instruction yourself

Copy the fixed seed into a repository-local store, then resolve the policy.

macOS/Linux:

```bash
mkdir -p .contrail
cp examples/testing-policy-evolution/seed.jsonl .contrail/claims.jsonl
node packages/cli/dist/cli.js log project.testing.framework --subject repository
```

PowerShell:

```powershell
New-Item -ItemType Directory -Force .contrail
Copy-Item examples/testing-policy-evolution/seed.jsonl .contrail/claims.jsonl
node packages/cli/dist/cli.js log project.testing.framework --subject repository
```

The output shows the current instruction, its source and timestamp, the recorded
confidence, the instruction it superseded, and the full chain from oldest to
current.

## Connect Claude Code

Build the MCP package first:

```bash
npm run build:mcp
```

From the repository you want Claude Code to remember, add Contrail as a local
MCP server. This keeps the configuration available only for your current
project.

macOS/Linux:

```bash
claude mcp add --scope local contrail -- node "$(pwd)/packages/adapters/mcp/dist/cli.js"
```

PowerShell:

```powershell
claude mcp add --scope local contrail -- cmd /c node "$PWD\packages\adapters\mcp\dist\cli.js"
```

Confirm the server is registered:

```bash
claude mcp get contrail
```

Then start Claude Code in the same repository and ask:

> What testing framework should I use? Explain the current project policy.

Claude Code can call `contrail_recall` with `subject: "repository"` and
`predicate: "project.testing.framework"`. The response includes:

- `current_belief` — the instruction to follow now.
- `why_this_is_current` — the supersession rule that selected it.
- `superseded_claim` — the immediately replaced policy, if any.
- `reasoning_chain` — every version from oldest to current.

To see every registered MCP server, use `claude mcp list`. To remove Contrail,
use `claude mcp remove contrail`.
