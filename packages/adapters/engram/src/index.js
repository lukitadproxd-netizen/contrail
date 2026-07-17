/**
 * Converts a Contrail Claim (or full trajectory) to an Engram envelope.
 * Lossy conversions are documented per SPEC.md §8.
 */
export function convertToEngram(claim, trajectory) {
    const envelope = {
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
        envelope.IDENTITY[key] = claim.value;
    }
    // Belief claims
    if (predicate.startsWith('belief.')) {
        const key = predicate.replace('belief.', '');
        envelope.BELIEFS[key] = claim.value;
    }
    // Constraint claims (force confidence to 1.0 as per spec)
    if (predicate.startsWith('constraint.')) {
        const key = predicate.replace('constraint.', '');
        const constraintValue = claim.value;
        envelope.CONSTRAINTS[key] = {
            value: constraintValue,
            confidence: 1.0
        };
    }
    // Corrections (supersedes chain)
    if (claim.supersedes) {
        envelope.CORRECTIONS.push({
            supersedes: claim.supersedes,
            claim: { ...claim },
            timestamp: claim.valid_from
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
 * Lossy: signature is preserved as opaque blob, confidence on constraints is lost.
 */
export function convertFromEngram(envelope) {
    const claims = [];
    // IDENTITY claims
    if (envelope.IDENTITY) {
        for (const [key, value] of Object.entries(envelope.IDENTITY)) {
            claims.push({
                schema_version: '0.1.0',
                id: generateULID(),
                subject: 'self',
                predicate: `identity.${key}`,
                value,
                value_type: typeof value === 'number' ? 'number' :
                    typeof value === 'boolean' ? 'boolean' :
                        Array.isArray(value) ? 'list' : 'string',
                confidence: 0.9,
                valid_from: new Date().toISOString(),
                valid_until: null,
                supersedes: null,
                source: {
                    tool: 'engram-adapter',
                    session_id: null,
                    kind: 'imported'
                },
                visibility: 'private',
                signature: envelope.signature ?? null
            });
        }
    }
    // BELIEFS claims
    if (envelope.BELIEFS) {
        for (const [key, value] of Object.entries(envelope.BELIEFS)) {
            claims.push({
                schema_version: '0.1.0',
                id: generateULID(),
                subject: 'self',
                predicate: `belief.${key}`,
                value,
                value_type: typeof value === 'number' ? 'number' :
                    typeof value === 'boolean' ? 'boolean' :
                        Array.isArray(value) ? 'list' : 'string',
                confidence: 0.9,
                valid_from: new Date().toISOString(),
                valid_until: null,
                supersedes: null,
                source: {
                    tool: 'engram-adapter',
                    session_id: null,
                    kind: 'imported'
                },
                visibility: 'private',
                signature: envelope.signature ?? null
            });
        }
    }
    // CONSTRAINTS claims
    if (envelope.CONSTRAINTS) {
        for (const [key, constraint] of Object.entries(envelope.CONSTRAINTS)) {
            const value = constraint.value;
            const confidence = constraint.confidence ?? 1.0;
            claims.push({
                schema_version: '0.1.0',
                id: generateULID(),
                subject: 'self',
                predicate: `constraint.${key}`,
                value,
                value_type: typeof value === 'number' ? 'number' :
                    typeof value === 'boolean' ? 'boolean' :
                        Array.isArray(value) ? 'list' : 'string',
                confidence,
                valid_from: new Date().toISOString(),
                valid_until: null,
                supersedes: null,
                source: {
                    tool: 'engram-adapter',
                    session_id: null,
                    kind: 'imported'
                },
                visibility: 'private',
                signature: envelope.signature ?? null
            });
        }
    }
    // CORRECTIONS
    if (envelope.CORRECTIONS) {
        for (const correction of envelope.CORRECTIONS) {
            const claim = correction.claim;
            claim.id = generateULID();
            claim.source = {
                tool: 'engram-adapter',
                session_id: null,
                kind: 'imported'
            };
            claim.signature = envelope.signature ?? null;
            claims.push(claim);
        }
    }
    // EVOLUTION (full trajectory)
    if (envelope.EVOLUTION && envelope.EVOLUTION.length > 0) {
        // The EVOLUTION array already contains the full trajectory
        // Return as-is (they already have the proper Contrail structure)
        return envelope.EVOLUTION;
    }
    return claims;
}
function generateULID() {
    const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    let timestamp = Date.now();
    let timestampStr = '';
    for (let i = 0; i < 10; i++) {
        timestampStr = alphabet[timestamp % 32] + timestampStr;
        timestamp = Math.floor(timestamp / 32);
    }
    let randomStr = '';
    for (let i = 0; i < 16; i++) {
        randomStr += alphabet[Math.floor(Math.random() * 32)];
    }
    return timestampStr + randomStr;
}
//# sourceMappingURL=index.js.map