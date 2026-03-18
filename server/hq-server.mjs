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
import { readFile, readdir, mkdir, writeFile, chmod } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { exec } from 'child_process';
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

  // ─── Agent Launch ────────────────────────────────────────────
  // Opens a visible Terminal window and runs claude with the mission prompt.

  router.post('/launch', express.json(), async (req, res) => {
    const { prompt, workDir } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Missing prompt' });
    }

    try {
      const ts = Date.now();
      const promptFile = `/tmp/claude-hq-prompt-${ts}.md`;

      await writeFile(promptFile, prompt, 'utf-8');

      const cwd = workDir || homedir();

      // Interactive launch using tmux:
      // 1. Create a tmux session running claude --dangerously-skip-permissions
      // 2. Use tmux send-keys to navigate the accept menu and send the prompt
      // 3. Open Terminal attached to the tmux session so user can interact
      const sessionName = `claude-hq-${ts}`;
      const launchScript = `/tmp/claude-hq-launch-${ts}.sh`;
      const bashScript = `#!/bin/bash
SESSION="${sessionName}"
PROMPT_FILE="${promptFile}"

# Start tmux session with claude in detached mode
tmux new-session -d -s "$SESSION" -x 200 -y 50 "cd '${cwd}' && /usr/local/bin/claude --dangerously-skip-permissions"

# Wait for the accept menu to appear
sleep 5

# Down arrow to select "Yes, I accept", then Enter
tmux send-keys -t "$SESSION" Down
sleep 0.3
tmux send-keys -t "$SESSION" Enter

# Wait for Claude TUI to fully load
sleep 8

# Read prompt from file and paste it using tmux's buffer
tmux load-buffer "$PROMPT_FILE"
tmux paste-buffer -t "$SESSION"

# Small delay then submit
sleep 1
tmux send-keys -t "$SESSION" Enter

echo "🤖 Claude agent is running in tmux session: $SESSION"
echo "   Attaching now..."
sleep 1

# Attach to the session (user can now interact freely)
tmux attach -t "$SESSION"
`;

      await writeFile(launchScript, bashScript, 'utf-8');
      await chmod(launchScript, '755');

      // Open in a new Terminal window
      exec(`osascript -e 'tell application "Terminal" to do script "bash ${launchScript}"' -e 'tell application "Terminal" to activate'`, (err) => {
        if (err) {
          console.error('Launch error:', err.message);
        } else {
          console.log(`🚀 Agent launched in tmux session ${sessionName}`);
        }
      });

      // Respond immediately — don't wait for the agent to finish
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─── Jira API Proxy ────────────────────────────────────────

  const JIRA_BASE = process.env.JIRA_URL || 'https://jira-prd.checkpoint.com';
  let JIRA_TOKEN = process.env.JIRA_PERSONAL_TOKEN;

  // Try to load from ~/.zshrc if not in environment
  if (!JIRA_TOKEN) {
    try {
      const zshrc = await readFile(join(homedir(), '.zshrc'), 'utf-8');
      const match = zshrc.match(/export\s+JIRA_PERSONAL_TOKEN=["']?([^"'\n]+)/);
      if (match) {
        JIRA_TOKEN = match[1];
        console.log('🔑 Loaded JIRA_PERSONAL_TOKEN from ~/.zshrc');
      }
    } catch { /* ignore */ }
  }

  router.get('/jira/search', async (req, res) => {
    if (!JIRA_TOKEN) {
      return res.status(503).json({ error: 'JIRA_PERSONAL_TOKEN not set' });
    }
    const jql = req.query.jql || 'assignee = currentUser() ORDER BY updated DESC';
    const maxResults = req.query.maxResults || '20';
    const fields = req.query.fields || 'summary,status,priority,issuetype,project,assignee,updated,created,customfield_10004';

    try {
      const url = `${JIRA_BASE}/rest/api/2/search?jql=${encodeURIComponent(jql)}&maxResults=${maxResults}&fields=${fields}`;
      const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${JIRA_TOKEN}` },
      });
      if (!resp.ok) {
        const text = await resp.text();
        return res.status(resp.status).json({ error: text });
      }
      const data = await resp.json();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/jira/issue/:key', async (req, res) => {
    if (!JIRA_TOKEN) {
      return res.status(503).json({ error: 'JIRA_PERSONAL_TOKEN not set' });
    }
    try {
      const url = `${JIRA_BASE}/rest/api/2/issue/${req.params.key}`;
      const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${JIRA_TOKEN}` },
      });
      if (!resp.ok) {
        const text = await resp.text();
        return res.status(resp.status).json({ error: text });
      }
      res.json(await resp.json());
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
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
