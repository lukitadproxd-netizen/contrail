import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import type { Claim } from '@contrailspec/core';

const STORE_DIR = '.contrail';
const STORE_FILE = 'claims.jsonl';

export interface Store {
  init(): void;
  readAll(): Claim[];
  append(claim: Claim): void;
}

function getStorePath(cwd: string): string {
  const dir = resolve(cwd, STORE_DIR);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return resolve(dir, STORE_FILE);
}

export function createStore(cwd: string): Store {
  const storePath = getStorePath(cwd);
  
  return {
    init() {
      if (!existsSync(storePath)) {
        writeFileSync(storePath, '', 'utf-8');
      }
    },
    
    readAll() {
      if (!existsSync(storePath)) return [];
      const content = readFileSync(storePath, 'utf-8');
      if (!content.trim()) return [];
      return content.trim().split('\n').map(line => JSON.parse(line));
    },
    
    append(claim: Claim) {
      const line = JSON.stringify(claim);
      appendFileSync(storePath, line + '\n', 'utf-8');
    }
  };
}

export function generateULID(): string {
  // Crockford Base32 alphabet
  const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  
  // Timestamp: 10 characters (milliseconds since epoch, Crockford Base32)
  let timestamp = Date.now();
  let timestampStr = '';
  for (let i = 0; i < 10; i++) {
    timestampStr = alphabet[timestamp % 32] + timestampStr;
    timestamp = Math.floor(timestamp / 32);
  }
  
  // Randomness: 16 characters (Crockford Base32)
  let randomStr = '';
  for (let i = 0; i < 16; i++) {
    randomStr += alphabet[Math.floor(Math.random() * 32)];
  }
  
  return timestampStr + randomStr;
}