import AjvModule, { ErrorObject, JSONSchemaType } from 'ajv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Claim, ValidationResult, ValidationError } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schemaPath = path.join(__dirname, '..', '..', '..', 'spec', 'schema', 'v0.1', 'claim.schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8')) as JSONSchemaType<Claim>;

const Ajv = AjvModule.default ?? AjvModule;

let validateFn: ((data: unknown) => data is Claim) | null = null;
let ajvInstance: InstanceType<typeof Ajv> | null = null;

function getAjv(): InstanceType<typeof Ajv> {
  if (!ajvInstance) {
    ajvInstance = new Ajv({ strict: true, allErrors: true, verbose: true });
    ajvInstance.addFormat('date-time', {
      validate: (str: string) => {
        if (typeof str !== 'string') return false;
        const date = new Date(str);
        return !isNaN(date.getTime()) && str.endsWith('Z') && str.includes('T');
      }
    });
  }
  return ajvInstance;
}

function getValidator(): (data: unknown) => data is Claim {
  if (validateFn) return validateFn;
  const ajv = getAjv();
  validateFn = ajv.compile(schema);
  return validateFn!;
}

export async function validateClaim(claim: unknown): Promise<ValidationResult> {
  const validate = getValidator();
  const ajv = getAjv();
  const valid = validate(claim);
  
  if (valid) {
    return { valid: true, errors: [] };
  }

  const errors: ValidationError[] = (ajv.errors ?? []).map((err: ErrorObject) => ({
    field: err.instancePath || err.schemaPath,
    message: err.message ?? 'Validation failed'
  }));

  return { valid: false, errors };
}

export async function parseClaim(json: string): Promise<{ claim: Claim | null; error: string | null }> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    return { claim: null, error: `Invalid JSON: ${e instanceof Error ? e.message : String(e)}` };
  }

  const result = await validateClaim(parsed);
  if (!result.valid) {
    return { 
      claim: null, 
      error: `Validation failed: ${result.errors.map(e => `${e.field}: ${e.message}`).join('; ')}` 
    };
  }

  return { claim: parsed as Claim, error: null };
}

export function serializeClaim(claim: Claim): string {
  const sorted = Object.keys(claim).sort().reduce((acc, key) => {
    acc[key] = (claim as unknown as Record<string, unknown>)[key];
    return acc;
  }, {} as Record<string, unknown>);
  return JSON.stringify(sorted);
}

export function serializeClaims(claims: Claim[]): string {
  return claims.map(serializeClaim).join('\n') + '\n';
}

export async function parseClaims(jsonl: string): Promise<Claim[]> {
  const lines = jsonl.trim().split('\n').filter(l => l.length > 0);
  const claims: Claim[] = [];
  
  for (const line of lines) {
    const { claim, error } = await parseClaim(line);
    if (error) throw new Error(`Failed to parse claim: ${error}`);
    if (claim) claims.push(claim);
  }
  
  return claims;
}