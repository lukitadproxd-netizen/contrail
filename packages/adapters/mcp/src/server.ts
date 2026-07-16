import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { readFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { z } from 'zod';
import { parseClaim, resolveTrajectory, getCurrentClaim } from '@contrailspec/core';
import type { Claim } from '@contrailspec/core';

const STORE_DIR = '.contrail';
const STORE_FILE = 'claims.jsonl';

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

function appendClaim(storePath: string, claim: Claim): void {
  const line = JSON.stringify(claim);
  appendFileSync(storePath, line + '\n', 'utf-8');
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

  constructor(options: ContrailMCPServerOptions = {}) {
    this.storePath = options.storePath || getStorePath(process.cwd());
    this.server = new McpServer({
      name: 'contrail',
      version: '0.1.0'
    });
    this.setupResources();
    this.setupTools();
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
      async (args) => {
        const id = generateULID();
        const claim: Claim = {
          schema_version: '0.1.0',
          id,
          subject: args.subject,
          predicate: args.predicate,
          value: args.value,
          value_type: typeof args.value === 'number' ? 'number' : 
                     typeof args.value === 'boolean' ? 'boolean' :
                     Array.isArray(args.value) ? 'list' : 'string',
          confidence: args.confidence,
          valid_from: new Date().toISOString(),
          valid_until: null,
          supersedes: args.supersedes || null,
          source: {
            tool: args.source_tool,
            session_id: null,
            kind: args.source_kind
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

        appendClaim(this.storePath, parsed!);
        return {
          content: [{
            type: 'text' as const,
            text: `Stored claim ${parsed!.id} for ${parsed!.subject}/${parsed!.predicate}`
          }]
        };
      }
    );

    this.server.tool(
      'contrail_recall',
      'Retrieve current belief for a subject/predicate',
      {
        subject: z.string().describe('Who/what to recall about (default: "self")'),
        predicate: z.string().describe('Namespaced key to recall')
      },
      async (args) => {
        const claims = readClaims(this.storePath);
        const current = getCurrentClaim(claims, args.subject, args.predicate);
        
        if (!current) {
          return {
            content: [{
              type: 'text' as const,
              text: `No claim found for ${args.subject}/${args.predicate}`
            }]
          };
        }

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify(current, null, 2)
          }]
        };
      }
    );

    this.server.tool(
      'contrail_trajectory',
      'Show the full belief history for a subject/predicate',
      {
        subject: z.string().describe('Who/what trajectory to show (default: "self")'),
        predicate: z.string().describe('Namespaced key trajectory')
      },
      async (args) => {
        const claims = readClaims(this.storePath);
        const trajectory = resolveTrajectory(claims, args.subject, args.predicate);
        
        if (trajectory.claims.length === 0) {
          return {
            content: [{
              type: 'text' as const,
              text: `No claims found for ${args.subject}/${args.predicate}`
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
              subject: args.subject,
              predicate: args.predicate,
              totalClaims: history.length,
              history
            }, null, 2)
          }]
        };
      }
    );
  }

  getServer(): McpServer {
    return this.server;
  }
}