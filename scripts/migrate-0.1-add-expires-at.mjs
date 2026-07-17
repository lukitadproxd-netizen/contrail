#!/usr/bin/env node
/**
 * Migration script: Add expires_at field to claims
 * 
 * This demonstrates a v0.1.x schema evolution (additive-only change).
 * The expires_at field is optional and defaults to null.
 * 
 * Usage: node scripts/migrate-0.1-add-expires-at.mjs <claims.jsonl> [output.jsonl]
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { generateULID } from '../packages/cli/dist/index.js';

const STORE_DIR = '.contrail';
const STORE_FILE = 'claims.jsonl';

function getStorePath(cwd) {
  const dir = resolve(cwd, STORE_DIR);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return resolve(dir, STORE_FILE);
}

function readClaims(storePath) {
  if (!existsSync(storePath)) return [];
  const content = readFileSync(storePath, 'utf-8');
  if (!content.trim()) return [];
  return content.trim().split('\n').map(line => JSON.parse(line));
}

function appendClaim(storePath, claim) {
  const line = JSON.stringify(claim);
  appendFileSync(storePath, line + '\n', 'utf-8');
}

function serializeClaims(claims) {
  return claims.map(serializeClaim).join('\n') + '\n';
}

function serializeClaim(claim) {
  const sorted = Object.keys(claim).sort().reduce((acc, key) => {
    acc[key] = claim[key];
    return acc;
  }, {});
  return JSON.stringify(sorted);
}

function migrateAddExpiresAt(inputPath, outputPath) {
  console.log(`Reading claims from: ${inputPath}`);
  
  if (!existsSync(inputPath)) {
    console.error(`Error: Input file not found: ${inputPath}`);
    process.exit(1);
  }

  const claims = readClaims(inputPath);
  console.log(`Found ${claims.length} claims to migrate`);

  let migrated = 0;
  let skipped = 0;

  const migratedClaims = claims.map(claim => {
    // Skip if already has expires_at
    if ('expires_at' in claim) {
      skipped++;
      return claim;
    }

    // Add expires_at field (null = no expiration)
    const migratedClaim = {
      ...claim,
      expires_at: null
    };

    migrated++;
    return migratedClaim;
  });

  const outputDir = dirname(outputPath);
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const outputContent = serializeClaims(migratedClaims);
  writeFileSync(outputPath, outputContent, 'utf-8');

  console.log(`Migration complete:`);
  console.log(`  Migrated: ${migrated} claims`);
  console.log(`  Skipped:  ${skipped} claims (already had expires_at)`);
  console.log(`  Total:    ${migrated + skipped} claims`);
  console.log(`Output written to: ${outputPath}`);

  // Verify output
  const outputClaims = readClaims(outputPath);
  const hasExpiresAt = outputClaims.every(c => 'expires_at' in c);
  console.log(`Verification: ${hasExpiresAt ? 'PASSED' : 'FAILED'} - All claims have expires_at field`);
}

function printUsage() {
  console.log(`
Usage: node scripts/migrate-0.1-add-expires-at.mjs <input.jsonl> [output.jsonl]

Migration: Add optional expires_at field to claims (v0.1.x additive change)

Arguments:
  input.jsonl   - Path to input claims.jsonl file
  output.jsonl  - Path to output file (default: input.jsonl.migrated)

Example:
  node scripts/migrate-0.1-add-expires-at.mjs .contrail/claims.jsonl
  # Creates .contrail/claims.jsonl.migrated

This migration adds an optional 'expires_at' field to all claims that don't already have it.
The field is set to null (no expiration) by default.
`);
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  const inputPath = resolve(args[0]);
  const outputPath = resolve(args[1] || `${args[0]}.migrated`);

  migrateAddExpiresAt(inputPath, outputPath);
}

main();