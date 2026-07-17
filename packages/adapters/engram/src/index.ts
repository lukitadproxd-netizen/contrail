import type { Claim, Trajectory } from '@lukitadproxd-netizen/core';

export interface EngramEnvelope {
  IDENTITY?: Record<string, unknown>;
  BELIEFS?: Record<string, unknown>;
  CONSTRAINTS?: Record<string, { value: unknown; confidence: number }>;
  CORRECTIONS?: Array<{
    supersedes: string;
    claim: Claim;
    timestamp: string;
  }>;
  EVOLUTION?: Claim[];
  signature?: string | null;
}

/**
 * Converts a Contrail Claim (or full trajectory) to an Engram envelope.
 * Lossy conversions are documented per SPEC.md §8.
 */
export function convertToEngram(
  claim: Claim,
  trajectory?: Trajectory
): EngramEnvelope {
  const envelope: EngramEnvelope = {
    IDENTITY: {},
    BELIEFS: {},
    CONSTRAINTS: {},
    CORRECTIONS: [],
    EVOLUTION: trajectory?.claims ?? [claim],
    signature: claim.signature ?? null
  };

  const predicate = claim.predicate;

  // Identity claims
  if (predicate.startsWith('identity.')) {
    const key = predicate.replace('identity.', '');
    envelope.IDENTITY![key] = claim.value;
  }

  // Belief claims
  if (predicate.startsWith('belief.')) {
    const key = predicate.replace('belief.', '');
    envelope.BELIEFS![key] = claim.value;
  }

  // Constraint claims (force confidence to 1.0 as per spec)
  if (predicate.startsWith('constraint.')) {
    const key = predicate.replace('constraint.', '');
    const constraintValue = claim.value;
    envelope.CONSTRAINTS![key] = {
      value: constraintValue,
      confidence: 1.0
    };
  }

  // Corrections (supersedes chain)
  if (claim.supersedes) {
    envelope.CORRECTIONS!.push({
      supersedes: claim.supersedes,
      claim: { ...claim },
      timestamp: claim.valid_from ?? new Date().toISOString()
    });
  }

  // Add full trajectory to EVOLUTION
  if (trajectory) {
    envelope.EVOLUTION = trajectory.claims;
  }

  return envelope;
}

/**
 * Converts an Engram envelope back to Contrail Claims.
 *
 * NOT IMPLEMENTED. This direction requires the official Engram schema to
 * confirm field names, section semantics, and confidence-loss rules. The
 * previous implementation of this function assumed a schema shape that was
 * never confirmed against a real Engram spec, which is worse than an
 * explicit stub: it could silently produce claims that look valid but
 * don't actually round-trip correctly with real Engram data.
 *
 * Tracked in: https://github.com/lukitadproxd-netizen/contrail/issues/6
 */
export function convertFromEngram(_envelope: EngramEnvelope): Claim[] {
  void _envelope;
  throw new Error(
    'convertFromEngram is not implemented in v0.1: requires official Engram schema confirmation. ' +
    'See ROADMAP.md and the tracking issue linked in this function\'s doc comment.'
  );
}