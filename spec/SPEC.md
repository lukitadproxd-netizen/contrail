# Contrail Specification v0.1.0

**Status**: Draft — not frozen until tagged `spec-v0.1.0`

## 1. Introduction

Contrail defines a single primitive, the **Claim**: a typed fact about a subject, carrying its own confidence score and an optional link to the claim it replaces. A **Trajectory** is the resolved chain of Claims sharing a `(subject, predicate)` pair, linked through `supersedes`.

Contrail is not a transport protocol (see MCP), not a signing scheme (see Engram), not a retrieval engine (see Mem0/Zep). It is the shape of a belief as it changes — small enough to fit in a JSON Schema.

## 2. The Claim Object

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

### 2.1 Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `schema_version` | string | Spec version this claim conforms to (e.g., `"0.1.0"`) |
| `id` | string (ULID) | Globally unique, sortable by creation time |
| `subject` | string | Who/what this claim is about. Default: `"self"` |
| `predicate` | string | Namespaced key matching `^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){1,4}$` |
| `value` | any | The claim's content. Shape depends on `value_type` |
| `confidence` | number | Float in `[0.0, 1.0]` — certainty at moment of writing |

### 2.2 Optional Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `value_type` | string | `"string"` | One of: `string`, `number`, `boolean`, `enum`, `list` |
| `valid_from` | string (ISO 8601) | claim creation time | When this claim became current |
| `valid_until` | string (ISO 8601) or `null` | `null` | When this claim ceased to be current |
| `supersedes` | string (ULID) or `null` | `null` | ID of the claim this one replaces |
| `source` | object or `null` | `null` | Provenance (see §2.3) |
| `visibility` | string | `"private"` | `"private"` or `"shared"` — label only |
| `signature` | string or `null` | `null` | **Unimplemented in v0.1** — reserved for Ed25519 |

### 2.3 Source Object

```json
{
  "tool": "claude-code",
  "session_id": "sess_a1b2",
  "kind": "explicit-statement"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `tool` | string | Free-form. The tool/system that wrote this claim |
| `session_id` | string or `null` | Opaque session identifier from the writing tool |
| `kind` | string (enum) | **Closed enum** — how the claim was produced |

#### `kind` Enum Values

| Value | Meaning |
|-------|---------|
| `explicit-statement` | Subject stated this directly |
| `inferred` | System derived without direct statement |
| `imported` | Arrived via adapter (Engram, OMP, etc.) |
| `corrected` | Subject explicitly corrected a prior claim |

The enum is closed because filtering by provenance requires a known, finite set. Extension via `x-kind` is permitted.

## 3. Predicate Namespacing

`predicate` is validated **only by shape**:

```
^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){1,4}$
```

**Deliberately not a closed enum.** A controlled vocabulary would require a spec change for every new fact type — the centralized-ontology bottleneck that limited RDF/OWL adoption outside academia. Validation here is structural (does this look like a namespaced key?), not semantic.

### Suggested Root Namespaces (Convention, Not Enforced)

| Root | Meaning | Example |
|------|---------|---------|
| `preference` | Stated or inferred like/dislike | `preference.code_style.paradigm` |
| `belief` | Model of how something works | `belief.architecture.style` |
| `constraint` | Hard rule; typically `confidence: 1.0` | `constraint.language.supported` |
| `observation` | Time-bound fact, not durable trait | `observation.session.quality` |
| `goal` / `project` | Tracked objective | `goal.active.merlo360` |

## 4. Confidence Semantics

`confidence` ∈ `[0.0, 1.0]` represents **how certain the source was at the moment of writing**.

**No monotonicity requirement.** A trajectory where confidence rises (`0.9 → 0.95`) and one where it falls (`0.9 → 0.3`) are equally valid — both are real signal. Confidence dropping across a supersession is not an error state; it is information.

Contrail defines the *shape* of confidence. It does not *calibrate* it — a claim written with `confidence: 0.9` by a careless adapter is indistinguishable at the spec level from one written carefully. This mirrors HTTP's relationship to status codes: the protocol defines what `404` means; it doesn't guarantee servers use it correctly.

Computing temporal decay (e.g., "this claim is 6 months old, treat as less certain") is intentionally **not** part of `contrail-core`. A non-normative recipe is included in the [spec walkthrough](../docs/index.md).

## 5. Supersedes and Trajectory Resolution

A **Trajectory** is the ordered chain of Claims sharing `(subject, predicate)`, linked by `supersedes`, newest first.

### Rules

1. `supersedes` must reference an `id` that exists in the same store
2. **No branching** — a claim's `id` may appear as `supersedes` target at most once (linear chain)
3. **Cycles are invalid** — resolution must fail with a clear error, not loop
4. A claim with no `supersedes` and no incoming `supersedes` is a trajectory of length 1

### Resolution Algorithm (Normative)

```
function resolveTrajectory(claims, subject, predicate):
  filtered = claims.filter(c => c.subject == subject && c.predicate == predicate)
  heads = filtered.filter(c => !filtered.some(other => other.supersedes == c.id))
  if heads.length != 1: error "zero or multiple heads"
  chain = []
  current = heads[0]
  visited = new Set()
  while current:
    if visited.has(current.id): error "cycle detected"
    visited.add(current.id)
    chain.push(current)
    nextId = current.supersedes
    current = filtered.find(c => c.id == nextId) or null
  return chain  // newest first
```

## 6. Serialization

**Canonical form**: Newline-delimited JSON (JSONL), UTF-8, sorted object keys, one claim per line.

Rationale: `git diff` is readable, merges are line-based, streaming parsers work without buffering.

## 7. Versioning and Schema Evolution

- Spec is SemVer'd independently of code packages
- Every claim carries `schema_version`
- **Additive-only within MINOR**: new optional fields only
- Breaking changes = MAJOR bump + migration note
- No silent breaking changes ever

## 8. Compatibility (Engram ⇄ Contrail)

| Engram | Contrail | Lossy? |
|--------|----------|--------|
| `IDENTITY` | `subject` + `predicate: "identity.*"` | No |
| `BELIEFS` | `predicate: "belief.*"` | No |
| `CONSTRAINTS` | `predicate: "constraint.*"`, `confidence: 1.0` | No |
| `CORRECTIONS` | `supersedes` | No |
| `EVOLUTION` | Resolved `Trajectory` | No |
| Ed25519 signature | `signature` field | **Yes (v0.1)** — preserved as opaque blob on import, `null` on export |

Documented lossiness is not a bug; undocumented lossiness is.

## 9. Anti-Patterns

Implementations **must not**:

1. Store conclusions where an observation would do
2. Embed vectors/embeddings in claims (retrieval engine's job)
3. Implement signing in v0.1 (`signature` is a reserved placeholder)
4. Build an access-control enforcement engine (`visibility` is a label)
5. Use Contrail as an agent capability manifest (that's A2A/MCP)
6. Require confidence monotonicity across supersession chains
7. Add a controlled vocabulary for `predicate`

## 10. Conformance Levels

| Level | Requirements |
|-------|--------------|
| **Minimal** | Parse/serialize claims, validate against schema, resolve linear trajectories |
| **Standard** | Minimal + `source.kind` enum handling, `visibility` label propagation |
| **Full** | Standard + Engram adapter round-trip, MCP resource/tools exposure |

---

*End of Specification v0.1.0 (Draft)*