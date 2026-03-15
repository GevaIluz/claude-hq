import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Zap, Puzzle, Server, Brain, GitFork,
  Shield, FolderOpen, CalendarClock, ChevronLeft, ChevronRight, Bot, Map
} from 'lucide-react';
import { useState } from 'react';
import type { OrgData } from '../types';

interface SidebarProps {
  data: OrgData;
}

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Overview', countKey: null },
  { to: '/skills', icon: Zap, label: 'Skills', countKey: 'skills' },
  { to: '/plugins', icon: Puzzle, label: 'Plugins', countKey: 'plugins' },
  { to: '/mcp', icon: Server, label: 'MCP Servers', countKey: 'mcpServers' },
  { to: '/agents', icon: Bot, label: 'Agents', countKey: 'agents' },
  { to: '/memory', icon: Brain, label: 'Memory', countKey: null },
  { to: '/hooks', icon: GitFork, label: 'Hooks', countKey: 'hooks' },
  { to: '/permissions', icon: Shield, label: 'Permissions', countKey: 'permissions' },
  { to: '/projects', icon: FolderOpen, label: 'Projects', countKey: 'projects' },
  { to: '/tasks', icon: CalendarClock, label: 'Tasks', countKey: 'scheduledTasks' },
  { to: '/planner', icon: Map, label: 'Planner', countKey: null },
] as const;

function getCount(data: OrgData, key: string | null): number | null {
  if (!key) return null;
  const val = data[key as keyof OrgData];
  if (Array.isArray(val)) return val.length;
  return null;
}

export function Sidebar({ data }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`h-full bg-bg-surface border-r border-border flex flex-col transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-4 shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-accent flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="font-semibold text-text-primary text-sm tracking-tight">Claude HQ</span>
          </div>
        )}
        {collapsed && (
          <div className="w-7 h-7 rounded-xl bg-accent flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-sm">C</span>
          </div>
        )}
      </div>
      <div className="gradient-divider mx-3" />

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const count = getCount(data, item.countKey);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200 group
                ${isActive
                  ? 'bg-accent/8 text-accent font-medium'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover'
                }
                ${collapsed ? 'justify-center' : ''}`
              }
            >
              <item.icon size={18} className="shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {count !== null && (
                    <span className="text-[11px] text-text-muted group-hover:text-text-secondary transition-colors">
                      {count}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Info */}
      {!collapsed && (
        <div className="mx-3 mb-2">
          <div className="gradient-divider mb-3" />
          <div className="px-2 pb-2">
            <div className="text-xs text-text-muted mb-1">{data.meta.company}</div>
            <div className="text-sm text-text-secondary font-medium">{data.meta.userName}</div>
            <div className="text-xs text-text-muted mt-0.5">{data.meta.currentFocus}</div>
          </div>
        </div>
      )}

      {/* Collapse Toggle */}
      <div className="gradient-divider mx-3" />
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="h-10 flex items-center justify-center text-text-muted hover:text-text-secondary transition-colors"
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
}
