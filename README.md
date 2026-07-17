# Contrail

**A vapor trail for what an AI knows about you — where it came from, how sure it is, and what it used to think before it changed its mind.**

---

## Why Contrail Exists

Every AI memory system today stores the *current* belief and discards the trajectory that produced it. When a coding assistant "remembers" your preference for functional composition, it silently overwrites the fact that months earlier you preferred OOP — at what confidence, and why it changed. That history is the highest-signal input for modeling a person accurately, and it is being deleted by every memory tool on the market.

Contrail gives "a fact about you" a first-class temporal shape:

```
claim → confidence → supersedes(previous claim) → source
```

Not storage (Mem0/Zep). Not transport (MCP). Not signing (Engram). The missing layer in between: the **shape of a belief as it changes**, expressed as a tiny, versioned, git-diffable JSON Schema with reference adapters into protocols that already move data.

## What Contrail Is

| Aspect | Description |
|--------|-------------|
| **One primitive** | The `Claim` object — a typed fact with confidence, validity window, and optional `supersedes` link |
| **Trajectory** | The resolved chain of claims sharing `(subject, predicate)`, newest first |
| **Storage** | Append-only JSONL (one claim per line, sorted keys) — git-native, diffable |
| **Schema** | JSON Schema (`claim.schema.json`) — normative, SemVer'd, CI-validated |
| **Transport** | Rides **MCP** — the flagship adapter exposes claims as an MCP resource + 3 tools |
| **Interop** | Bidirectional adapter to **Engram** envelopes (implemented v0.1) |
| **License** | Apache-2.0 — explicit patent grant, enterprise-safe |

## What Contrail Is Not

| Not | Because |
|-----|---------|
| A transport protocol | MCP solved that (Linux Foundation, 10K+ servers) |
| An agent capability manifest | A2A's Agent Card and MCP's server descriptor do that |
| A signing scheme | Engram does Ed25519; Contrail reserves a `signature` field for v0.2+ |
| An access-control engine | `visibility` is a label; enforcement belongs to the host system |
| A retrieval engine | Mem0/Zep/MemMachine do embeddings; Contrail's JSONL is a valid ingestion source |
| An ontology | `predicate` is free-form string with structural validation only — no central registry |

## Quickstart (5 minutes)

```bash
# 1. Install
npm install -g @lukitadproxd-netizen/cli

# 2. Initialize a memory store
contrail init
# Creates .contrail/claims.jsonl in current directory

# 3. Add your first claim
contrail add preference.editor "vscode" --confidence 0.9
# ✓ Claim 01J9Z8QK3N4R5S6T7V8W9X0Y1Z written

# 4. See the trajectory
contrail log preference.editor
# self/preference.editor:
#   → 01J9Z8QK3N4R5S6T7V8W9X0Y1Z | 0.90 | "vscode"

# 5. Update your preference (creates a supersession)
contrail add preference.editor "neovim" --confidence 0.95 --supersedes 01J9Z8QK3N4R5S6T7V8W9X0Y1Z
# ✓ Claim 01J9A2B3C4D5E6F7G8H9I0J1K2 written

# 6. View the full history
contrail log preference.editor
# self/preference.editor:
#   → 01J9A2B3C4D5E6F7G8H9I0J1K2 | 0.95 | "neovim"
#   → 01J9Z8QK3N4R5S6T7V8W9X0Y1Z | 0.90 | "vscode"

# 7. View belief change delta
contrail diff preference.editor

# 8. Connect to Claude Code via MCP
claude mcp add contrail -- npx @lukitadproxd-netizen/mcp
# In Claude Code: "What's my editor preference?"
# → "You switched from vscode (0.9) to neovim (0.95) on July 16."
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `contrail init` | Initialize a new Contrail store in the current directory |
| `contrail add <predicate> <value>` | Add a new claim (creates or supersedes) |
| `contrail log [predicate]` | Show trajectory for a predicate (newest first) |
| `contrail validate` | Validate all claims in the store |
| `contrail diff <predicate>` | Show belief change delta for a predicate |

### Add Command Options

| Option | Description | Default |
|--------|-------------|---------|
| `-c, --confidence <number>` | Confidence 0.0-1.0 | 0.9 |
| `-s, --supersedes <id>` | ULID of claim to supersede | — |
| `--subject <string>` | Subject | "self" |
| `--value-type <type>` | Value type: string\|number\|boolean\|enum\|list | string |
| `--source-tool <string>` | Source tool name | contrail-cli |
| `--source-session <string>` | Source session ID | — |
| `--source-kind <kind>` | Source kind: explicit-statement\|inferred\|imported\|corrected | explicit-statement |
| `--visibility <type>` | Visibility: private\|shared | private |

## MCP Adapter

The `@lukitadproxd-netizen/mcp` package provides an MCP server with:

### Resource

- `contrail://claims` — Returns all claims as JSON

### Tools

| Tool | Description |
|------|-------------|
| `contrail_remember` | Store a new claim about the user |
| `contrail_recall` | Retrieve current belief for a subject/predicate |
| `contrail_trajectory` | Show the full belief history for a subject/predicate |

### MCP Server Usage

```typescript
import { ContrailMCPServer } from '@lukitadproxd-netizen/mcp';

const server = new ContrailMCPServer({
  storePath: '/path/to/.contrail/claims.jsonl' // optional, defaults to cwd
});

// Get the MCP server instance for stdio transport
const mcpServer = server.getServer();
```

```json
{
  "schema_version": "0.1.0",
  "id": "01J9Z8QK3N4R5S6T7V8W9X0Y1Z",
  "subject": "self",
  "predicate": "preference.code_style.paradigm",
  "value": "functional-composition",
  "value_type": "enum",
  "confidence": 0.9,
  "valid_from": "2026-06-01T00:00:00Z",
  "valid_until": null,
  "supersedes": "01J8X7QK2M3N4P5Q6R7S8T9U0V",
  "source": {
    "tool": "claude-code",
    "session_id": "sess_a1b2",
    "kind": "explicit-statement"
  },
  "visibility": "private",
  "signature": null
}
```

### Required Fields

| Field | Type | Purpose |
|-------|------|---------|
| `id` | ULID | Sortable, no coordination needed |
| `subject` | string | Who/what this is about (default `"self"`) |
| `predicate` | string | Namespaced key: `category.subcategory.key` |
| `value` | any | The claim's content |
| `confidence` | number | 0.0–1.0, certainty at moment of writing |

### Optional Fields

| Field | Default | Notes |
|-------|---------|-------|
| `value_type` | `"string"` | `string`, `number`, `boolean`, `enum`, `list` |
| `valid_from` | claim time | ISO 8601 |
| `valid_until` | `null` | `null` = still current |
| `supersedes` | `null` | ULID of replaced claim |
| `source` | `null` | Provenance: tool, session, kind |
| `visibility` | `"private"` | `"private"` or `"shared"` (label only) |
| `signature` | `null` | **Unimplemented in v0.1** |

## Predicate Namespacing

```
^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){1,4}$
```

Structural validation only — **no central enum**. Suggested roots:

| Root | Example |
|------|---------|
| `preference` | `preference.code_style.paradigm` |
| `belief` | `belief.architecture.style` |
| `constraint` | `constraint.language.supported` |
| `observation` | `observation.session.quality` |
| `goal` / `project` | `goal.active.merlo360` |

## Confidence Semantics

`confidence` is **how certain the source was at the moment of writing**. No monotonicity required:

- `0.9 → 0.95` = belief reinforced
- `0.9 → 0.3` = source became *less* sure (valid signal, not error)

Decay over time is **intentionally not in core** — every implementation decides its own strategy. A non-normative recipe lives in `docs/spec-explorer.md`.

## Trajectory Resolution

A `Trajectory` = all claims sharing `(subject, predicate)`, linked by `supersedes`, newest first.

Rules:
- `supersedes` must reference an existing claim in the same store
- No branching — a claim can only be superseded once (linear chain)
- Cycles are invalid (validation fails with clear error)

## Source Kind (Closed Enum)

| Kind | Meaning |
|------|---------|
| `explicit-statement` | Subject said this directly |
| `inferred` | System derived it without direct statement |
| `imported` | Came via adapter (Engram, OMP, etc.) |
| `corrected` | Subject explicitly corrected a prior claim |

Closed because filtering by provenance requires a known, finite set.

## Architecture

```
┌─────────────────────────────────────┐
│           User Tools                │
│  (Claude Code, Cursor, VS Code)     │
└──────────────┬──────────────────────┘
               │ MCP protocol
               ▼
┌─────────────────────────────────────┐
│         @lukitadproxd-netizen/mcp           │
│  MCP Server Adapter (flagship)      │
│  - Resource: claims.jsonl           │
│  - Tools: remember, recall, trajectory
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│        @lukitadproxd-netizen/core           │
│  parse / validate / resolve / serialize
└──────────────┬──────────────────────┘
               │
       ┌───────┴───────┐
       ▼               ▼
┌──────────────┐ ┌──────────────┐
│ JSONL Store  │ │ @lukitadproxd-netizen/engram │
│ (git-native) │ │ (implemented)    │
└──────────────┘ └──────────────┘
```

## Repository Structure

```
contrail/
├── spec/
│   ├── SPEC.md                    # Normative prose spec
│   ├── CHANGELOG.md               # Spec version history
│   └── schema/
│       └── v0.1/
│           ├── claim.schema.json  # Normative JSON Schema
│           └── examples/
│               ├── valid/         # CI-enforced passing fixtures
│               └── invalid/       # CI-enforced failing fixtures
├── packages/
│   ├── core/                      # @lukitadproxd-netizen/core
│   ├── cli/                       # @lukitadproxd-netizen/cli (bin: contrail)
│   ├── adapters/
│   │   ├── mcp/                   # @lukitadproxd-netizen/mcp (flagship)
│   │   └── engram/                # @lukitadproxd-netizen/engram (stretch)
├── examples/
│   └── coding-assistant-memory/   # Runnable demo
├── docs/
│   ├── index.md                   # Quickstart
│   ├── spec-explorer.md           # Annotated schema walkthrough
│   └── faq.md                     # "Why not Engram/OMP/MCP/Mem0?"
├── scripts/
│   └── validate-examples.js       # Fixture validator
└── .github/workflows/ci.yml       # Lint, test, spec-validate
```

## Related Standards

| Standard | Relationship |
|----------|--------------|
| **MCP** | Primary transport — Contrail exposes claims as MCP resource + tools |
| **Engram** | Bidirectional envelope adapter — Engram's `CORRECTIONS`/`EVOLUTION` map to `supersedes` chains |
| **A2A** | Out of scope — agent capability manifests are A2A's job |
| **Mem0/Zep** | Retrieval engines — Contrail JSONL is a valid ingestion source |
| **OpenTelemetry** | Different domain — observability, not memory portability |

## FAQ

**Why not just use Engram?**
Engram is a signed envelope format with HTTP API. Contrail is a *temporal claim shape* that rides on MCP and translates to Engram. They solve adjacent problems; Contrail's `supersedes` chain is first-class and queryable, Engram's `EVOLUTION` is a changelog field.

**Why not OMP?**
OMP is an MCP-native memory store with CLI — great if flat memories suffice. Contrail adds the temporal supersession chain with confidence that OMP doesn't model.

**Why not RDF/Solid/ActivityPub?**
15+ years of evidence that generalized triple stores lose to flat JSON + REST for developer adoption outside government/academia. Contrail is JSON-pragmatic, RDF-inspired.

**Is this production-ready?**
v0.1 is a **spec + reference implementation**. The schema is frozen at `spec-v0.1.0`. Adopters should expect MAJOR bumps before v1.0. See `GOVERNANCE.md` for transition triggers.

## License

Apache-2.0 — see [LICENSE](LICENSE).

## Governance

BDFL through v0.x. Transitions at v1.0 or 3 external production adopters. See [GOVERNANCE.md](GOVERNANCE.md).

---

*AI changes. Your memory shouldn't.*