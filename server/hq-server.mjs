/**
 * hq-server.mjs — Unified backend for Claude HQ.
 *
 * Serves two things:
 *   1. Live org data (reads ~/.claude/, watches for changes, pushes via SSE)
 *   2. Mission monitor (watches /tmp/claude-hq-mission/{planId}/*.json, pushes via SSE)
 *
 * API Endpoints (mounted under /api):
 *   GET /api/health                → { ok: true }
 *   GET /api/org                   → full OrgData JSON
 *   GET /api/org/events            → SSE stream (pushes full OrgData on file change)
 *   GET /api/events/:planId        → SSE mission monitor stream
 *
 * Usage:
 *   import { createApp } from './hq-server.mjs';
 *   const app = await createApp();
 *   app.listen(5174);
 *
 * Or run directly: node server/hq-server.mjs
 */

import express from 'express';
import { watch } from 'fs';
import { readFile, readdir, mkdir } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { buildOrgData } from './org-builder.mjs';

const CLAUDE_DIR = join(homedir(), '.claude');
const MISSION_BASE = '/tmp/claude-hq-mission';

/**
 * Creates and configures the Express app with all API routes.
 * Does NOT call app.listen() — the caller is responsible for that.
 *
 * @param {Object} [options]
 * @param {string} [options.staticDir] - Path to pre-built frontend to serve
 */
export async function createApp(options = {}) {
  const app = express();
  const router = express.Router();

  // Load static fallback for fields that can't be auto-discovered
  const STATIC_ORG_PATH = join(import.meta.dirname, '..', 'src', 'data', 'org.json');
  let staticFallback = null;
  try {
    staticFallback = JSON.parse(await readFile(STATIC_ORG_PATH, 'utf-8'));
  } catch {
    console.warn('⚠️  Could not load static org.json fallback (this is fine for fresh installs)');
  }

  // ─── Org Data State ──────────────────────────────────────────

  let currentOrgData = null;
  const orgClients = new Set(); // SSE clients for org updates

  async function refreshOrgData() {
    try {
      currentOrgData = await buildOrgData(staticFallback);
      // Push to all connected SSE clients
      for (const res of orgClients) {
        try {
          res.write(`event: org-update\ndata: ${JSON.stringify(currentOrgData)}\n\n`);
        } catch {
          orgClients.delete(res);
        }
      }
      console.log(`🔄 Org data refreshed: ${currentOrgData.skills.length} skills, ${currentOrgData.plugins.length} plugins`);
    } catch (err) {
      console.error('Failed to refresh org data:', err.message);
    }
  }

  // Initial build
  await refreshOrgData();

  // Watch ~/.claude/ for changes with debounce
  let debounceTimer = null;
  try {
    watch(CLAUDE_DIR, { recursive: true }, (_event, filename) => {
      if (!filename) return;
      if (filename.includes('node_modules') || filename.includes('.git')) return;

      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        console.log(`📁 Change detected: ${filename}`);
        refreshOrgData();
      }, 500);
    });
    console.log(`👁  Watching ${CLAUDE_DIR} for changes`);
  } catch (err) {
    console.warn(`⚠️  Could not watch ${CLAUDE_DIR}:`, err.message);
  }

  // ─── Health ──────────────────────────────────────────────────

  router.get('/health', (_req, res) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
  });

  // ─── Org Data REST ───────────────────────────────────────────

  router.get('/org', (_req, res) => {
    if (!currentOrgData) {
      return res.status(503).json({ error: 'Org data not yet loaded' });
    }
    res.json(currentOrgData);
  });

  // ─── Org Data SSE ────────────────────────────────────────────

  router.get('/org/events', (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    if (currentOrgData) {
      res.write(`event: org-update\ndata: ${JSON.stringify(currentOrgData)}\n\n`);
    }

    orgClients.add(res);

    const keepAlive = setInterval(() => {
      res.write(': keepalive\n\n');
    }, 30000);

    req.on('close', () => {
      orgClients.delete(res);
      clearInterval(keepAlive);
    });
  });

  // ─── Mission Monitor SSE ─────────────────────────────────────

  router.get('/events/:planId', async (req, res) => {
    const { planId } = req.params;
    const watchDir = join(MISSION_BASE, planId);

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    try {
      await mkdir(watchDir, { recursive: true });
    } catch { /* ignore */ }

    try {
      const files = await readdir(watchDir);
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        try {
          const content = await readFile(join(watchDir, file), 'utf-8');
          const data = JSON.parse(content);
          const agentInstanceId = file.replace('.json', '');
          res.write(`data: ${JSON.stringify({ agentInstanceId, ...data })}\n\n`);
        } catch { /* skip malformed */ }
      }
    } catch { /* dir may not exist */ }

    let watcher;
    try {
      watcher = watch(watchDir, { recursive: false }, async (_event, filename) => {
        if (!filename || !filename.endsWith('.json')) return;
        try {
          const content = await readFile(join(watchDir, filename), 'utf-8');
          const data = JSON.parse(content);
          const agentInstanceId = filename.replace('.json', '');
          res.write(`data: ${JSON.stringify({ agentInstanceId, ...data })}\n\n`);
        } catch { /* skip mid-write errors */ }
      });
    } catch { /* watching failed */ }

    const keepAlive = setInterval(() => {
      res.write(': keepalive\n\n');
    }, 30000);

    req.on('close', () => {
      clearInterval(keepAlive);
      if (watcher) watcher.close();
    });
  });

  // Mount all API routes under /api
  app.use('/api', router);

  // Optionally serve a pre-built frontend (production mode)
  if (options.staticDir) {
    app.use(express.static(options.staticDir));
    // SPA fallback — any non-API GET serves index.html
    app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
      res.sendFile(join(options.staticDir, 'index.html'));
    });
  }

  return app;
}

// ─── Auto-start when run directly (dev mode) ─────────────────

const isMain = process.argv[1]?.endsWith('hq-server.mjs');
if (isMain) {
  const app = await createApp();
  const PORT = process.env.PORT || 5174;

  app.listen(PORT, () => {
    console.log(`\n🏢 Claude HQ Server running on http://localhost:${PORT}`);
    console.log(`   GET /api/org           → org data (JSON)`);
    console.log(`   GET /api/org/events    → org data (SSE live)`);
    console.log(`   GET /api/events/:plan  → mission monitor (SSE)`);
    console.log(`   GET /api/health        → health check\n`);
  });
}
