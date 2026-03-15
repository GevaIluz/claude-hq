# Claude HQ

A local dashboard for your Claude Code setup — skills, plugins, projects, memory, permissions, MCP servers, and more.

## Quick Start

```bash
npx claude-hq
```

That's it. Opens in your browser automatically.

## What It Shows

- **Skills** — grouped into Skill Sets, with triggers, capabilities, and workflows
- **Plugins** — installed Claude Code plugins
- **MCP Servers** — connected Model Context Protocol servers
- **Agents** — configured agent definitions
- **Memory** — your stored memories and context
- **Hooks** — event-triggered shell commands
- **Permissions** — tool access rules
- **Projects** — project-specific configurations
- **Scheduled Tasks** — recurring automated tasks

## How It Works

Claude HQ reads your `~/.claude/` directory and presents everything in a clean dashboard. It watches for file changes and pushes live updates via Server-Sent Events — edit a skill file, and the dashboard updates instantly.

## Prerequisites

- **Node.js** 20+
- **Claude Code** installed (`~/.claude/` directory exists)

## Options

```bash
npx claude-hq --port 3000    # Custom port (default: 5174)
npx claude-hq --no-open      # Don't auto-open browser
```

## Development

```bash
git clone https://github.com/guygev/claude-hq.git
cd claude-hq
npm install

# Terminal 1: API server (watches ~/.claude/, serves data)
npm run server

# Terminal 2: Frontend with hot reload
npm run dev
```

Open `http://localhost:5173`

## License

MIT
