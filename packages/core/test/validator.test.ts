import { describe, it, expect } from 'vitest';
import { parseClaim, validateClaim, serializeClaim, serializeClaims, parseClaims } from '../src/validator.js';
import type { Claim } from '../src/types.js';

const validClaimJson = `{"schema_version":"0.1.0","id":"01J9Z8QK3N4R5S6T7V8W9X0Y1Z","subject":"self","predicate":"preference.code_style.paradigm","value":"functional-composition","value_type":"enum","confidence":0.9,"valid_from":"2026-06-01T00:00:00Z","valid_until":null,"supersedes":null,"source":{"tool":"claude-code","session_id":"sess_a1b2","kind":"explicit-statement"},"visibility":"private","signature":null}`;

const claimWithSupersedes: Claim = {
  schema_version: '0.1.0',
  id: '01J9A2B3C4D5E6F7G8H9I0J1K2',
  subject: 'self',
  predicate: 'preference.editor',
  value: 'neovim',
  value_type: 'enum',
  confidence: 0.95,
  valid_from: '2026-07-16T11:00:00Z',
  valid_until: null,
  supersedes: '01J9Z8QK3N4R5S6T7V8W9X0Y1Z',
  source: { tool: 'claude-code', session_id: 'sess_c3d4', kind: 'explicit-statement' },
  visibility: 'private',
  signature: null
};

describe('validator', () => {
  it('parses valid claim JSON', async () => {
    const { claim, error } = await parseClaim(validClaimJson);
    expect(error).toBeNull();
    expect(claim).not.toBeNull();
    expect(claim!.id).toBe('01J9Z8QK3N4R5S6T7V8W9X0Y1Z');
    expect(claim!.confidence).toBe(0.9);
  });

  it('rejects invalid JSON', async () => {
    const { claim, error } = await parseClaim('not json');
    expect(claim).toBeNull();
    expect(error).toContain('Invalid JSON');
  });

  it('rejects missing required fields', async () => {
    const { claim, error } = await parseClaim('{"schema_version":"0.1.0"}');
    expect(claim).toBeNull();
    expect(error).toContain('Validation failed');
  });

  it('rejects confidence out of range', async () => {
    const invalid = { ...JSON.parse(validClaimJson), confidence: 1.5 };
    const { claim, error } = await parseClaim(JSON.stringify(invalid));
    expect(claim).toBeNull();
    expect(error).toContain('Validation failed');
  });

  it('rejects invalid predicate format', async () => {
    const invalid = { ...JSON.parse(validClaimJson), predicate: 'Preference.Code_Style' };
    const { claim, error } = await parseClaim(JSON.stringify(invalid));
    expect(claim).toBeNull();
    expect(error).toContain('Validation failed');
  });

  it('round-trips claim through serialize/parse', async () => {
    const { claim } = await parseClaim(validClaimJson);
    expect(claim).not.toBeNull();
    
    const serialized = serializeClaim(claim!);
    const { claim: reparsed, error } = await parseClaim(serialized);
    expect(error).toBeNull();
    expect(reparsed).toEqual(claim);
  });

  it('serializes multiple claims as JSONL', async () => {
    const { claim: c1 } = await parseClaim(validClaimJson);
    const jsonl = serializeClaims([c1!, claimWithSupersedes]);
    const lines = jsonl.trim().split('\n');
    expect(lines.length).toBe(2);
    expect(lines[0]).toContain('01J9Z8QK3N4R5S6T7V8W9X0Y1Z');
    expect(lines[1]).toContain('01J9A2B3C4D5E6F7G8H9I0J1K2');
  });

  it('parses JSONL back to claims', async () => {
    const { claim: c1 } = await parseClaim(validClaimJson);
    const jsonl = serializeClaims([c1!, claimWithSupersedes]);
    const claims = await parseClaims(jsonl);
    expect(claims.length).toBe(2);
    expect(claims[0].id).toBe('01J9Z8QK3N4R5S6T7V8W9X0Y1Z');
    expect(claims[1].id).toBe('01J9A2B3C4D5E6F7G8H9I0J1K2');
  });
});