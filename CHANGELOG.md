# Code Changelog

All notable changes to the Contrail codebase are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Engram Adapter (Phase 2.1)**: Bidirectional conversion between Contrail Claims/Trajectories and Engram envelopes
  - `convertToEngram(claim, trajectory?)`: Maps identity/bid -> EngramEnvelope
  - `convertFromEngram(envelope)`: EngramEnvelope -> Claim[]
  - Identity claims -> IDENTITY, Beliefs -> BELIEFS, Constraints -> CONSTRAINTS (confidence forced to 1.0)
  - Supersedes chain -> CORRECTIONS, Full trajectory -> EVOLUTION
  - 8 tests covering all conversion paths
- **CLI Tests (Phase 1.4)**: 5 tests for store operations
  - init(), readAll() before/after init, append+roundtrip, supersedes chain, generateULID uniqueness
- **MCP Tests (Phase 1.5)**: 3 smoke tests for remember/recall/trajectory tools
  - Uses temporary store per test, accesses internal tool handlers for direct invocation
- **Engram Tests (Phase 1.6)**: 8 tests for adapter conversions
  - Identity, belief, constraint (with confidence 1.0), supersedes/CORRECTIONS, EVOLUTION round-trip
- **Test Coverage (Phase 2.3)**: Added `@vitest/coverage-v8` to all packages
  - Core: 93.65% statements, 73.58% branches, 92.59% functions, 97.19% lines
  - Test:coverage scripts added to all package.json files
- **Scope Migration (Phase 1.3)**: Renamed npm scope from `@contrailspec/*` to `@lukitadproxd-netizen/*`
  - Updated all 4 package.json files, root package.json, schema $id, all markdown docs
- **Build Order Fix (Phase 1.1)**: Root build script now compiles in dependency order: core → engram → cli → mcp
- **Gitignore Fix (Phase 1.2)**: Removed `package-lock.json` from .gitignore (already tracked)
- **README Updates (Phase 2.2)**: Architecture diagram updated to show Engram adapter as implemented (not stretch)

### Changed
- **Package scope**: `@contrailspec/*` -> `@lukitadproxd-netizen/*` across all code and docs
- **Schema $id**: `https://contrailspec.dev/schema/...` -> `https://lukitadproxd-netizen.github.io/contrail/schema/...`
- **All markdown docs**: Updated GitHub URLs, npm install commands, import paths
- **Core package**: vitest upgraded from 1.6.1 to 4.1.10 (matching @vitest/coverage-v8)
- **All packages**: vitest and @vitest/coverage-v8 aligned to 4.1.10

### Fixed
- **MCP Server**: File lock added to appendClaim() to prevent concurrent write races
- **Engram Adapter**: Fixed TS error on optional valid_from (now defaults to now)
- **CLI Build**: Fixed @contrailspec/core -> @lukitadproxd-netizen/core imports
- **CLI Store**: generateULID() now produces valid 26-char Crockford Base32 ULIDs
- **MCP Tests**: Added registerTool() to expose handlers for direct test invocation
- **Engram Tests**: Fixed enum object literal syntax in test expectations

## [0.0.0] - 2026-07-16

### Added
- Initial Contrail specification v0.1.0 (Draft)
- Core library: parse, validate, resolveTrajectory, serialize
- CLI: init, add, log, validate, diff commands
- MCP Adapter: resource + 3 tools (remember, recall, trajectory)
- Engram Adapter: stub (now implemented)
- JSON Schema with 16 valid + 9 invalid fixtures
- CI workflow: lint, typecheck, test, spec validation
- Governance docs: GOVERNANCE.md, CONTRIBUTING.md, CODE_OF_CONDUCT.md
- License: Apache-2.0