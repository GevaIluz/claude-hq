import { useOutletContext, Link } from 'react-router-dom';
import { useState } from 'react';
import {
  Zap, Puzzle, Server, Shield, FolderOpen, GitFork,
  Users, CalendarClock, Bot, ArrowRight
} from 'lucide-react';
import type { OrgData } from '../types';
import { DetailPanel } from '../components/shared/DetailPanel';
import { Badge } from '../components/shared/Badge';

type DetailItem = {
  title: string;
  subtitle?: string;
  content: React.ReactNode;
};

export function Overview() {
  const data = useOutletContext<OrgData>();
  const totalPerms = data.permissions.reduce((sum, g) => sum + g.permissions.length, 0);
  const connectedMcps = data.mcpServers.filter(m => m.authStatus === 'connected').length;
  const enabledPlugins = data.plugins.filter(p => p.enabled).length;
  const [detail, setDetail] = useState<DetailItem | null>(null);

  const stats = [
    { to: '/skills', icon: Zap, label: 'Skills', value: data.skills.length, sub: 'Custom workflows', color: '#E27B58' },
    { to: '/plugins', icon: Puzzle, label: 'Plugins', value: data.plugins.length, sub: `${enabledPlugins} enabled`, color: '#5CB87A' },
    { to: '/mcp', icon: Server, label: 'MCP Servers', value: data.mcpServers.length, sub: `${connectedMcps} connected`, color: '#5B9BD5' },
    { to: '/agents', icon: Bot, label: 'Agents', value: data.agents.length, sub: 'Sub-agent types', color: '#9B6DD7' },
    { to: '/permissions', icon: Shield, label: 'Permissions', value: `${totalPerms}+`, sub: `${data.permissions.length} categories`, color: '#D9534F' },
  ];

  return (
    <>
      <div className="space-y-8">
        {/* Welcome */}
        <div>
          <h2 className="text-xl font-bold text-text-primary">
            Welcome back, {data.meta.userName.split(' ')[0]}
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Here's your AI organization at a glance.
          </p>
        </div>

        {/* Stats — large inline numbers */}
        <div className="flex flex-wrap gap-6 lg:gap-10">
          {stats.map(s => (
            <Link
              key={s.to}
              to={s.to}
              className="group flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${s.color}15` }}>
                <s.icon size={20} style={{ color: s.color }} />
              </div>
              <div>
                <div className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">
                  {s.label}
                </div>
                <div className="text-lg font-bold text-text-secondary leading-tight">{s.value}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Skills */}
          <section className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-accent" />
                <h3 className="text-sm font-semibold text-text-primary">Skills</h3>
              </div>
              <Link to="/skills" className="text-xs text-accent hover:text-accent-hover flex items-center gap-1 transition-colors">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            <div className="space-y-1">
              {data.skills.slice(0, 5).map(skill => (
                <button
                  key={skill.id}
                  onClick={() => setDetail({
                    title: skill.name,
                    subtitle: skill.id,
                    content: (
                      <div className="space-y-4">
                        <p className="text-sm text-text-secondary">{skill.description}</p>
                        <div>
                          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Triggers</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {skill.triggers.map((t, i) => (
                              <span key={i} className="px-2 py-1 bg-bg-primary border border-border rounded-lg text-xs text-text-secondary font-mono">"{t}"</span>
                            ))}
                          </div>
                        </div>
                        {skill.capabilities && (
                          <div>
                            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Capabilities</h4>
                            <ul className="space-y-1">
                              {skill.capabilities.map((c, i) => (
                                <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                                  <span className="text-accent mt-0.5">•</span> {c}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ),
                  })}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-bg-surface-hover text-left transition-colors group"
                >
                  <div className="min-w-0">
                    <span className="text-sm text-text-primary group-hover:text-accent transition-colors">{skill.name}</span>
                    <span className="text-xs text-text-muted ml-2">{skill.triggers.length} triggers</span>
                  </div>
                  <ArrowRight size={14} className="text-text-muted group-hover:text-accent transition-colors shrink-0" />
                </button>
              ))}
            </div>
          </section>

          {/* MCP Servers */}
          <section className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Server size={16} className="text-info" />
                <h3 className="text-sm font-semibold text-text-primary">MCP Servers</h3>
              </div>
              <Link to="/mcp" className="text-xs text-accent hover:text-accent-hover flex items-center gap-1 transition-colors">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            <div className="space-y-1">
              {data.mcpServers.slice(0, 5).map(server => (
                <button
                  key={server.id}
                  onClick={() => setDetail({
                    title: server.name,
                    subtitle: server.transport,
                    content: (
                      <div className="space-y-4">
                        <p className="text-sm text-text-secondary">{server.description}</p>
                        <div className="space-y-2">
                          <div className="flex justify-between py-2 border-b border-border/50">
                            <span className="text-xs text-text-muted">Type</span>
                            <Badge variant={server.type === 'custom' ? 'accent' : 'info'}>{server.type}</Badge>
                          </div>
                          <div className="flex justify-between py-2 border-b border-border/50">
                            <span className="text-xs text-text-muted">Auth Status</span>
                            <Badge variant={server.authStatus === 'connected' ? 'success' : 'warning'}>{server.authStatus}</Badge>
                          </div>
                          <div className="flex justify-between py-2 border-b border-border/50">
                            <span className="text-xs text-text-muted">Tools</span>
                            <span className="text-xs text-text-secondary">{server.toolCount}</span>
                          </div>
                        </div>
                        {server.tools.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Tools</h4>
                            <div className="space-y-1">
                              {server.tools.map((tool, i) => (
                                <div key={i} className="px-3 py-2 bg-bg-primary border border-border rounded-lg">
                                  <div className="text-xs font-mono text-accent">{tool.name}</div>
                                  <div className="text-[11px] text-text-muted mt-0.5">{tool.description}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ),
                  })}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-bg-surface-hover text-left transition-colors group"
                >
                  <div className="min-w-0 flex items-center gap-2">
                    <span className="text-sm text-text-primary group-hover:text-accent transition-colors">{server.name}</span>
                    <Badge variant={server.authStatus === 'connected' ? 'success' : 'warning'} >
                      {server.authStatus === 'connected' ? 'Connected' : 'Needs Auth'}
                    </Badge>
                  </div>
                  <span className="text-xs text-text-muted shrink-0">{server.toolCount} tools</span>
                </button>
              ))}
            </div>
          </section>

          {/* Team */}
          <section className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-warning" />
                <h3 className="text-sm font-semibold text-text-primary">Team</h3>
              </div>
              <Link to="/memory" className="text-xs text-accent hover:text-accent-hover flex items-center gap-1 transition-colors">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            <div className="space-y-1">
              {data.teamMembers.map(member => (
                <div key={member.name} className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
                  <span className="text-lg">{member.emoji}</span>
                  <div>
                    <div className="text-sm text-text-primary">{member.name}</div>
                    <div className="text-xs text-text-muted">{member.location}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Active Projects */}
          <section className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FolderOpen size={16} className="text-accent" />
                <h3 className="text-sm font-semibold text-text-primary">Projects</h3>
              </div>
              <Link to="/projects" className="text-xs text-accent hover:text-accent-hover flex items-center gap-1 transition-colors">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            <div className="space-y-1">
              {data.projects.map(project => (
                <button
                  key={project.id}
                  onClick={() => setDetail({
                    title: project.displayName,
                    subtitle: project.path,
                    content: (
                      <div className="space-y-3">
                        <p className="text-sm text-text-secondary">{project.memorySummary}</p>
                        <Badge variant={project.hasMemory ? 'success' : 'default'}>
                          {project.hasMemory ? 'Has Memory' : 'No Memory'}
                        </Badge>
                      </div>
                    ),
                  })}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-bg-surface-hover text-left transition-colors group"
                >
                  <div className="min-w-0">
                    <span className="text-sm text-text-primary group-hover:text-accent transition-colors">{project.displayName}</span>
                    <span className="text-xs text-text-muted ml-2 font-mono">{project.path.split('/').slice(-2).join('/')}</span>
                  </div>
                  <ArrowRight size={14} className="text-text-muted group-hover:text-accent transition-colors shrink-0" />
                </button>
              ))}
            </div>
          </section>

          {/* Hooks */}
          <section className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <GitFork size={16} className="text-success" />
                <h3 className="text-sm font-semibold text-text-primary">Hooks Pipeline</h3>
              </div>
              <Link to="/hooks" className="text-xs text-accent hover:text-accent-hover flex items-center gap-1 transition-colors">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            <div className="space-y-1">
              {data.hooks.map(hook => (
                <button
                  key={hook.event}
                  onClick={() => setDetail({
                    title: hook.event,
                    subtitle: hook.type,
                    content: (
                      <div className="space-y-3">
                        <p className="text-sm text-text-secondary">{hook.description}</p>
                        <div className="space-y-2">
                          <div className="flex justify-between py-2 border-b border-border/50">
                            <span className="text-xs text-text-muted">Type</span>
                            <Badge>{hook.type}</Badge>
                          </div>
                          <div className="flex justify-between py-2 border-b border-border/50">
                            <span className="text-xs text-text-muted">Timeout</span>
                            <span className="text-xs text-text-secondary">{hook.timeout}s</span>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Command</h4>
                          <div className="px-3 py-2 bg-bg-primary border border-border rounded-lg">
                            <code className="text-xs text-accent font-mono">{hook.command}</code>
                          </div>
                        </div>
                      </div>
                    ),
                  })}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-bg-surface-hover text-left transition-colors group"
                >
                  <div className="min-w-0">
                    <span className="text-sm text-text-primary group-hover:text-accent transition-colors">{hook.event}</span>
                    <span className="text-xs text-text-muted ml-2">{hook.timeout}s timeout</span>
                  </div>
                  <ArrowRight size={14} className="text-text-muted group-hover:text-accent transition-colors shrink-0" />
                </button>
              ))}
            </div>
          </section>

          {/* Scheduled Tasks */}
          <section className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CalendarClock size={16} className="text-info" />
                <h3 className="text-sm font-semibold text-text-primary">Scheduled Tasks</h3>
              </div>
              <Link to="/tasks" className="text-xs text-accent hover:text-accent-hover flex items-center gap-1 transition-colors">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            {data.scheduledTasks.length > 0 ? (
              <div className="space-y-1">
                {data.scheduledTasks.slice(0, 5).map(task => (
                  <div key={task.taskId} className="flex items-center justify-between px-3 py-2.5 rounded-xl">
                    <div className="min-w-0">
                      <span className="text-sm text-text-primary">{task.taskId}</span>
                      <span className="text-xs text-text-muted ml-2">{task.schedule}</span>
                    </div>
                    <Badge variant={task.enabled ? 'success' : 'default'}>
                      {task.enabled ? 'Active' : 'Paused'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-muted px-3 py-2">No scheduled tasks configured yet.</p>
            )}
          </section>
        </div>
      </div>

      <DetailPanel
        isOpen={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.title || ''}
        subtitle={detail?.subtitle}
      >
        {detail?.content}
      </DetailPanel>
    </>
  );
}
