import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { ContrailMCPServer } from '../src/server.js';

describe('ContrailMCPServer', () => {
  let testDir: string;
  let server: ContrailMCPServer;
  let storePath: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'contrail-mcp-test-'));
    storePath = join(testDir, '.contrail', 'claims.jsonl');
    server = new ContrailMCPServer({ storePath });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('contrail_remember stores a claim and contrail_recall retrieves it', async () => {
    const rememberTool = server.getToolHandler('contrail_remember');
    expect(rememberTool).toBeDefined();
    
    const rememberResult = await rememberTool.handler({
      subject: 'self',
      predicate: 'preference.editor',
      value: 'vscode',
      confidence: 0.9,
      source_tool: 'test',
      source_kind: 'explicit-statement'
    });

    expect(rememberResult.isError).toBeFalsy();
    expect(rememberResult.content[0].text).toContain('Stored claim');

    // Call contrail_recall tool
    const recallTool = server.getToolHandler('contrail_recall');
    expect(recallTool).toBeDefined();

    const recallResult = await recallTool.handler({
      subject: 'self',
      predicate: 'preference.editor'
    });

    expect(recallResult.isError).toBeFalsy();
    const claim = JSON.parse(recallResult.content[0].text);
    expect(claim.predicate).toBe('preference.editor');
    expect(claim.value).toBe('vscode');
    expect(claim.confidence).toBe(0.9);
  });

  it('contrail_trajectory shows full chain with isHead', async () => {
    const rememberTool = server.getToolHandler('contrail_remember');
    const trajectoryTool = server.getToolHandler('contrail_trajectory');

    // First claim
    await rememberTool.handler({
      subject: 'self',
      predicate: 'preference.editor',
      value: 'vscode',
      confidence: 0.8,
      source_tool: 'test',
      source_kind: 'explicit-statement'
    });

    // Get the ID of the first claim
    const recallTool = server.getToolHandler('contrail_recall');
    const firstRecall = await recallTool.handler({
      subject: 'self',
      predicate: 'preference.editor'
    });
    const firstClaim = JSON.parse(firstRecall.content[0].text);
    const firstId = firstClaim.id;

    // Second claim superseding first
    await rememberTool.handler({
      subject: 'self',
      predicate: 'preference.editor',
      value: 'neovim',
      confidence: 0.95,
      source_tool: 'test',
      source_kind: 'corrected',
      supersedes: firstId
    });

    // Get trajectory
    const trajectoryResult = await trajectoryTool.handler({
      subject: 'self',
      predicate: 'preference.editor'
    });

    expect(trajectoryResult.isError).toBeFalsy();
    const trajectory = JSON.parse(trajectoryResult.content[0].text);
    
    expect(trajectory.subject).toBe('self');
    expect(trajectory.predicate).toBe('preference.editor');
    expect(trajectory.totalClaims).toBe(2);
    expect(trajectory.history).toHaveLength(2);
    
    // Newest claim should be isHead: true
    expect(trajectory.history[0].isHead).toBe(true);
    expect(trajectory.history[0].value).toBe('neovim');
    expect(trajectory.history[1].isHead).toBe(false);
    expect(trajectory.history[1].value).toBe('vscode');
  });

  it('contrail_recall on unknown predicate returns not found message', async () => {
    const recallTool = server.getToolHandler('contrail_recall');

    const result = await recallTool.handler({
      subject: 'self',
      predicate: 'unknown.predicate'
    });

    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain('No claim found');
  });
});