#!/usr/bin/env node
import { runBenchmark } from './runner.mjs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const scenariosDir = join(__dirname, 'scenarios');

const result = runBenchmark(scenariosDir);

function pad(s, n) {
  return String(s).padEnd(n);
}

console.log('=========================================================================');
console.log('  CONTRAIL — Agent Behavior Benchmark');
console.log('=========================================================================');
console.log();

for (const scenario of result.scenarios) {
  console.log(`  Scenario: ${scenario.name}`);
  console.log(`  ${scenario.description}`);
  console.log();

  for (const q of scenario.queries) {
    const sym = q.standard.correct ? '✓' : '✗';
    console.log(`    Query: ${q.subject}/${q.predicate}`);
    console.log(`    Expected:   "${q.expected_value}"`);
    console.log(`    ─────────────────────────────────`);
    console.log(`    WITHOUT CONTRAIL`);
    console.log(`      ${sym} Value: "${q.standard.value}"`);
    console.log(`      ${q.standard.provenance ? '✓' : '✗'} Provenance: ${q.standard.provenance ? 'yes' : 'none (flat memory)'}`);
    console.log();
    console.log(`    WITH CONTRAIL`);
    const symC = q.contrail.correct ? '✓' : '✗';
    console.log(`      ${symC} Value: "${q.contrail.value}"`);
    console.log(`      ${q.contrail.provenance ? '✓' : '✗'} Provenance: ${q.contrail.provenance ? 'yes (full chain)' : 'no'}`);
    if (q.contrail.previousValue !== null) {
      console.log(`      Superseded: "${q.contrail.previousValue}"`);
    }
    if (q.contrail.explanation) {
      console.log(`      Explanation: ${q.contrail.explanation}`);
    }
    console.log();
  }
  console.log(`  ${scenario.note}`);
  console.log('─────────────────────────────────────────────────────────────────────────');
  console.log();
}

console.log('=========================================================================');
console.log('  BENCHMARK RESULTS');
console.log('=========================================================================');
console.log();
console.log(`  ${pad('', 30)} ${pad('Passed', 10)} ${pad('Total', 10)} ${pad('Score', 10)}`);
console.log(`  ${pad('──────────────────────────────', 30)} ${pad('──────────', 10)} ${pad('──────────', 10)} ${pad('──────────', 10)}`);
console.log(`  ${pad('Standard agent (flat memory)', 30)} ${pad(String(result.standardPassed), 10)} ${pad(String(result.totalQueries), 10)} ${pad(`${result.standardPct}%`, 10)}`);
console.log(`  ${pad('Contrail agent (temporal)', 30)} ${pad(String(result.contrailPassed), 10)} ${pad(String(result.totalQueries), 10)} ${pad(`${result.contrailPct}%`, 10)}`);
console.log();
console.log(`  WITHOUT CONTRAIL: ${result.standardPassed}/${result.totalQueries} queries correct (${result.standardPct}%)`);
console.log(`  WITH CONTRAIL:    ${result.contrailPassed}/${result.totalQueries} queries correct (${result.contrailPct}%)`);
console.log();

if (result.contrailPassed > result.standardPassed) {
  console.log(`  ➜ Contrail improves correctness by ${result.contrailPct - result.standardPct} percentage points.`);
  console.log(`  ➜ Contrail provides provenance (superseded value, chain length) where`);
  console.log(`    flat memory provides none.`);
} else if (result.contrailPassed === result.standardPassed) {
  console.log(`  ➜ Same correctness, but Contrail adds provenance and explanation.`);
}
console.log();
console.log('=========================================================================');
process.exit(0);
