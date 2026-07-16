export type SchemaVersion = `0.1.${number}`;

export type ValueType = 'string' | 'number' | 'boolean' | 'enum' | 'list';

export type Visibility = 'private' | 'shared';

export type SourceKind = 'explicit-statement' | 'inferred' | 'imported' | 'corrected';

export interface Source {
  tool: string;
  session_id: string | null;
  kind: SourceKind;
}

export interface Claim {
  schema_version: SchemaVersion;
  id: string;
  subject: string;
  predicate: string;
  value: unknown;
  value_type?: ValueType;
  confidence: number;
  valid_from?: string;
  valid_until: string | null;
  supersedes: string | null;
  source: Source | null;
  visibility: Visibility;
  signature: string | null;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ParseResult {
  claim: Claim | null;
  error: string | null;
}

export interface Trajectory {
  claims: Claim[];
  head: Claim;
  length: number;
}

export interface TrajectoryResolutionError {
  code: 'NO_HEAD' | 'MULTIPLE_HEADS' | 'CYCLE_DETECTED' | 'BROKEN_CHAIN';
  message: string;
  claimId?: string;
}