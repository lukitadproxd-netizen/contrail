import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ContrailMCPServer } from './server.js';

async function main(): Promise<void> {
  const contrail = new ContrailMCPServer();
  const transport = new StdioServerTransport();
  await contrail.getServer().connect(transport);
}

void main().catch((error: unknown) => {
  console.error('Contrail MCP server failed to start:', error);
  process.exitCode = 1;
});
