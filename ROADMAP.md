# Contrail Roadmap

## Vision
**A vapor trail for what an AI knows about you** — portable, confidence-weighted, versioned personal context claims with temporal supersession.

---

## v0.1.x (Current - Stabilization)

### v0.1.0 (Released)
- [x] Core schema v0.1.0 frozen
- [x] @contrailspec/core: parse, validate, resolveTrajectory, serialize
- [x] @contrailspec/cli: init, add, log, validate, diff
- [x] @contrailspec/mcp: resource + 3 tools (remember, recall, trajectory)
- [x] @contrailspec/engram: bidirectional adapter (convertToEngram, convertFromEngram)
- [x] 25/25 spec fixtures validated
- [x] 38 tests passing across 4 packages

### v0.1.1 (Target: Q3 2026)
- [ ] SQLite backend for @contrailspec/cli (optional, for >10k claims)
- [ ] `contrail migrate` CLI command with dry-run
- [ ] Streaming JSONL parser for large files
- [ ] Windows CI pipeline (currently Linux/macOS only)

### v0.1.2 (Target: Q4 2026)
- [ ] Python SDK (contrail-py)
- [ ] Go SDK (contrail-go)
- [ ] VS Code extension: claim linting + autocomplete
- [ ] `contrail diff` - show belief changes between two stores

### v0.1.3 (Target: Q1 2027)
- [ ] `contrail migrate` with schema version auto-detection
- [ ] Rust SDK (contrail-rs)
- [ ] Benchmark suite in CI (regression detection)

---

## v0.2.x (Minor - Additive Features)

### v0.2.0 (Target: Q2 2027)
- [ ] **expires_at** field (optional TTL for claims) - *migration ready*
- [ ] **tags** field (free-form categorization)
- [ ] **correlation_id** for cross-claim linking
- [ ] **source.confidence_basis** (free-text rationale)
- [ ] Compound indexes in SQLite backend

### v0.2.1
- [ ] Batch import/export (JSONL, CSV)
- [ ] `contrail watch` - tail store changes in real-time
- [ ] Webhook notifications on claim changes

### v0.2.2
- [ ] Partial claim updates (merge-patch semantics)
- [ ] Claim templates / schemas for common domains

---

## v0.3.x (Schema Evolution)

### v0.3.0 (Target: 2027)
- [ ] **Signed claims** (Ed25519 in `signature` field)
- [ ] **Multi-subject** claims (subject[] array)
- [ ] **Proof/evidence** references (URLs, hashes)
- [ ] **Access control** (ACL per claim, not just visibility label)

---

## v1.0.0 (Stable / Production Ready)

### Transition Criteria (per GOVERNANCE.md)
- [ ] Version 1.0.0 released
- [ ] **OR** 3 external production adopters confirmed

### Pre-requisites
- [ ] 6 months on v0.x without breaking changes
- [ ] 95%+ test coverage maintained
- [ ] 3+ external SDKs (TS, Python, Go, Rust)
- [ ] Security audit completed
- [ ] Performance benchmarks published
- [ ] Migration tooling for v0.x → v1.0

---

## Stretch / Research

| Area | Status | Notes |
|------|--------|-------|
| **Embeddings integration** | Research | Contrail JSONL as ingestion source for Mem0/Zep |
| **Decentralized sync** | Research | CRDT-based store replication |
| **Policy engine** | Research | OPA/Rego for claim validation |
| **Temporal queries** | Design | `contrail query --since --until` |
| **Federated identity** | Research | DID integration for `subject` |

---

## Contribution Guidelines

### How to Propose a Roadmap Item
1. Open a GitHub Issue with label `roadmap`
2. Include: problem statement, proposed solution, alternatives considered
3. Must not break v0.1 schema (additive only until v0.2)

### Prioritization Framework
| Priority | Criteria |
|----------|----------|
| P0 - Blocking | Breaks existing adopters, security |
| P1 - High Value | Enables major use case, multiple requests |
| P2 - Nice to Have | Quality of life, single request |
| P3 - Research | Exploratory, no immediate demand |

---

## Release Cadence

| Channel | Cadence | Stability |
|---------|---------|-----------|
| `latest` (npm tag) | Monthly | Pre-release (v0.x) |
| `stable` (npm tag) | Quarterly | v0.x patch |
| GitHub Releases | Per version | Full changelog |

---

## External Dependencies Tracker

| Dependency | Current | Target | Risk |
|------------|---------|--------|------|
| `@modelcontextprotocol/sdk` | ^1.0.0 | Track upstream | Medium |
| `ajv` (validation) | ^8.12.0 | ^8.x | Low |
| `commander` (CLI) | ^12.0.0 | ^12.x | Low |
| `zod` (MCP schemas) | ^3.23.0 | ^3.x | Low |
| `vitest` (testing) | ^4.1.0 | ^4.x | Low |
| `typescript` | ^5.4.0 | ^5.x | Low |

---

## Milestone Tracking

| Milestone | Target Date | Status |
|-----------|-------------|--------|
| v0.1.0 Release | 2026-07-16 | ✅ Done |
| v0.1.1 Patch | 2026-09-15 | 🟡 Planned |
| v0.1.2 Minor | 2026-12-01 | 🟡 Planned |
| v0.2.0 Minor | 2027-03-15 | 🟢 Proposed |
| v1.0.0 Stable | 2027-07-16 | 🔵 Target |

---

*Last updated: 2026-07-16*
*This document is version-controlled. Propose changes via PR to `ROADMAP.md`.*