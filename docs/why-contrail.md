# Why Contrail?

Coding agents work from project context: conventions, constraints, architectural
choices, and corrective feedback. That context is not static.

An ordinary memory system answers, “What value is saved now?” Contrail answers:

1. What should the agent do now?
2. What instruction did that replace?
3. Who recorded the change, when, and with what recorded confidence?

That difference matters in code review, debugging, and long-running projects.
If an agent chooses Vitest, a developer should be able to see that this is a
maintainer correction of an earlier Node test-runner policy—not an unexplained
preference or an arbitrary model guess.

Contrail keeps the implementation deliberately plain:

- An append-only JSONL store in the repository.
- A `supersedes` link between old and new instructions.
- A resolver that selects one current instruction.
- CLI and MCP views that make the decision trace readable.

The product value is not an elaborate memory architecture. It is an agent that
does not mistake an obsolete project decision for a permanent rule.
