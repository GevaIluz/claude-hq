import { Search, Sun, Moon } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';

const pageTitles: Record<string, string> = {
  '/': 'Overview',
  '/skills': 'Skills',
  '/plugins': 'Plugins',
  '/mcp': 'MCP Servers',
  '/agents': 'Agents',
  '/memory': 'Memory',
  '/hooks': 'Hooks',
  '/permissions': 'Permissions',
  '/projects': 'Projects',
  '/tasks': 'Scheduled Tasks',
  '/planner': 'Mission Planner',
};

interface TopBarProps {
  onSearch?: (query: string) => void;
  live?: boolean;
}

export function TopBar({ onSearch, live = false }: TopBarProps) {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Claude HQ';
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-14 bg-bg-surface border-b border-border flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4">
        <h1 className="text-base font-semibold text-text-primary">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search..."
            onChange={(e) => onSearch?.(e.target.value)}
            className="w-56 pl-9 pr-3 py-1.5 bg-bg-primary border border-border rounded-lg text-sm text-text-primary
              placeholder:text-text-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-text-muted bg-bg-surface-hover px-1.5 py-0.5 rounded border border-border">
            /
          </kbd>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-bg-surface-hover text-text-muted hover:text-text-primary transition-colors"
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>

        {/* Status indicator */}
        <div className="flex items-center gap-2" title={live ? 'Live sync active — changes to ~/.claude/ appear instantly' : 'Static mode — start HQ server for live sync'}>
          <div className={`w-2 h-2 rounded-full ${live ? 'bg-success animate-pulse' : 'bg-text-muted'}`} />
          <span className="text-xs text-text-secondary">{live ? 'Live' : 'Static'}</span>
        </div>
      </div>
    </header>
  );
}
