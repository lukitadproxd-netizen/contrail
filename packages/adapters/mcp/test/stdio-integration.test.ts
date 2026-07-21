import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { spawn, type ChildProcess } from 'child_process';

const SEED_CLAIMS = [
  {
    schema_version: '0.1.0',
    id: 'MCP-TEST-A000000000000001',
    subject: 'repo',
    predicate: 'project.testing.framework',
    value: 'Use Node built-in test runner.',
    value_type: 'string',
    confidence: 0.9,
    valid_from: '2026-01-10T09:00:00Z',
    valid_until: null,
    supersedes: null,
    source: { tool: 'maintainer', session_id: 's1', kind: 'explicit-statement' },
    visibility: 'shared',
    signature: null
  },
  {
    schema_version: '0.1.0',
    id: 'MCP-TEST-B000000000000002',
    subject: 'repo',
    predicate: 'project.testing.framework',
    value: 'Use Vitest.',
    value_type: 'string',
    confidence: 0.98,
    valid_from: '2026-06-15T14:30:00Z',
    valid_until: null,
    supersedes: 'MCP-TEST-A000000000000001',
    source: { tool: 'maintainer', session_id: 's2', kind: 'corrected' },
    visibility: 'shared',
    signature: null
  }
];

function createRequest(id: number, method: string, params?: unknown): string {
  return JSON.stringify({
    jsonrpc: '2.0',
    id,
    method,
    params: params ?? {}
  }) + '\n';
}

function sendRequest(proc: ChildProcess, request: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('MCP response timeout')), 5000);
    let buffer = '';

    const onData = (chunk: Buffer) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      if (lines.length > 1 && lines[0].length > 0) {
        clearTimeout(timeout);
        try {
          const response = JSON.parse(lines[0]);
          proc.stdout?.removeListener('data', onData);
          resolve(response);
        } catch {
          // Wait for more data
        }
      }
    };

    proc.stdout?.on('data', onData);
    proc.stdin?.write(request);
  });
}

describe('MCP stdio integration', () => {
  let testDir: string;
  let storeDir: string;
  let proc: ChildProcess;
  let serverPath: string;

  beforeAll(() => {
    testDir = mkdtempSync(join(tmpdir(), 'contrail-mcp-stdio-'));
    storeDir = join(testDir, '.contrail');
    mkdirSync(storeDir, { recursive: true });
    writeFileSync(
      join(storeDir, 'claims.jsonl'),
      SEED_CLAIMS.map(c => JSON.stringify(c)).join('\n') + '\n',
      'utf-8'
    );

    serverPath = join(__dirname, '..', 'dist', 'cli.js');
  });

  afterAll(() => {
    if (proc && !proc.killed) {
      proc.kill();
    }
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {
      // Windows may hold temp file locks; ignore cleanup failures
    }
  });

  it('connects via stdio and recalls a project instruction', async () => {
    proc = spawn(process.execPath, [serverPath], {
      cwd: testDir,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env }
    });

    // Step 1: Initialize
    const initResponse = await sendRequest(proc, createRequest(1, 'initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test-client', version: '1.0.0' }
    })) as Record<string, unknown>;

    expect(initResponse).toHaveProperty('result');
    const initResult = initResponse.result as Record<string, unknown>;
    expect(initResult).toHaveProperty('capabilities');
    expect(initResult).toHaveProperty('protocolVersion');
    expect(initResult).toHaveProperty('serverInfo');
    expect((initResult.serverInfo as Record<string, unknown>).name).toBe('contrail');

    // Step 2: Send initialized notification (no response expected)
    proc.stdin?.write(JSON.stringify({
      jsonrpc: '2.0',
      method: 'notifications/initialized',
      params: {}
    }) + '\n');

    // Small delay to let server process
    await new Promise(r => setTimeout(r, 100));

    // Step 3: Call contrail_recall
    const recallResponse = await sendRequest(proc, createRequest(2, 'tools/call', {
      name: 'contrail_recall',
      arguments: {
        subject: 'repo',
        predicate: 'project.testing.framework'
      }
    })) as Record<string, unknown>;

    expect(recallResponse).toHaveProperty('result');
    const recallResult = recallResponse.result as Record<string, unknown>;
    expect(recallResult).toHaveProperty('content');
    const content = (recallResult.content as Array<Record<string, unknown>>);
    expect(content[0]).toHaveProperty('text');

    const belief = JSON.parse(content[0].text as string);
    expect(belief.subject).toBe('repo');
    expect(belief.predicate).toBe('project.testing.framework');
    expect(belief.current_belief.value).toBe('Use Vitest.');
    expect(belief.superseded_claim).not.toBeNull();
    expect(belief.superseded_claim.value).toBe('Use Node built-in test runner.');
    expect(belief.why_this_is_current).toContain('supersedes');
    expect(belief.reasoning_chain).toHaveLength(2);
    expect(belief.reasoning_chain[0].status).toBe('superseded');
    expect(belief.reasoning_chain[1].status).toBe('current');

    // Step 4: Call contrail_trajectory
    const trajResponse = await sendRequest(proc, createRequest(3, 'tools/call', {
      name: 'contrail_trajectory',
      arguments: {
        subject: 'repo',
        predicate: 'project.testing.framework'
      }
    })) as Record<string, unknown>;

    expect(trajResponse).toHaveProperty('result');
    const trajResult = trajResponse.result as Record<string, unknown>;
    const trajContent = (trajResult.content as Array<Record<string, unknown>>);
    const trajectory = JSON.parse(trajContent[0].text as string);
    expect(trajectory.totalClaims).toBe(2);
    expect(trajectory.history[0].isHead).toBe(true);
    expect(trajectory.history[0].value).toBe('Use Vitest.');
    expect(trajectory.history[1].isHead).toBe(false);
    expect(trajectory.history[1].value).toBe('Use Node built-in test runner.');

    proc.kill();
  }, 10000);
});
