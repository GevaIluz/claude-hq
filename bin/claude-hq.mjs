#!/usr/bin/env node

/**
 * claude-hq — CLI entry point
 *
 * Starts the Claude HQ dashboard server and opens it in the browser.
 * Usage: npx claude-hq [--port 5174] [--no-open]
 */

import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { createServer } from 'net';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = join(__dirname, '..', 'dist');

// ─── Parse CLI args ──────────────────────────────────────────

const args = process.argv.slice(2);
let preferredPort = parseInt(process.env.PORT || '5174', 10);
let autoOpen = true;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port' && args[i + 1]) {
    preferredPort = parseInt(args[i + 1], 10);
    i++;
  }
  if (args[i] === '--no-open') autoOpen = false;
  if (args[i] === '--help' || args[i] === '-h') {
    console.log(`
  Claude HQ — Dashboard for your Claude Code setup

  Usage:
    npx claude-hq [options]

  Options:
    --port <number>   Port to run on (default: 5174, or $PORT)
    --no-open         Don't auto-open the browser
    -h, --help        Show this help message
`);
    process.exit(0);
  }
}

// ─── Find a free port ────────────────────────────────────────

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => { server.close(); resolve(true); });
    server.listen(port, '127.0.0.1');
  });
}

async function findFreePort(start) {
  for (let port = start; port < start + 20; port++) {
    if (await isPortFree(port)) return port;
  }
  return start; // fallback, let it fail with a clear error
}

// ─── Check prerequisites ─────────────────────────────────────

import { homedir } from 'os';

const claudeDir = join(homedir(), '.claude');
if (!existsSync(claudeDir)) {
  console.warn(`\n⚠️  ~/.claude/ not found. Claude HQ reads your Claude Code config from this directory.`);
  console.warn(`   Install Claude Code first: https://docs.anthropic.com/en/docs/claude-code\n`);
  console.warn(`   Starting anyway with empty data...\n`);
}

// ─── Check that dist/ exists (built frontend) ────────────────

if (!existsSync(join(DIST_DIR, 'index.html'))) {
  console.error(`\n❌ Built frontend not found at ${DIST_DIR}`);
  console.error(`   If you're running from source, run: npm run build\n`);
  process.exit(1);
}

// ─── Start server ────────────────────────────────────────────

const { createApp } = await import('../server/hq-server.mjs');
const app = await createApp({ staticDir: DIST_DIR });

const PORT = await findFreePort(preferredPort);

app.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`
  ┌─────────────────────────────────────────────┐
  │                                             │
  │   🏢  Claude HQ is running                  │
  │                                             │
  │   Local:  ${url.padEnd(33)}│
  │                                             │
  │   Press Ctrl+C to stop                      │
  │                                             │
  └─────────────────────────────────────────────┘
`);

  if (autoOpen) {
    import('open').then(m => m.default(url)).catch(() => {
      console.log(`   Open ${url} in your browser`);
    });
  }
});
