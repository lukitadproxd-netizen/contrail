import { Command } from 'commander';
import { createStore, generateULID, type Store } from './index.js';
import { parseClaim, resolveCurrentBelief, resolveTrajectory } from '@lukitadproxd-netizen/core';
import type { Claim } from '@lukitadproxd-netizen/core';

const program = new Command();

program
  .name('contrail')
  .description('Contrail — versioned project memory for coding agents')
  .version('0.0.0');

function getStore(cwd: string): Store {
  return createStore(cwd);
}

function formatSource(claim: Claim): string {
  if (!claim.source) return 'not recorded';
  return `${claim.source.tool} (${claim.source.kind})`;
}

function formatTimestamp(claim: Claim): string {
  return claim.valid_from ?? 'not recorded';
}

function printBeliefExplanation(claims: Claim[], subject: string, predicate: string): void {
  const belief = resolveCurrentBelief(claims, subject, predicate);
  if (!belief) {
    console.log(`No claims for ${subject}/${predicate}`);
    return;
  }

  const { current, previous, history } = belief;
  console.log(`${subject}/${predicate}`);
  console.log('\nCURRENT INSTRUCTION');
  console.log(`  ${JSON.stringify(current.value)}`);
  console.log(`  Current since: ${formatTimestamp(current)}`);
  console.log(`  Source: ${formatSource(current)}`);
  console.log(`  Recorded confidence: ${current.confidence.toFixed(2)}`);
  console.log(`  Claim: ${current.id}`);

  console.log('\nWHY THIS IS CURRENT');
  if (previous) {
    console.log(`  This claim supersedes ${previous.id}, so it is the current instruction.`);
    console.log(`  Previous instruction: ${JSON.stringify(previous.value)}`);
  } else {
    console.log('  This is the only recorded instruction for this subject and predicate.');
  }

  console.log('\nREASONING CHAIN (oldest → current)');
  for (const [index, claim] of history.slice().reverse().entries()) {
    const status = claim.id === current.id ? 'current' : 'superseded';
    console.log(`  ${index + 1}. [${status}] ${JSON.stringify(claim.value)}`);
    console.log(`     ${formatTimestamp(claim)} | ${formatSource(claim)} | confidence ${claim.confidence.toFixed(2)} | ${claim.id}`);
  }
}

program
  .command('init')
  .description('Initialize a new Contrail store in the current directory')
  .action(() => {
    const store = getStore(process.cwd());
    store.init();
    console.log('Initialized .contrail/claims.jsonl');
  });

program
  .command('add <predicate> <value>')
  .description('Add a new claim (creates or supersedes)')
  .option('-c, --confidence <number>', 'Confidence 0.0-1.0', '0.9')
  .option('-s, --supersedes <id>', 'ULID of claim to supersede')
  .option('--subject <string>', 'Subject (default: "self")', 'self')
  .option('--value-type <type>', 'Value type: string|number|boolean|enum|list', 'string')
  .option('--source-tool <string>', 'Source tool name', 'contrail-cli')
  .option('--source-session <string>', 'Source session ID')
  .option('--source-kind <kind>', 'Source kind: explicit-statement|inferred|imported|corrected', 'explicit-statement')
  .option('--visibility <type>', 'Visibility: private|shared', 'private')
  .action(async (predicate: string, value: string, options) => {
    const store = getStore(process.cwd());
    const confidence = parseFloat(options.confidence);
    if (isNaN(confidence) || confidence < 0 || confidence > 1) {
      console.error('Confidence must be a number between 0.0 and 1.0');
      process.exit(1);
    }

    const id = generateULID();
    const claim = {
      schema_version: '0.1.0',
      id,
      subject: options.subject,
      predicate,
      value: options.valueType === 'number' ? parseFloat(value) : 
             options.valueType === 'boolean' ? value === 'true' :
             options.valueType === 'list' ? value.split(',').map(v => v.trim()) :
             value,
      value_type: options.valueType,
      confidence,
      valid_from: new Date().toISOString(),
      valid_until: null,
      supersedes: options.supersedes || null,
      source: {
        tool: options.sourceTool,
        session_id: options.sourceSession || null,
        kind: options.sourceKind
      },
      visibility: options.visibility,
      signature: null
    };

    const { claim: parsed, error } = await parseClaim(JSON.stringify(claim));
    if (error) {
      console.error('Invalid claim:', error);
      process.exit(1);
    }

    store.append(parsed!);
    console.log(`✓ Claim ${parsed!.id} written`);
  });

program
  .command('log [predicate]')
  .description('Show trajectory for a predicate (newest first)')
  .option('--subject <string>', 'Subject (default: "self")', 'self')
  .action(async (predicate, options) => {
    const store = getStore(process.cwd());
    const claims = store.readAll();
    
    if (!predicate) {
      // Show all trajectories
      const trajectories = new Map<string, Claim[]>();
      for (const claim of claims) {
        const key = `${claim.subject}|${claim.predicate}`;
        if (!trajectories.has(key)) trajectories.set(key, []);
        trajectories.get(key)!.push(claim);
      }
      
      for (const [key, trajectoryClaims] of trajectories) {
        const parts = key.split('|') as [string, string];
        if (parts.length !== 2) continue;
        const [subject, predicate] = parts;
        try {
          const trajectory = resolveTrajectory(trajectoryClaims, subject, predicate);
          console.log(`\n${subject}/${predicate}:`);
          for (const c of trajectory.claims) {
            const marker = c.id === trajectory.head.id ? '→' : ' ';
            console.log(`  ${marker} ${c.id} | ${c.confidence.toFixed(2)} | ${JSON.stringify(c.value)}`);
          }
        } catch {
          console.log(`\n${key}: (invalid trajectory)`);
        }
      }
      return;
    }

    printBeliefExplanation(claims, options.subject, predicate);
  });

program
  .command('validate')
  .description('Validate all claims in the store')
  .action(async () => {
    const store = getStore(process.cwd());
    const claims = store.readAll();
    
    let valid = 0;
    let invalid = 0;
    
    for (const claim of claims) {
      const { error } = await parseClaim(JSON.stringify(claim));
      if (error) {
        console.error(`✗ ${claim.id}: ${error}`);
        invalid++;
      } else {
        valid++;
      }
    }
    
    console.log(`\nValid: ${valid}, Invalid: ${invalid}`);
    if (invalid > 0) process.exit(1);
  });

program
  .command('diff <predicate>')
  .description('Show belief change delta for a predicate')
  .option('--subject <string>', 'Subject (default: "self")', 'self')
  .action(async (predicate, options) => {
    const store = getStore(process.cwd());
    const claims = store.readAll();
    
    try {
      const trajectory = resolveTrajectory(claims, options.subject, predicate);
      if (trajectory.length < 2) {
        console.log('No previous belief to compare');
        return;
      }
      
      console.log(`${options.subject}/${predicate} belief change:`);
      for (let i = trajectory.claims.length - 1; i >= 0; i--) {
        const c = trajectory.claims[i];
        if (!c) continue;
        const next = trajectory.claims[i + 1];
        if (next && next.source) {
          console.log(`\n${next.id} → ${c.id}`);
          console.log(`  Value: ${JSON.stringify(next.value)} → ${JSON.stringify(c.value)}`);
          console.log(`  Confidence: ${next.confidence.toFixed(2)} → ${c.confidence.toFixed(2)}`);
          console.log(`  Source: ${next.source.kind} (${next.source.tool})`);
        }
      }
    } catch {
      console.error('Invalid trajectory');
      process.exit(1);
    }
  });

program.parse();
