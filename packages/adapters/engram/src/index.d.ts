import type { Claim, Trajectory } from '../../../core/src/index.js';
export interface EngramEnvelope {
    IDENTITY?: Record<string, unknown>;
    BELIEFS?: Record<string, unknown>;
    CONSTRAINTS?: Record<string, {
        value: unknown;
        confidence: number;
    }>;
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
export declare function convertToEngram(claim: Claim, trajectory?: Trajectory): EngramEnvelope;
/**
 * Converts an Engram envelope back to Contrail Claims.
 * Lossy: signature is preserved as opaque blob, confidence on constraints is lost.
 */
export declare function convertFromEngram(envelope: EngramEnvelope): Claim[];
//# sourceMappingURL=index.d.ts.map