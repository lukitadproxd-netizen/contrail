# Application Kit — Contrail

Material listo para copiar-pegar en aplicaciones a programas
open source: GitHub Accelerator, AWS Activate, Netlify Open
Source, Fly.io, Neon, etc.

---

## 1. One-pager (para formularios)

### Project name
Contrail

### One-line description
Deterministic temporal memory for AI coding agents — tracks
preference history and detects conflicts instead of forgetting.

### Category
Developer Tools / AI Infrastructure

### Problem
AI coding assistants (Claude Code, Cursor, Copilot) have no
memory of previous sessions. Existing memory solutions store
only the latest value and silently lose history, causing
contradictory behavior that the developer cannot debug.

### Solution
Contrail models agent knowledge as a trajectory of structured
claims (subject-predicate-value triples with confidence scores
and provenance). New claims explicitly supersede older ones,
forming an auditable chain. When conflicts arise (two claims
about the same topic with no clear superseder), Contrail reports
them explicitly rather than silently picking one at random.

### Key differentiator
Conflict detection in a 100% deterministic, offline-first,
no-LLM-required library. No embeddings, no vector database,
no API keys. Deterministic by design: same input always
produces the same output.

### Architecture (4 packages)
- `@contrail-spec/core` — claim validation (JSON Schema + AJV),
  trajectory resolution, conflict detection, JSONL serialization
- `@contrail-spec/cli` — init, add, log, validate, diff commands
- `@contrail-spec/mcp` — MCP server for Claude Code integration
- `@contrail-spec/engram` — experimental Engram format adapter

### Current status
- v0.2.0, 42 integration + unit tests passing
- All 4 packages published on npm, verified with clean install
- Real MCP stdio integration test (JSON-RPC handshake + tool calls)
- Works with Claude Code today (via MCP, no configuration needed)

### Why it matters for the ecosystem
- **For developers**: AI agents that remember correctly = fewer
  repeated instructions, consistent project conventions, auditable
  decision history
- **For open source maintainers**: Define project conventions once
  in `.contrail/`, and any team member's AI assistant will respect
  them deterministically
- **For the AI tooling landscape**: Proves that effective agent
  memory doesn't require expensive embeddings — structure is enough

### Team
Solo founder. Bootstrapped. First open source project.

### What we'd use the grant for
- _[fill in: domain, hosting, compute for CI, etc.]_
- _[fill in: what you need]_

---

## 2. Elevator pitch (3 versions)

### 1 sentence (Twitter bio)
"Deterministic memory for AI coding agents that detects
conflicts instead of forgetting."

### 30 seconds (networking)
"AI coding assistants don't remember anything between sessions.
Current solutions save the latest value and call it done, but
that means contradictory instructions get silently ignored.
Contrail saves the full history of every preference as a chain
of explicit replacements, and detects when two instructions
contradict each other. It works 100% offline, needs no API keys,
and connects to Claude Code in one line."

### 60 seconds (interview)
"Contrail is a deterministic memory engine for AI coding agents.
When you tell your AI assistant 'use tabs, not spaces' in one
session and it forgets in the next, that's a memory problem.
Today's solutions like Mem0 use AI to find similar memories —
which costs money per query, needs internet, and can give wrong
answers because similarity is probabilistic.

"Contrail takes the opposite approach: it stores preferences as
structured claims with explicit timestamps, sources, and
replacement chains. When an agent stores 'prefer tabs' and later
'prefer spaces' without saying which replaces which, Contrail
reports a conflict instead of guessing. It connects to Claude
Code via the standard MCP protocol, runs entirely offline, and
costs nothing to operate. We published all 4 packages to npm,
have 42 tests passing, and verified everything works with a
clean install. The project is early but functional."

---

## 3. Technical FAQ for applications

### What license?
Apache 2.0

### What language/runtime?
TypeScript, Node.js 18+. Fully typed. ESM-only.

### Dependencies?
Minimal: `commander` (CLI), `ajv` (JSON validation),
`proper-lockfile` (file locking). Zero LLM dependencies.

### Storage format?
JSONL (one JSON object per line), compatible with Claude Code's
native memory format. Stored in `.contrail/claims.jsonl`.

### What agents are supported today?
- Claude Code (via MCP stdio transport)
- Any MCP-compatible agent can be integrated with minimal work

### What's the roadmap?
- Stabilize API (v1.0.0)
- Cursor integration
- Web UI for inspecting claims/trajectories
- Plugin system for multi-agent memory sharing

### Competitive landscape
| Feature | Contrail | Mem0 | Zep | Claude Memory |
|---------|----------|------|-----|---------------|
| Deterministic | ✅ | ❌ | ❌ | ✅ |
| Conflict detection | ✅ | ❌ | ❌ | ❌ |
| Offline-first | ✅ | ❌ | ❌ | ✅ |
| Trajectory history | ✅ | ❌ | ❌ | ❌ |
| No API cost | ✅ | ❌ | ❌ | ✅ |
| Semantic search | ❌ | ✅ | ✅ | ❌ |
| Vector DB | ❌ | ✅ | ✅ | ❌ |
| MCP support | ✅ | ❌ | ❌ | Partial |

### What's the biggest risk?
Adoption. Developers need to care about agent memory quality
enough to install a CLI tool. The value prop (conflict detection
+ trajectory) is strongest for teams that use AI assistants
heavily, which is still a minority.

---

## 4. Programs to apply to

| Program | Why Contrail fits | Grant |
|---------|-------------------|-------|
| **GitHub Accelerator** | Developer tool, open source, AI ecosystem | $10-50k + mentorship |
| **AWS Activate** | Startup building AI infra | $1k-100k credits |
| **Netlify Open Source** | Needs docs site (docs.contrail.dev) | Free Pro plan |
| **Fly.io for Startups** | Hosting for future web UI | $500 credits |
| **Neon Open Source** | Database (future user-facing features) | Free plan |
| **Orb Stack** | AI infrastructure | ~$10k credits |
| **1Password Open Source** | Security for open source projects | Free team account |
| **Sentry for OSS** | Error monitoring | Free team account |

---

## 5. Action checklist

- [ ] Leer `docs/mi-propio-proyecto.md` — entender el proyecto
- [ ] Decir el elevator pitch en voz alta 3 veces
- [ ] Elegir 2-3 programas y aplicar
- [ ] Agregar gif/demo al README (vibe coding de una demo)
- [ ] Crear un badge de "try it" en el README
