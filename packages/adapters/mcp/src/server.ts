import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { readFileSync, appendFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { lock, unlock } from 'proper-lockfile';
import { z } from 'zod';
import { parseClaim, resolveCurrentBelief, resolveTrajectory } from '@lukitadproxd-netizen/core';
import type { Claim } from '@lukitadproxd-netizen/core';

const STORE_DIR = '.contrail';
const STORE_FILE = 'claims.jsonl';
const LOCK_FILE = 'claims.jsonl.lock';

type RememberArgs = {
  subject: string;
  predicate: string;
  value: unknown;
  confidence: number;
  source_tool: string;
  source_kind: 'explicit-statement' | 'inferred' | 'imported' | 'corrected';
  supersedes?: string;
};

type RecallArgs = {
  subject: string;
  predicate: string;
};

type TrajectoryArgs = RecallArgs;

export interface ContrailMCPServerOptions {
  storePath?: string;
}

function getStorePath(cwd: string): string {
  const dir = resolve(cwd, STORE_DIR);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return resolve(dir, STORE_FILE);
}

function readClaims(storePath: string): Claim[] {
  if (!existsSync(storePath)) return [];
  const content = readFileSync(storePath, 'utf-8');
  if (!content.trim()) return [];
  return content.trim().split('\n').map(line => JSON.parse(line)) as Claim[];
}

function getLockPath(storePath: string): string {
  const dir = resolve(storePath, '..');
  return resolve(dir, LOCK_FILE);
}

function toClaimEvidence(claim: Claim) {
  return {
    id: claim.id,
    value: claim.value,
    current_since: claim.valid_from ?? null,
    recorded_confidence: claim.confidence,
    source: claim.source
  };
}

async function ensureLockDir(lockPath: string): Promise<void> {
  const dir = resolve(lockPath, '..');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  if (!existsSync(lockPath)) {
    writeFileSync(lockPath, '', 'utf-8');
  }
}

async function appendClaim(storePath: string, claim: Claim): Promise<void> {
  const line = JSON.stringify(claim);
  const lockPath = getLockPath(storePath);
  
  await ensureLockDir(lockPath);
  
  const release = await lock(lockPath, { retries: 5 });
  try {
    const dir = resolve(storePath, '..');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    appendFileSync(storePath, line + '\n', 'utf-8');
  } finally {
    await release();
  }
}

function generateULID(): string {
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

export class ContrailMCPServer {
  private server: McpServer;
  private storePath: string;
  private toolHandlers: Map<string, (args: Record<string, unknown>) => Promise<{
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}>> = new Map();

  constructor(options: ContrailMCPServerOptions = {}) {
    this.storePath = options.storePath || getStorePath(process.cwd());
    this.server = new McpServer({
      name: 'contrail',
      version: '0.1.0'
    });
    this.setupResources();
    this.setupTools();
  }

  getServer(): McpServer {
    return this.server;
  }

  getToolHandler(name: string): { handler: (args: Record<string, unknown>) => Promise<{
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}> } | undefined {
    const handler = this.toolHandlers.get(name);
    return handler ? { handler: handler } : undefined;
  }

  private registerTool(name: string, handler: (args: Record<string, unknown>) => Promise<{
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}>): void {
    this.toolHandlers.set(name, handler);
  }

  private setupResources(): void {
    this.server.resource(
      'contrail-claims',
      'contrail://claims',
      async (uri) => {
        const claims = readClaims(this.storePath);
        return {
          contents: [{
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify(claims, null, 2)
          }]
        };
      }
    );
  }

  private setupTools(): void {
    const rememberHandler = async (args: Record<string, unknown>) => {
      const a = args as RememberArgs;
      const id = generateULID();
      const claim: Claim = {
        schema_version: '0.1.0',
        id,
        subject: a.subject,
        predicate: a.predicate,
        value: a.value,
        value_type: typeof a.value === 'number' ? 'number' : 
                   typeof a.value === 'boolean' ? 'boolean' :
                   Array.isArray(a.value) ? 'list' : 'string',
        confidence: a.confidence,
        valid_from: new Date().toISOString(),
        valid_until: null,
        supersedes: a.supersedes || null,
        source: {
          tool: a.source_tool,
          session_id: null,
          kind: a.source_kind
        },
        visibility: 'private',
        signature: null
      };

      const { claim: parsed, error } = await parseClaim(JSON.stringify(claim));
      if (error) {
        return {
          content: [{
            type: 'text' as const,
            text: `Error: ${error}`
          }],
          isError: true
        };
      }

      await appendClaim(this.storePath, parsed!);
      return {
        content: [{
          type: 'text' as const,
          text: `Stored claim ${parsed!.id} for ${parsed!.subject}/${parsed!.predicate}`
        }]
      };
    };

    const recallHandler = async (args: Record<string, unknown>) => {
      const a = args as RecallArgs;
      const claims = readClaims(this.storePath);
      const belief = resolveCurrentBelief(claims, a.subject, a.predicate);
      
      if (!belief) {
        return {
          content: [{
            type: 'text' as const,
            text: `No claim found for ${a.subject}/${a.predicate}`
          }]
        };
      }

      const { current, previous, history } = belief;
      const reasoningChain = history.slice().reverse().map(claim => ({
        ...toClaimEvidence(claim),
        status: claim.id === current.id ? 'current' : 'superseded'
      }));

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            subject: a.subject,
            predicate: a.predicate,
            current_belief: toClaimEvidence(current),
            why_this_is_current: previous
              ? `This claim supersedes ${previous.id}, so it is the current instruction.`
              : 'This is the only recorded instruction for this subject and predicate.',
            superseded_claim: previous ? toClaimEvidence(previous) : null,
            reasoning_chain: reasoningChain
          }, null, 2)
        }]
      };
    };

    const trajectoryHandler = async (args: Record<string, unknown>) => {
      const a = args as TrajectoryArgs;
      const claims = readClaims(this.storePath);
      const trajectory = resolveTrajectory(claims, a.subject, a.predicate);
      
      if (trajectory.claims.length === 0) {
        return {
          content: [{
            type: 'text' as const,
            text: `No claims found for ${a.subject}/${a.predicate}`
          }]
        };
      }

      const history = trajectory.claims.map((claim, i) => ({
        position: i + 1,
        id: claim.id,
        value: claim.value,
        confidence: claim.confidence,
        source: claim.source,
        valid_from: claim.valid_from,
        isHead: claim.id === trajectory.head?.id
      }));

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            subject: a.subject,
            predicate: a.predicate,
            totalClaims: history.length,
            history
          }, null, 2)
        }]
      };
    };

    this.server.tool(
      'contrail_remember',
      'Store a new claim about the user',
      {
        subject: z.string().describe('Who/what this claim is about (default: "self")'),
        predicate: z.string().describe('Namespaced key: category.key'),
        value: z.any().describe('The claim content'),
        confidence: z.number().min(0).max(1).describe('Certainty 0.0-1.0'),
        source_tool: z.string().describe('Tool/system that produced this claim'),
        source_kind: z.enum(['explicit-statement', 'inferred', 'imported', 'corrected']).describe('How the claim was produced'),
        supersedes: z.string().optional().describe('ULID of claim to supersede')
      },
      rememberHandler
    );
    this.registerTool('contrail_remember', rememberHandler);

    this.server.tool(
      'contrail_recall',
      'Retrieve the current project instruction and the supersession evidence behind it',
      {
        subject: z.string().describe('Who/what to recall about (default: "self")'),
        predicate: z.string().describe('Namespaced key to recall')
      },
      recallHandler
    );
    this.registerTool('contrail_recall', recallHandler);

    this.server.tool(
      'contrail_trajectory',
      'Show the full belief history for a subject/predicate',
      {
        subject: z.string().describe('Who/what trajectory to show (default: "self")'),
        predicate: z.string().describe('Namespaced key trajectory')
      },
      trajectoryHandler
    );
    this.registerTool('contrail_trajectory', trajectoryHandler);
  }
}
