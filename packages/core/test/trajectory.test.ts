import { describe, it, expect } from 'vitest';
import { resolveTrajectory, getCurrentClaim, getSupersessionChain, isHead, getAllTrajectories, resolveCurrentBelief } from '../src/trajectory.js';
import type { Claim, TrajectoryResolutionError } from '../src/types.js';

function createClaim(overrides: Partial<Claim> = {}): Claim {
  return {
    schema_version: '0.1.0',
    id: '01JAAAAAAAAAAAAAAAAAAAAAAA',
    subject: 'self',
    predicate: 'preference.editor',
    value: 'vscode',
    value_type: 'enum',
    confidence: 0.9,
    valid_from: '2026-01-01T00:00:00Z',
    valid_until: null,
    supersedes: null,
    source: { tool: 'test', session_id: null, kind: 'explicit-statement' },
    visibility: 'private',
    signature: null,
    ...overrides
  };
}

describe('trajectory', () => {
  it('resolves simple trajectory of length 1', () => {
    const claim = createClaim();
    const result = resolveTrajectory([claim], 'self', 'preference.editor');
    expect(result.length).toBe(1);
    expect(result.head.id).toBe('01JAAAAAAAAAAAAAAAAAAAAAAA');
  });

  it('resolves trajectory with supersedes', () => {
    const base = createClaim({ id: '01JAAAAAAAAAAAAAAAAAAAAAAA' });
    const head = createClaim({ id: '01JBBBBBBBBBBBBBBBBBBBBBBB', supersedes: '01JAAAAAAAAAAAAAAAAAAAAAAA' });
    const result = resolveTrajectory([base, head], 'self', 'preference.editor');
    expect(result.length).toBe(2);
    expect(result.head.id).toBe('01JBBBBBBBBBBBBBBBBBBBBBBB');
  });

  it('orders trajectory newest first', () => {
    const base = createClaim({ id: '01JAAAAAAAAAAAAAAAAAAAAAAA' });
    const head = createClaim({ id: '01JBBBBBBBBBBBBBBBBBBBBBBB', supersedes: '01JAAAAAAAAAAAAAAAAAAAAAAA' });
    const result = resolveTrajectory([base, head], 'self', 'preference.editor');
    expect(result.claims[0].id).toBe('01JBBBBBBBBBBBBBBBBBBBBBBB');
    expect(result.claims[1].id).toBe('01JAAAAAAAAAAAAAAAAAAAAAAA');
  });

it('throws on cycle', () => {
    const c1 = createClaim({ id: '01JAAAAAAAAAAAAAAAAAAAAAAA', supersedes: '01JCCCCCCCCCCCCCCCCCCCCCCC' });
    const c2 = createClaim({ id: '01JBBBBBBBBBBBBBBBBBBBBBBB', supersedes: '01JAAAAAAAAAAAAAAAAAAAAAAA' });
    const c3 = createClaim({ id: '01JCCCCCCCCCCCCCCCCCCCCCCC', supersedes: '01JBBBBBBBBBBBBBBBBBBBBBBB' });
    expect(() => resolveTrajectory([c1, c2, c3], 'self', 'preference.editor')).toThrow(/no head found/);
  });

  it('throws on multiple heads', () => {
    const headA = createClaim({ id: '01JAAAAAAAAAAAAAAAAAAAAAAA' });
    const headB = createClaim({ id: '01JBBBBBBBBBBBBBBBBBBBBBBB' });
    expect(() => resolveTrajectory([headA, headB], 'self', 'preference.editor')).toThrow(/Multiple heads detected/);
  });

  it('throws on broken chain', () => {
    const head = createClaim({ id: '01JBBBBBBBBBBBBBBBBBBBBBBB', supersedes: '01JMISSINGMISSINGMISSINGMI' });
    expect(() => resolveTrajectory([head], 'self', 'preference.editor')).toThrow(/supersedes references missing claim/);
  });

  it('filters by subject and predicate', () => {
    const c1 = createClaim({ id: '01JAAAAAAAAAAAAAAAAAAAAAAA', subject: 'self', predicate: 'preference.editor' });
    const c2 = createClaim({ id: '01JBBBBBBBBBBBBBBBBBBBBBBB', subject: 'other', predicate: 'preference.editor' });
    const c3 = createClaim({ id: '01JCCCCCCCCCCCCCCCCCCCCCCC', subject: 'self', predicate: 'preference.theme' });
    const trajectory = resolveTrajectory([c1, c2, c3], 'self', 'preference.editor');
    expect(trajectory.length).toBe(1);
    expect(trajectory.head.id).toBe('01JAAAAAAAAAAAAAAAAAAAAAAA');
  });
});

describe('getCurrentClaim', () => {
  it('returns head claim for existing trajectory', () => {
    const base = createClaim({ id: '01JAAAAAAAAAAAAAAAAAAAAAAA' });
    const head = createClaim({ id: '01JBBBBBBBBBBBBBBBBBBBBBBB', supersedes: '01JAAAAAAAAAAAAAAAAAAAAAAA' });
    const current = getCurrentClaim([base, head], 'self', 'preference.editor');
    expect(current?.id).toBe('01JBBBBBBBBBBBBBBBBBBBBBBB');
  });

  it('returns null for non-existent trajectory', () => {
    const claims = [createClaim({ id: '01JAAAAAAAAAAAAAAAAAAAAAAA', predicate: 'preference.editor' })];
    const current = getCurrentClaim(claims, 'self', 'preference.theme');
    expect(current).toBeNull();
  });
});

describe('resolveCurrentBelief', () => {
  it('returns the current claim, the claim it replaced, and the full history', () => {
    const base = createClaim({ id: '01JAAAAAAAAAAAAAAAAAAAAAAA' });
    const head = createClaim({ id: '01JBBBBBBBBBBBBBBBBBBBBBBB', supersedes: '01JAAAAAAAAAAAAAAAAAAAAAAA' });

    const belief = resolveCurrentBelief([base, head], 'self', 'preference.editor');

    expect(belief?.current.id).toBe(head.id);
    expect(belief?.previous?.id).toBe(base.id);
    expect(belief?.history.map(claim => claim.id)).toEqual([head.id, base.id]);
  });
});

describe('getSupersessionChain', () => {
  it('returns chain from claim backwards', () => {
    const base = createClaim({ id: '01JAAAAAAAAAAAAAAAAAAAAAAA' });
    const head = createClaim({ id: '01JBBBBBBBBBBBBBBBBBBBBBBB', supersedes: '01JAAAAAAAAAAAAAAAAAAAAAAA' });
    const claims = [base, head];
    const chain = getSupersessionChain(claims, '01JBBBBBBBBBBBBBBBBBBBBBBB');
    expect(chain.map(c => c.id)).toEqual([
      '01JBBBBBBBBBBBBBBBBBBBBBBB',
      '01JAAAAAAAAAAAAAAAAAAAAAAA'
    ]);
  });

  it('returns empty array for unknown claim', () => {
    const claims = [createClaim({ id: '01JAAAAAAAAAAAAAAAAAAAAAAA' })];
    const chain = getSupersessionChain(claims, '01JUNKNOWNUNKNOWNUNKNOWNUN');
    expect(chain).toEqual([]);
  });
});

describe('isHead', () => {
  it('returns true for head claim', () => {
    const base = createClaim({ id: '01JAAAAAAAAAAAAAAAAAAAAAAA' });
    const head = createClaim({ id: '01JBBBBBBBBBBBBBBBBBBBBBBB', supersedes: '01JAAAAAAAAAAAAAAAAAAAAAAA' });
    const claims = [base, head];
    expect(isHead(claims, '01JBBBBBBBBBBBBBBBBBBBBBBB')).toBe(true);
    expect(isHead(claims, '01JAAAAAAAAAAAAAAAAAAAAAAA')).toBe(false);
  });

  it('returns false for unknown claim', () => {
    const claims = [createClaim({ id: '01JAAAAAAAAAAAAAAAAAAAAAAA' })];
    expect(isHead(claims, '01JUNKNOWNUNKNOWNUNKNOWNUN')).toBe(false);
  });
});

describe('getAllTrajectories', () => {
  it('groups by subject|predicate', () => {
    const claims = [
      createClaim({ id: '01JAAAAAAAAAAAAAAAAAAAAAAA', subject: 'self', predicate: 'preference.editor' }),
      createClaim({ id: '01JBBBBBBBBBBBBBBBBBBBBBBB', subject: 'other', predicate: 'preference.editor' }),
      createClaim({ id: '01JCCCCCCCCCCCCCCCCCCCCCCC', subject: 'self', predicate: 'preference.theme' })
    ];
    const trajectories = getAllTrajectories(claims);
    // 3 unique (subject|predicate) pairs: self|preference.editor, other|preference.editor, self|preference.theme
    expect(trajectories.size).toBe(3);
  });
});
