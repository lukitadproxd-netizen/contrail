import { describe, it, expect } from 'vitest';
import { convertToEngram, convertFromEngram } from '../src/index.js';

describe('Engram Adapter (v0.1)', () => {
  it('convertToEngram converts identity claim', () => {
    const claim = {
      schema_version: '0.1.0',
      id: '01TEST1234567890ABCDEFGH',
      subject: 'self',
      predicate: 'identity.name',
      value: 'John Doe',
      value_type: 'string',
      confidence: 0.9,
      valid_from: '2026-01-01T00:00:00Z',
      valid_until: null,
      supersedes: null,
      source: { tool: 'test', session_id: null, kind: 'explicit-statement' },
      visibility: 'private',
      signature: null
    };

    const envelope = convertToEngram(claim);
    expect(envelope.IDENTITY).toEqual({ name: 'John Doe' });
    expect(envelope.EVOLUTION).toHaveLength(1);
  });

  it('convertToEngram converts belief claim', () => {
    const claim = {
      schema_version: '0.1.0',
      id: '01TEST1234567890ABCDEFGH',
      subject: 'self',
      predicate: 'belief.architecture.style',
      value: 'event-sourced',
      value_type: 'string',
      confidence: 0.85,
      valid_from: '2026-01-01T00:00:00Z',
      valid_until: null,
      supersedes: null,
      source: { tool: 'test', session_id: null, kind: 'explicit-statement' },
      visibility: 'private',
      signature: null
    };

    const envelope = convertToEngram(claim);
    expect(envelope.BELIEFS).toEqual({ 'architecture.style': 'event-sourced' });
  });

  it('convertToEngram converts constraint claim with confidence 1.0', () => {
    const claim = {
      schema_version: '0.1.0',
      id: '01TEST1234567890ABCDEFGH',
      subject: 'self',
      predicate: 'constraint.language.required',
      value: true,
      value_type: 'boolean',
      confidence: 0.95,
      valid_from: '2026-01-01T00:00:00Z',
      valid_until: null,
      supersedes: null,
      source: { tool: 'test', session_id: null, kind: 'explicit-statement' },
      visibility: 'private',
      signature: null
    };

    const envelope = convertToEngram(claim);
    expect(envelope.CONSTRAINTS).toEqual({ 'language.required': { value: true, confidence: 1.0 } });
  });

  it('convertToEngram includes supersedes in CORRECTIONS', () => {
    const claim = {
      schema_version: '0.1.0',
      id: '01TEST1234567890ABCDEFGH',
      subject: 'self',
      predicate: 'preference.editor',
      value: 'neovim',
      value_type: 'string',
      confidence: 0.95,
      valid_from: '2026-06-01T00:00:00Z',
      valid_until: null,
      supersedes: '01PREVIOUS1234567890ABCDE',
      source: { tool: 'test', session_id: null, kind: 'corrected' },
      visibility: 'private',
      signature: null
    };

    const envelope = convertToEngram(claim);
    expect(envelope.CORRECTIONS).toHaveLength(1);
    expect(envelope.CORRECTIONS![0].supersedes).toBe('01PREVIOUS1234567890ABCDE');
  });

  it('convertFromEngram converts identity envelope', () => {
    const envelope = {
      IDENTITY: { name: 'Jane Doe' },
      BELIEFS: {},
      CONSTRAINTS: {},
      CORRECTIONS: [],
      EVOLUTION: [],
      signature: null
    };

    const claims = convertFromEngram(envelope);
    expect(claims).toHaveLength(1);
    expect(claims[0].predicate).toBe('identity.name');
    expect(claims[0].value).toBe('Jane Doe');
    expect(claims[0].source.kind).toBe('imported');
  });

  it('convertFromEngram converts belief envelope', () => {
    const envelope = {
      IDENTITY: {},
      BELIEFS: { 'architecture.style': 'hexagonal' },
      CONSTRAINTS: {},
      CORRECTIONS: [],
      EVOLUTION: [],
      signature: null
    };

    const claims = convertFromEngram(envelope);
    expect(claims).toHaveLength(1);
    expect(claims[0].predicate).toBe('belief.architecture.style');
    expect(claims[0].value).toBe('hexagonal');
  });

  it('convertFromEngram converts constraint envelope with confidence', () => {
    const envelope = {
      IDENTITY: {},
      BELIEFS: {},
      CONSTRAINTS: { 'language.required': { value: true, confidence: 1.0 } },
      CORRECTIONS: [],
      EVOLUTION: [],
      signature: null
    };

    const claims = convertFromEngram(envelope);
    expect(claims).toHaveLength(1);
    expect(claims[0].predicate).toBe('constraint.language.required');
    expect(claims[0].confidence).toBe(1.0);
  });

  it('convertFromEngram returns EVOLUTION array if present', () => {
    const evolutionClaim = {
      schema_version: '0.1.0',
      id: '01EVOLUTION1234567890ABCDE',
      subject: 'self',
      predicate: 'preference.editor',
      value: 'vscode',
      value_type: 'string',
      confidence: 0.8,
      valid_from: '2026-01-01T00:00:00Z',
      valid_until: null,
      supersedes: null,
      source: { tool: 'test', session_id: null, kind: 'explicit-statement' },
      visibility: 'private',
      signature: null
    };

    const envelope = {
      IDENTITY: {},
      BELIEFS: {},
      CONSTRAINTS: {},
      CORRECTIONS: [],
      EVOLUTION: [evolutionClaim],
      signature: null
    };

    const claims = convertFromEngram(envelope);
    expect(claims).toHaveLength(1);
    expect(claims[0].id).toBe('01EVOLUTION1234567890ABCDE');
  });
});