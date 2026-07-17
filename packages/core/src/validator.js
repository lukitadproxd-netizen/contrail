import AjvModule from 'ajv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schemaPath = path.join(__dirname, '..', '..', '..', 'spec', 'schema', 'v0.1', 'claim.schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
const Ajv = AjvModule.default ?? AjvModule;
let validateFn = null;
let ajvInstance = null;
function getAjv() {
    if (!ajvInstance) {
        ajvInstance = new Ajv({ strict: true, allErrors: true, verbose: true });
        ajvInstance.addFormat('date-time', {
            validate: (str) => {
                if (typeof str !== 'string')
                    return false;
                const date = new Date(str);
                return !isNaN(date.getTime()) && str.endsWith('Z') && str.includes('T');
            }
        });
    }
    return ajvInstance;
}
function getValidator() {
    if (validateFn)
        return validateFn;
    const ajv = getAjv();
    validateFn = ajv.compile(schema);
    return validateFn;
}
export async function validateClaim(claim) {
    const validate = getValidator();
    const ajv = getAjv();
    const valid = validate(claim);
    if (valid) {
        return { valid: true, errors: [] };
    }
    const errors = (ajv.errors ?? []).map((err) => ({
        field: err.instancePath || err.schemaPath,
        message: err.message ?? 'Validation failed'
    }));
    return { valid: false, errors };
}
export async function parseClaim(json) {
    let parsed;
    try {
        parsed = JSON.parse(json);
    }
    catch (e) {
        return { claim: null, error: `Invalid JSON: ${e instanceof Error ? e.message : String(e)}` };
    }
    const result = await validateClaim(parsed);
    if (!result.valid) {
        return {
            claim: null,
            error: `Validation failed: ${result.errors.map(e => `${e.field}: ${e.message}`).join('; ')}`
        };
    }
    return { claim: parsed, error: null };
}
export function serializeClaim(claim) {
    const sorted = Object.keys(claim).sort().reduce((acc, key) => {
        acc[key] = claim[key];
        return acc;
    }, {});
    return JSON.stringify(sorted);
}
export function serializeClaims(claims) {
    return claims.map(serializeClaim).join('\n') + '\n';
}
export async function parseClaims(jsonl) {
    const lines = jsonl.trim().split('\n').filter(l => l.length > 0);
    const claims = [];
    for (const line of lines) {
        const { claim, error } = await parseClaim(line);
        if (error)
            throw new Error(`Failed to parse claim: ${error}`);
        if (claim)
            claims.push(claim);
    }
    return claims;
}
//# sourceMappingURL=validator.js.map