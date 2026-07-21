import type { BeliefResolution, Claim, Trajectory, TrajectoryResolutionError } from './types.js';

/**
 * Resolves the trajectory for a given (subject, predicate) pair.
 * 
 * Returns claims ordered newest-first, following the `supersedes` chain.
 * 
 * @throws TrajectoryResolutionError with code:
 * - 'NO_HEAD': No claims found for subject/predicate
 * - 'MULTIPLE_HEADS': Multiple heads detected (branching)
 * - 'CYCLE_DETECTED': Cycle in supersedes chain
 * - 'BROKEN_CHAIN': supersedes references missing claim
 */
export function resolveTrajectory(
  claims: Claim[],
  subject: string,
  predicate: string
): Trajectory {
  const filtered = claims.filter(
    c => c.subject === subject && c.predicate === predicate
  );

  if (filtered.length === 0) {
    throw { code: 'NO_HEAD', message: `No claims found for ${subject}/${predicate}` } as TrajectoryResolutionError;
  }

  // Find heads: claims that are not superseded by any other claim
  const supersededIds = new Set(
    filtered
      .map(c => c.supersedes)
      .filter((id): id is string => id !== null)
  );

  const heads = filtered.filter(c => !supersededIds.has(c.id));

  if (heads.length === 0) {
    throw { code: 'CYCLE_DETECTED', message: 'All claims in cycle - no head found' } as TrajectoryResolutionError;
  }

  if (heads.length > 1) {
    throw { 
      code: 'MULTIPLE_HEADS', 
      message: `Multiple heads detected for ${subject}/${predicate}: ${heads.map(h => h.id).join(', ')}` 
    } as TrajectoryResolutionError;
  }

  // Walk the chain from head backwards through supersedes
  const chain: Claim[] = [];
  const visited = new Set<string>();
  let current: Claim | undefined = heads[0];

  while (current) {
    if (visited.has(current.id)) {
      throw { code: 'CYCLE_DETECTED', message: `Cycle detected at ${current.id}`, claimId: current.id } as TrajectoryResolutionError;
    }
    visited.add(current.id);
    chain.push(current);

    const nextId = current.supersedes;
    if (!nextId) break;

    const next = filtered.find(c => c.id === nextId);
    if (!next) {
      throw { 
        code: 'BROKEN_CHAIN', 
        message: `supersedes references missing claim ${nextId}`, 
        claimId: nextId 
      } as TrajectoryResolutionError;
    }

    current = next;
  }

  return {
    claims: chain,
    head: chain[0]!,
    length: chain.length
  };
}

/**
 * Gets the current (head) claim for a subject/predicate pair.
 * Returns null if no claims exist.
 */
export function getCurrentClaim(
  claims: Claim[],
  subject: string,
  predicate: string
): Claim | null {
  return resolveCurrentBelief(claims, subject, predicate)?.current ?? null;
}

/**
 * Resolves the current claim and the supersession evidence behind it.
 * Returns null when no claim exists for the requested subject/predicate pair.
 */
export function resolveCurrentBelief(
  claims: Claim[],
  subject: string,
  predicate: string
): BeliefResolution | null {
  try {
    const trajectory = resolveTrajectory(claims, subject, predicate);
    return {
      current: trajectory.head,
      previous: trajectory.claims[1] ?? null,
      history: trajectory.claims
    };
  } catch (e) {
    const err = e as TrajectoryResolutionError;
    if (err.code === 'NO_HEAD') return null;
    throw e;
  }
}

/**
 * Gets all claims that supersede a given claim (directly or indirectly).
 * Returns them in order from the given claim backwards.
 */
export function getSupersessionChain(
  claims: Claim[],
  claimId: string
): Claim[] {
  const claim = claims.find(c => c.id === claimId);
  if (!claim) return [];

  const chain: Claim[] = [claim];
  let current = claim;

  while (current.supersedes) {
    const next = claims.find(c => c.id === current.supersedes);
    if (!next) break;
    chain.push(next);
    current = next;
  }

  return chain;
}

/**
 * Checks if a claim is the head of its trajectory.
 */
export function isHead(claims: Claim[], claimId: string): boolean {
  const claim = claims.find(c => c.id === claimId);
  if (!claim) return false;

  // A claim is a head if no other claim supersedes it
  return !claims.some(c => c.supersedes === claimId);
}

/**
 * Returns all trajectories for all subject/predicate combinations in the claim set.
 * Returns a Map with key `${subject}|${predicate}`.
 */
export function getAllTrajectories(claims: Claim[]): Map<string, Trajectory> {
  const groups = new Map<string, Claim[]>();
  
  for (const claim of claims) {
    const key = `${claim.subject}|${claim.predicate}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(claim);
  }

  const trajectories = new Map<string, Trajectory>();
  for (const [key, groupClaims] of groups) {
    const parts = key.split('|');
    if (parts.length !== 2) continue;
    const subject = parts[0]!;
    const predicate = parts[1]!;
    try {
      const trajectory = resolveTrajectory(groupClaims, subject, predicate);
      trajectories.set(key, trajectory);
    } catch {
      // Skip invalid trajectories
    }
  }

  return trajectories;
}
