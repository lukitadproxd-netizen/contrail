# Additional Coding Assistant Fixture

This fixture exercises several claim shapes for manual exploration. It is not
the product demo for the first release.

Contrail's first release targets **evolving project conventions for coding
agents**. Start with the deterministic
[testing-policy-evolution](../testing-policy-evolution/README.md) demo to see
the intended workflow: a current instruction, its source and timestamp, the
policy it replaced, and the reasoning chain.

## Claims Included

1. **Editor preference trajectory**: vscode (0.9) → neovim (0.95, corrected)
2. **Code style paradigm trajectory**: functional-composition (0.85) → pragmatic (0.75, corrected)
3. **Architecture belief**: event-sourced with materialized views (0.9)
4. **Language constraints**: TypeScript, Python, Rust (1.0)
5. **Active goal**: Ship Contrail v0.1 by Aug 17 (0.85, shared)
6. **Session observation**: High quality launch prep session (0.8, time-bounded)

## Usage

```bash
# Copy to your Contrail store
cp seed.jsonl .contrail/claims.jsonl

# View all trajectories
contrail log

# View specific trajectory
contrail log preference.editor
```

## Demo Script for Claude Code

After connecting via MCP (`claude mcp add contrail -- npx @lukitadproxd-netizen/mcp`):

1. "What's my editor?" → recalls neovim with trajectory
2. "Show me my code style history" → shows functional → pragmatic shift
3. "What are my hard constraints?" → lists languages with confidence 1.0
4. "What am I working on?" → shows active goal (shared visibility)
