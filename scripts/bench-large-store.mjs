import { mkdtempSync, rmSync, writeFileSync, readFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const STORE_DIR = '.contrail';
const STORE_FILE = 'claims.jsonl';

const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function generateULID() {
  let timestamp = Date.now();
  let timestampStr = '';
  for (let i = 0; i < 10; i++) {
    timestampStr = alphabet[timestamp % 32] + timestampStr;
    timestamp = Math.floor(timestamp / 32);
  }
  
  let randomStr = '';
  for (let i = 0; i < 16; i++) {
    randomStr += alphabet[Math.floor(Math.random() * 32)];
  }
  
  return timestampStr + randomStr;
}

function generateTestClaim() {
  const predicates = [
    'preference.editor',
    'preference.language',
    'belief.architecture',
    'constraint.language',
    'observation.session',
    'goal.project'
  ];
  const values = [
    'vscode', 'neovim', 'vim', 'emacs',
    'typescript', 'javascript', 'python', 'rust',
    'microservices', 'monolith', 'serverless',
    'english', 'spanish', 'french',
    'high', 'medium', 'low'
  ];

  const predicate = predicates[Math.floor(Math.random() * predicates.length)];
  const value = values[Math.floor(Math.random() * values.length)];

  return {
    schema_version: '0.1.0',
    id: generateULID(),
    subject: 'self',
    predicate,
    value,
    value_type: typeof value === 'number' ? 'number' :
                typeof value === 'boolean' ? 'boolean' :
                Array.isArray(value) ? 'list' : 'string',
    confidence: Math.random(),
    valid_from: new Date().toISOString(),
    valid_until: null,
    supersedes: null,
    source: {
      tool: 'benchmark',
      session_id: 'bench-session',
      kind: 'explicit-statement'
    },
    visibility: 'private',
    signature: null
  };
}

function runBenchmark(claimCount) {
  const testDir = mkdtempSync(join(tmpdir(), 'contrail-bench-'));
  const storePath = join(testDir, '.contrail', 'claims.jsonl');
  
  const storeDir = join(testDir, '.contrail');
  if (!existsSync(storeDir)) {
    mkdirSync(storeDir, { recursive: true });
  }
  writeFileSync(storePath, '', 'utf-8');

  const claims = [];
  for (let i = 0; i < claimCount; i++) {
    claims.push(generateTestClaim());
  }

  const writeStart = Date.now();
  for (const claim of claims) {
    const line = JSON.stringify(claim);
    appendFileSync(storePath, line + '\n', 'utf-8');
  }
  const writeTimeMs = Date.now() - writeStart;

  const readStart = Date.now();
  const content = readFileSync(storePath, 'utf-8');
  const claimsRead = content.trim().split('\n').map(line => JSON.parse(line));
  const readTimeMs = Date.now() - readStart;

  rmSync(testDir, { recursive: true, force: true });

  return {
    claimCount,
    writeTimeMs,
    readTimeMs,
    writeThroughput: Math.round((claimCount / writeTimeMs) * 1000),
    readThroughput: Math.round((claimsRead.length / readTimeMs) * 1000)
  };
}

function runAllBenchmarks() {
  console.log('🏁 Contrail Store Performance Benchmark');
  console.log('========================================\n');
  
  const claimCounts = [100, 500, 1000, 5000, 10000, 20000];
  const results = [];

  for (const count of claimCounts) {
    console.log(`Running benchmark with ${count} claims...`);
    const result = runBenchmark(count);
    results.push(result);
    console.log(`  Write: ${result.writeTimeMs}ms (${result.writeThroughput.toLocaleString()} claims/sec)`);
    console.log(`  Read:  ${result.readTimeMs}ms  (${result.readThroughput.toLocaleString()} claims/sec)\n`);
  }

  console.log('\n📊 Summary');
  console.log('==========\n');
  console.log('| Claims | Write Time | Read Time | Write Throughput | Read Throughput |');
  console.log('|--------|------------|-----------|------------------|-----------------|');
  for (const r of results) {
    console.log(`| ${r.claimCount.toString().padStart(6)} | ${r.writeTimeMs.toString().padStart(10)}ms | ${r.readTimeMs.toString().padStart(9)}ms | ${r.writeThroughput.toLocaleString().padStart(16)} claims/s | ${r.readThroughput.toLocaleString().padStart(15)} claims/s |`);
  }

  console.log('\n📈 Extrapolated Limits');
  console.log('======================\n');
  
  const maxClaims = 100000;
  const avgReadTimePerClaim = results[results.length - 1].readTimeMs / results[results.length - 1].claimCount;
  const estimatedReadTime100k = Math.round(avgReadTimePerClaim * 100000);
  
  console.log(`At ${maxClaims.toLocaleString()} claims:`);
  console.log(`  Estimated read time: ~${estimatedReadTime100k}ms`);
  console.log(`  File size estimate: ~${Math.round(maxClaims * 200 / 1024 / 1024)}MB (avg ~200 bytes/claim)`);
  
  console.log('\n⚠️  Known Limitations:');
  console.log('  - JSONL store is O(n) for reads (loads entire file)');
  console.log('  - Memory usage grows linearly with claim count');
  console.log('  - No indexing - all reads are full scans');
  console.log('  - Recommended practical limit: ~10,000 claims for interactive use');
  console.log('  - For larger stores, consider SQLite backend (v0.2+)');
}

runAllBenchmarks();