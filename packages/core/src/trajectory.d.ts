import type { Claim, Trajectory } from './types.js';
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
export declare function resolveTrajectory(claims: Claim[], subject: string, predicate: string): Trajectory;
/**
 * Gets the current (head) claim for a subject/predicate pair.
 * Returns null if no claims exist.
 */
export declare function getCurrentClaim(claims: Claim[], subject: string, predicate: string): Claim | null;
/**
 * Gets all claims that supersede a given claim (directly or indirectly).
 * Returns them in order from the given claim backwards.
 */
export declare function getSupersessionChain(claims: Claim[], claimId: string): Claim[];
/**
 * Checks if a claim is the head of its trajectory.
 */
export declare function isHead(claims: Claim[], claimId: string): boolean;
/**
 * Returns all trajectories for all subject/predicate combinations in the claim set.
 * Returns a Map with key `${subject}|${predicate}`.
 */
export declare function getAllTrajectories(claims: Claim[]): Map<string, Trajectory>;
//# sourceMappingURL=trajectory.d.ts.map