import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { lock, unlock, lockSync, unlockSync } from 'proper-lockfile';
import type { Claim } from '@lukitadproxd-netizen/core';

const STORE_DIR = '.contrail';
const STORE_FILE = 'claims.jsonl';
const LOCK_FILE = 'claims.jsonl.lock';

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

function getLockPath(cwd: string): string {
  const dir = resolve(cwd, STORE_DIR);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return resolve(dir, LOCK_FILE);
}

export function createStore(cwd: string): Store {
  const storePath = getStorePath(cwd);
  const lockPath = getLockPath(cwd);

  async function withLock<T>(fn: () => Promise<T>): Promise<T> {
    const release = await lock(lockPath, { retries: 5 });
    try {
      return await fn();
    } finally {
      await release();
    }
  }

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
      // Ensure lock file directory exists
      const lockDir = resolve(lockPath, '..');
      if (!existsSync(lockDir)) {
        mkdirSync(lockDir, { recursive: true });
      }
      if (!existsSync(lockPath)) {
        writeFileSync(lockPath, '', 'utf-8');
      }
      // Use sync version for CLI simplicity, but could be async
      const release = lockSync(lockPath);
      try {
        appendFileSync(storePath, line + '\n', 'utf-8');
      } finally {
        release();
      }
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