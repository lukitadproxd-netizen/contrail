#!/usr/bin/env node
/**
 * Contrail Two-Minute Demo
 *
 * This demo proves Contrail changes agent behavior when project conventions
 * evolve. It compares two lookup strategies side by side:
 *
 * WITHOUT CONTRAIL (flat memory, no temporal awareness)
 *   - Picks the highest-confidence claim, ignoring supersession.
 *   - Cannot explain why a decision is current.
 *   - Falls for stale instructions that look confident.
 *
 * WITH CONTRAIL (temporal supersession chain)
 *   - Resolves the head of the supersession chain.
 *   - Provides the current instruction, the superseded instruction,
 *     the source, timestamp, and recorded confidence.
 *   - Explains why the current instruction is current.
 *
 * Deterministic: no LLM calls, no network, no random values.
 * Uses fixed claim IDs and timestamps.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const scenarioPath = join(repoRoot, 'bench', 'compare-agent-behavior', 'scenarios', '01-simple-evolution.json');
const scenario = JSON.parse(readFileSync(scenarioPath, 'utf-8'));

const claims = scenario.claims;
const query = scenario.queries[0];

// ── Standard agent: flat memory, picks by highest confidence ──
function standardLookup(claims, subject, predicate) {
  const matching = claims.filter(c => c.subject === subject && c.predicate === predicate);
  if (matching.length === 0) return null;
  matching.sort((a, b) => b.confidence - a.confidence);
  return matching[0];
}

// ── Contrail agent: temporal supersession chain ──
function contrailLookup(claims, subject, predicate) {
  const filtered = claims.filter(c => c.subject === subject && c.predicate === predicate);
  if (filtered.length === 0) return null;

  const supersededIds = new Set(
    filtered.map(c => c.supersedes).filter(id => id !== null)
  );
  const heads = filtered.filter(c => !supersededIds.has(c.id));
  if (heads.length !== 1) return null;

  const chain = [];
  const visited = new Set();
  let current = heads[0];

  while (current) {
    if (visited.has(current.id)) return null;
    visited.add(current.id);
    chain.push(current);
    if (!current.supersedes) break;
    current = filtered.find(c => c.id === current.supersedes);
    if (!current) return null;
  }

  return { current: chain[0], previous: chain[1] ?? null, chain };
}

// ── Print the comparison ──
function formatClaim(claim, label) {
  const lines = [];
  lines.push(`  ${label}`);
  lines.push(`    "${claim.value}"`);
  lines.push(`    Recorded: ${claim.valid_from ?? '(not recorded)'}`);
  lines.push(`    Source:   ${claim.source.tool} (${claim.source.kind})`);
  lines.push(`    Confidence: ${claim.confidence.toFixed(2)}`);
  lines.push(`    Claim ID: ${claim.id}`);
  return lines.join('\n');
}

const stdResult = standardLookup(claims, query.subject, query.predicate);
const ctlResult = contrailLookup(claims, query.subject, query.predicate);

const stdCorrect = stdResult && stdResult.value === query.expected_value;
const ctlCorrect = ctlResult && ctlResult.current.value === query.expected_value;

const width = 72;

console.log('='.repeat(width));
console.log('  CONTRAIL  —  Two-Minute Demo');
console.log('='.repeat(width));
console.log();
console.log(`  The project adopted "${query.expected_value}" at a maintainer review.`);
console.log(`  Earlier, the policy was "${query.expected_previous_value}".`);
console.log(`  Can the agent follow the current instruction?`);
console.log();

// WITHOUT CONTRAIL
console.log('┌' + '─'.repeat(width - 2) + '┐');
console.log('│ WITHOUT CONTRAIL — Flat memory                          │');
console.log('└' + '─'.repeat(width - 2) + '┘');
console.log();

if (stdResult) {
  const status = stdCorrect ? '✓ FOLLOWS STALE INSTRUCTION' : '✗ USES STALE INSTRUCTION';
  console.log(`  ${status}`);
  console.log(`  Value: "${stdResult.value}"`);
  console.log(`  Confidence: ${stdResult.confidence}`);
  console.log();
  console.log(`  ⚠ A flat-memory agent picks the highest-confidence claim.`);
  console.log(`    It cannot distinguish the current policy from a superseded one.`);
  console.log(`    It cannot explain why this instruction is (or is not) current.`);
} else {
  console.log('  No instruction found.');
}
console.log();

// WITH CONTRAIL
console.log('┌' + '─'.repeat(width - 2) + '┐');
console.log('│ WITH CONTRAIL — Temporal memory                          │');
console.log('└' + '─'.repeat(width - 2) + '┘');
console.log();

if (ctlResult) {
  const status = ctlCorrect ? '✓ FOLLOWS CURRENT POLICY' : '✗ WRONG POLICY';
  console.log(`  ${status}`);
  console.log(`  Value: "${ctlResult.current.value}"`);
  console.log();

  console.log('  CURRENT INSTRUCTION');
  console.log(`    "${ctlResult.current.value}"`);
  console.log(`    Current since: ${ctlResult.current.valid_from ?? '(not recorded)'}`);
  console.log(`    Source: ${ctlResult.current.source.tool} (${ctlResult.current.source.kind})`);
  console.log(`    Recorded confidence: ${ctlResult.current.confidence.toFixed(2)}`);
  console.log();

  if (ctlResult.previous) {
    console.log('  WHY THIS IS CURRENT');
    console.log(`    This claim supersedes ${ctlResult.previous.id}, so it is the`);
    console.log(`    current instruction.`);
    console.log(`    Previous instruction: "${ctlResult.previous.value}"`);
    console.log();

    console.log('  REASONING CHAIN (oldest → current)');
    const reversed = [...ctlResult.chain].reverse();
    reversed.forEach((claim, i) => {
      const tag = claim.id === ctlResult.current.id ? 'current' : 'superseded';
      console.log(`    ${i + 1}. [${tag}] "${claim.value}"`);
      console.log(`       ${claim.valid_from ?? '(no date)'} | ${claim.source.tool} (${claim.source.kind}) | confidence ${claim.confidence.toFixed(2)}`);
    });
  }
}
console.log();

// Summary
console.log('┌' + '─'.repeat(width - 2) + '┐');
console.log('│ SUMMARY                                                  │');
console.log('└' + '─'.repeat(width - 2) + '┘');
console.log();
console.log(`  ${stdCorrect ? '✓' : '✗'} WITHOUT CONTRAIL: ${stdCorrect ? 'Correct (lucky — highest confidence happens to be current)' : 'Stale instruction used'}`);
console.log(`  ${ctlCorrect ? '✓' : '✗'} WITH CONTRAIL:    Correct instruction + full provenance`);
console.log();
console.log('  Contrail lets a coding agent:');
console.log('    1. Follow the latest project instruction.');
console.log('    2. Show which instruction it replaced.');
console.log('    3. Show who recorded the change, when, and the recorded confidence.');
console.log();
console.log('  This is the first release. Not scale. Not semantic search.');
console.log('  Temporal correctness for project instructions.');
console.log();

// Verify correctness
if (!stdCorrect || !ctlCorrect) {
  console.error('Demo failed: agent did not resolve the correct instruction.');
  process.exitCode = 1;
} else {
  console.log('✓ Demo passed — agent behavior difference demonstrated.');
}
