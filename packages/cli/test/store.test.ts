import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { createStore, generateULID } from '../src/store.js';

describe('Store', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'contrail-test-'));
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('init() creates a claims.jsonl file', () => {
    const store = createStore(testDir);
    store.init();

    const claimsPath = join(testDir, '.contrail', 'claims.jsonl');
    expect(readFileSync(claimsPath, 'utf-8')).toBe('');
  });

  it('readAll() returns empty array before init', () => {
    const store = createStore(testDir);
    const claims = store.readAll();
    expect(claims).toEqual([]);
  });

  it('append() + readAll() roundtrips a claim', () => {
    const store = createStore(testDir);
    store.init();

    const id = generateULID();
    const claim = {
      schema_version: '0.1.0',
      id,
      subject: 'self',
      predicate: 'preference.editor',
      value: 'vscode',
      value_type: 'string',
      confidence: 0.9,
      valid_from: new Date().toISOString(),
      valid_until: null,
      supersedes: null,
      source: {
        tool: 'test',
        session_id: null,
        kind: 'explicit-statement'
      },
      visibility: 'private',
      signature: null
    };

    store.append(claim);
    const claims = store.readAll();

    expect(claims).toHaveLength(1);
    expect(claims[0]).toEqual(claim);
  });

  it('supersedes chain reads correctly', () => {
    const store = createStore(testDir);
    store.init();

    const id1 = generateULID();
    const claim1 = {
      schema_version: '0.1.0',
      id: id1,
      subject: 'self',
      predicate: 'preference.editor',
      value: 'vscode',
      value_type: 'string',
      confidence: 0.8,
      valid_from: '2025-01-01T00:00:00Z',
      valid_until: '2025-06-01T00:00:00Z',
      supersedes: null,
      source: { tool: 'test', session_id: null, kind: 'explicit-statement' },
      visibility: 'private',
      signature: null
    };

    const id2 = generateULID();
    const claim2 = {
      schema_version: '0.1.0',
      id: id2,
      subject: 'self',
      predicate: 'preference.editor',
      value: 'neovim',
      value_type: 'string',
      confidence: 0.95,
      valid_from: '2025-06-01T00:00:00Z',
      valid_until: null,
      supersedes: id1,
      source: { tool: 'test', session_id: null, kind: 'corrected' },
      visibility: 'private',
      signature: null
    };

    store.append(claim1);
    store.append(claim2);

    const claims = store.readAll();
    expect(claims).toHaveLength(2);
    expect(claims[0].id).toBe(id1);
    expect(claims[1].id).toBe(id2);
    expect(claims[1].supersedes).toBe(id1);
  });

  it('generateULID() produces unique 26-char IDs', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const id = generateULID();
      expect(id).toHaveLength(26);
      expect(/^[0-9A-Z]{26}$/.test(id)).toBe(true);
      ids.add(id);
    }
    expect(ids.size).toBe(100);
  });
});