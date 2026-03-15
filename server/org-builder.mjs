/**
 * org-builder.mjs — Reads ~/.claude/ directory and builds OrgData for Claude HQ.
 * Pure functions, no side effects. Used by hq-server.mjs.
 */

import { readFile, readdir, stat } from 'fs/promises';
import { join, basename } from 'path';
import { homedir } from 'os';

const CLAUDE_DIR = join(homedir(), '.claude');
const SKILLS_DIR = join(CLAUDE_DIR, 'skills');
const PLUGINS_DIR = join(CLAUDE_DIR, 'plugins', 'cache', 'claude-plugins-official');
const PROJECTS_DIR = join(CLAUDE_DIR, 'projects');
const SETTINGS_PATH = join(CLAUDE_DIR, 'settings.json');
const SETTINGS_LOCAL_PATH = join(CLAUDE_DIR, 'settings.local.json');
const SCHEDULED_TASKS_DIR = join(CLAUDE_DIR, 'scheduled-tasks');

// ─── YAML-ish Frontmatter Parser (no deps) ──────────────────

function parseFrontmatter(content) {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };

  const meta = {};
  let currentKey = null;
  for (const line of match[1].split('\n')) {
    const kvMatch = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (kvMatch) {
      currentKey = kvMatch[1];
      let val = kvMatch[2].trim();
      // Strip surrounding quotes
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      meta[currentKey] = val;
    } else if (currentKey && line.startsWith('  ')) {
      // Continuation of previous value
      meta[currentKey] += ' ' + line.trim();
    }
  }
  return { meta, body: match[2] };
}

// ─── Icon & Color Assignment ─────────────────────────────────

const SKILL_STYLES = {
  'aws': { icon: 'Cloud', color: '#f59e0b' },
  'azure': { icon: 'Server', color: '#0078d4' },
  'installme': { icon: 'Play', color: '#22c55e' },
  'morning': { icon: 'Sun', color: '#f97316' },
  'skill': { icon: 'Wand2', color: '#ec4899' },
  'test': { icon: 'BarChart3', color: '#06b6d4' },
};

function getSkillStyle(id) {
  for (const [prefix, style] of Object.entries(SKILL_STYLES)) {
    if (id.startsWith(prefix)) return style;
  }
  return { icon: 'Zap', color: '#8b5cf6' };
}

// ─── Skills ──────────────────────────────────────────────────

async function buildSkills() {
  const skills = [];
  try {
    const dirs = await readdir(SKILLS_DIR);
    for (const dir of dirs.sort()) {
      const skillPath = join(SKILLS_DIR, dir, 'SKILL.md');
      try {
        const content = await readFile(skillPath, 'utf-8');
        const { meta, body } = parseFrontmatter(content);
        const style = getSkillStyle(dir);

        // Extract triggers from description if present
        const triggers = [];
        const descLower = (meta.description || '').toLowerCase();
        const triggerPatterns = [/trigger.*?[":]\s*"([^"]+)"/gi, /"([^"]+)"/g];
        for (const pat of triggerPatterns) {
          let m;
          while ((m = pat.exec(meta.description || '')) !== null) {
            if (m[1].length < 60) triggers.push(m[1]);
          }
        }

        skills.push({
          id: dir,
          name: meta.name || dir.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          description: meta.description || body.split('\n').find(l => l.trim() && !l.startsWith('#')) || '',
          triggers: triggers.slice(0, 10),
          hasReferences: false,
          referenceFiles: [],
          content: body.trim().slice(0, 500),
          icon: style.icon,
          color: style.color,
        });
      } catch {
        // Skip skills without SKILL.md
      }
    }
  } catch {
    // Skills dir may not exist
  }
  return skills;
}

// ─── Plugins ─────────────────────────────────────────────────

const PLUGIN_META = {
  'code-review': { shortName: 'Code Review', icon: 'Eye', description: 'Automated code review with focus on bugs, security, and best practices' },
  'commit-commands': { shortName: 'Commit Commands', icon: 'GitCommitHorizontal', description: 'Git commit helpers — commit, push, and create PRs with formatted messages' },
  'code-simplifier': { shortName: 'Code Simplifier', icon: 'Sparkles', description: 'Simplifies and refines code for clarity, consistency, and maintainability' },
  'atlassian': { shortName: 'Atlassian', icon: 'Kanban', description: 'Jira and Confluence integration for issue tracking and documentation' },
  'github': { shortName: 'GitHub', icon: 'Github', description: 'GitHub repository management, PR handling, and issue management' },
  'skill-creator': { shortName: 'Skill Creator', icon: 'Wand2', description: 'Create, modify, and evaluate Claude Code skills with performance benchmarking' },
  'feature-dev': { shortName: 'Feature Dev', icon: 'Layers', description: 'Guided feature development with codebase understanding and architecture focus' },
  'hookify': { shortName: 'Hookify', icon: 'Anchor', description: 'Create and manage hooks to prevent unwanted behaviors and enforce patterns' },
};

async function buildPlugins(enabledPlugins) {
  const plugins = [];
  try {
    const dirs = await readdir(PLUGINS_DIR);
    for (const dir of dirs.sort()) {
      const pluginId = `${dir}@claude-plugins-official`;
      const meta = PLUGIN_META[dir] || { shortName: dir, icon: 'Puzzle', description: '' };
      const enabled = enabledPlugins?.[pluginId] === true;

      plugins.push({
        id: pluginId,
        shortName: meta.shortName,
        marketplace: 'claude-plugins-official',
        description: meta.description,
        enabled,
        icon: meta.icon,
      });
    }
  } catch {
    // Plugins dir may not exist
  }
  return plugins;
}

// ─── Permissions ─────────────────────────────────────────────

function categorizePermission(raw) {
  if (raw.includes('aws ')) return 'AWS CLI';
  if (raw.includes('az ')) return 'Azure CLI';
  if (raw.includes('ssh ') || raw.includes('scp ') || raw.includes('rsync')) return 'SSH & Remote';
  if (raw.includes('git ') || raw.includes('gh ')) return 'Git';
  if (raw.includes('mgmt_cli') || raw.includes('installer') || raw.includes('da_cli') ||
      raw.includes('cpca_') || raw.includes('cpstat') || raw.includes('fw ') ||
      raw.includes('cpinfo') || raw.includes('cplic') || raw.includes('cpview')) return 'Check Point CLI';
  return 'System & Tools';
}

const CATEGORY_ICONS = {
  'AWS CLI': 'Cloud',
  'Azure CLI': 'Server',
  'SSH & Remote': 'Terminal',
  'Git': 'GitBranch',
  'Check Point CLI': 'Shield',
  'System & Tools': 'Wrench',
};

function summarizePermission(raw) {
  // Extract the command after Bash(
  const match = raw.match(/^Bash\((.+?)\)$/);
  if (!match) return raw;
  const cmd = match[1];
  // Take first 2-3 meaningful words
  const words = cmd.split(/\s+/).filter(w => !w.startsWith('-') && !w.startsWith('/'));
  return words.slice(0, 3).join(' ');
}

async function buildPermissions() {
  const allPerms = new Map(); // category → PermissionEntry[]

  for (const [path, source] of [[SETTINGS_PATH, 'global'], [SETTINGS_LOCAL_PATH, 'local']]) {
    try {
      const content = await readFile(path, 'utf-8');
      const settings = JSON.parse(content);
      const allowList = settings?.permissions?.allow || [];
      for (const raw of allowList) {
        const category = categorizePermission(raw);
        if (!allPerms.has(category)) allPerms.set(category, []);
        allPerms.get(category).push({
          raw,
          summary: summarizePermission(raw),
          source,
        });
      }
    } catch {
      // File may not exist
    }
  }

  // Deduplicate and build groups
  const groups = [];
  for (const [category, perms] of allPerms) {
    // Dedupe by raw value, keep unique only
    const seen = new Set();
    const unique = perms.filter(p => {
      if (seen.has(p.raw)) return false;
      seen.add(p.raw);
      return true;
    });

    groups.push({
      category,
      icon: CATEGORY_ICONS[category] || 'Wrench',
      permissions: unique,
    });
  }

  return groups;
}

// ─── Memory ──────────────────────────────────────────────────

async function buildMemory() {
  const defaultMemory = {
    userProfile: { name: '', company: '', team: '', role: '', focus: '' },
    awsContext: {},
    goals: [],
    rawContent: '',
  };

  // Find the home project memory
  try {
    const projects = await readdir(PROJECTS_DIR);
    for (const proj of projects) {
      const memPath = join(PROJECTS_DIR, proj, 'memory', 'MEMORY.md');
      try {
        const content = await readFile(memPath, 'utf-8');
        defaultMemory.rawContent = content;

        // Parse sections
        const sections = {};
        let currentSection = '';
        for (const line of content.split('\n')) {
          const headerMatch = line.match(/^##\s+(.+)/);
          if (headerMatch) {
            currentSection = headerMatch[1].trim();
            sections[currentSection] = [];
          } else if (currentSection && line.trim().startsWith('- ')) {
            sections[currentSection].push(line.trim().replace(/^-\s*/, ''));
          }
        }

        // User Profile
        const profile = sections['User Profile'] || [];
        for (const item of profile) {
          if (item.includes('Check Point')) defaultMemory.userProfile.company = 'Check Point Software';
          if (item.includes('developer')) defaultMemory.userProfile.role = 'Developer';
          if (item.includes('FWaaS')) defaultMemory.userProfile.team = 'FWaaS';
          if (item.includes('SMO')) defaultMemory.userProfile.focus = 'SMO (Single Management Object)';
        }

        // AWS Context
        const aws = sections['AWS Context'] || [];
        for (const item of aws) {
          const kvMatch = item.match(/\*\*(.+?):\*\*\s*`?([^`]+)`?/);
          if (kvMatch) {
            defaultMemory.awsContext[kvMatch[1].trim()] = kvMatch[2].trim();
          }
        }

        // Goals
        defaultMemory.goals = (sections['Goals'] || []).map(g =>
          g.replace(/\*\*/g, '').trim()
        );

        // Try to extract name from content
        const nameMatch = content.match(/\*\*(\w+)\s*\(me\)\*\*/i) || content.match(/Guy/);
        if (nameMatch) defaultMemory.userProfile.name = 'Guy Gev';

        break; // Use first project with memory
      } catch {
        // No memory file for this project
      }
    }
  } catch {
    // Projects dir may not exist
  }

  return defaultMemory;
}

// ─── Projects ────────────────────────────────────────────────

async function buildProjects() {
  const projects = [];
  try {
    const dirs = await readdir(PROJECTS_DIR);
    for (const dir of dirs) {
      // Decode path from directory name (e.g., -Users-guygev → /Users/guygev)
      const decodedPath = dir.replace(/^-/, '/').replace(/-/g, '/');
      const displayName = basename(decodedPath) || dir;

      let hasMemory = false;
      let memorySummary = '';
      let memoryContent = '';

      const memPath = join(PROJECTS_DIR, dir, 'memory', 'MEMORY.md');
      try {
        memoryContent = await readFile(memPath, 'utf-8');
        hasMemory = true;
        // First non-header, non-empty line as summary
        const lines = memoryContent.split('\n').filter(l => l.trim() && !l.startsWith('#'));
        memorySummary = lines.slice(0, 3).join(' ').slice(0, 200);
      } catch {
        // No memory
      }

      projects.push({
        id: dir,
        path: decodedPath,
        displayName: displayName === 'guygev' ? 'Home (Default)' : displayName.replace(/-/g, ' '),
        hasMemory,
        memorySummary,
        memoryContent,
      });
    }
  } catch {
    // Projects dir may not exist
  }
  return projects;
}

// ─── Scheduled Tasks ─────────────────────────────────────────

async function buildScheduledTasks() {
  const tasks = [];
  try {
    const dirs = await readdir(SCHEDULED_TASKS_DIR);
    for (const dir of dirs) {
      const taskPath = join(SCHEDULED_TASKS_DIR, dir, 'SKILL.md');
      try {
        const content = await readFile(taskPath, 'utf-8');
        const { meta } = parseFrontmatter(content);
        tasks.push({
          taskId: dir,
          description: meta.description || dir,
          schedule: meta['cron-expression'] || meta.schedule || '',
          enabled: meta.enabled !== 'false',
        });
      } catch {
        // Skip
      }
    }
  } catch {
    // Dir may not exist
  }
  return tasks;
}

// ─── Main Builder ────────────────────────────────────────────

/**
 * Build OrgData from ~/.claude/ disk files, merging static fallback
 * for fields that can't be auto-discovered (agents, mcpServers, hooks, teamMembers).
 */
export async function buildOrgData(staticFallback = null) {
  // Read settings for enabled plugins list
  let enabledPlugins = {};
  try {
    const content = await readFile(SETTINGS_PATH, 'utf-8');
    const settings = JSON.parse(content);
    enabledPlugins = settings.enabledPlugins || {};
  } catch {
    // ignore
  }

  const [skills, plugins, permissions, memory, projects, scheduledTasks] = await Promise.all([
    buildSkills(),
    buildPlugins(enabledPlugins),
    buildPermissions(),
    buildMemory(),
    buildProjects(),
    buildScheduledTasks(),
  ]);

  const orgData = {
    meta: {
      generatedAt: new Date().toISOString(),
      userName: memory.userProfile.name || staticFallback?.meta?.userName || 'Unknown',
      company: memory.userProfile.company || staticFallback?.meta?.company || '',
      team: memory.userProfile.team || staticFallback?.meta?.team || '',
      role: memory.userProfile.role || staticFallback?.meta?.role || '',
      currentFocus: memory.userProfile.focus || staticFallback?.meta?.currentFocus || '',
    },
    skills: skills.length > 0 ? skills : (staticFallback?.skills || []),
    plugins: plugins.length > 0 ? plugins : (staticFallback?.plugins || []),
    // These come from static fallback — too complex to auto-discover in v1
    mcpServers: staticFallback?.mcpServers || [],
    agents: staticFallback?.agents || [],
    hooks: staticFallback?.hooks || [],
    projects: projects.length > 0 ? projects : (staticFallback?.projects || []),
    permissions: permissions.length > 0 ? permissions : (staticFallback?.permissions || []),
    memory,
    scheduledTasks,
    teamMembers: staticFallback?.teamMembers || [],
  };

  return orgData;
}

// Allow standalone testing: node server/org-builder.mjs
const isMain = process.argv[1]?.endsWith('org-builder.mjs');
if (isMain) {
  buildOrgData().then(data => {
    console.log(JSON.stringify(data, null, 2));
    console.log(`\n✅ Built: ${data.skills.length} skills, ${data.plugins.length} plugins, ${data.permissions.length} permission groups, ${data.projects.length} projects`);
  }).catch(console.error);
}
