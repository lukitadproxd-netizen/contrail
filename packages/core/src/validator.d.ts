import type { Claim, ValidationResult } from './types.js';
export declare function validateClaim(claim: unknown): Promise<ValidationResult>;
export declare function parseClaim(json: string): Promise<{
    claim: Claim | null;
    error: string | null;
}>;
export declare function serializeClaim(claim: Claim): string;
export declare function serializeClaims(claims: Claim[]): string;
export declare function parseClaims(jsonl: string): Promise<Claim[]>;
//# sourceMappingURL=validator.d.ts.map