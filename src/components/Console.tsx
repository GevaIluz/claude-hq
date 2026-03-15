import { useState, useRef, useEffect } from 'react';
import { Send, ChevronUp, ChevronDown, Bot, User } from 'lucide-react';
import type { OrgData } from '../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ConsoleProps {
  data: OrgData;
}

function generateResponse(input: string, data: OrgData): string {
  const q = input.toLowerCase().trim();

  if (q === '' || q === 'help' || q === 'hi' || q === 'hello') {
    return `Welcome to Claude HQ! I can help you explore your organization.\n\nTry asking:\n- "what skills do I have?"\n- "show me my MCP servers"\n- "tell me about the aws skill"\n- "who's on my team?"\n- "what plugins are enabled?"\n- "how many permissions do I have?"`;
  }

  if (q.includes('skill')) {
    if (q.includes('how many') || q.includes('count') || q.includes('list') || q.includes('what')) {
      return `You have ${data.skills.length} skills:\n${data.skills.map(s => `  - ${s.name}: ${s.description.slice(0, 80)}...`).join('\n')}`;
    }
    const skill = data.skills.find(s =>
      q.includes(s.id) || q.includes(s.name.toLowerCase())
    );
    if (skill) {
      return `**${skill.name}**\n${skill.description}\n\nTriggers: ${skill.triggers.join(', ')}\nReferences: ${skill.referenceFiles.length > 0 ? skill.referenceFiles.join(', ') : 'None'}`;
    }
  }

  if (q.includes('plugin')) {
    const enabled = data.plugins.filter(p => p.enabled);
    return `You have ${enabled.length} enabled plugins:\n${enabled.map(p => `  - ${p.shortName}: ${p.description}`).join('\n')}`;
  }

  if (q.includes('mcp') || q.includes('server')) {
    const custom = data.mcpServers.filter(m => m.type === 'custom');
    const external = data.mcpServers.filter(m => m.type === 'external');
    return `You have ${data.mcpServers.length} MCP servers:\n\nCustom (${custom.length}):\n${custom.map(m => `  - ${m.name} (${m.toolCount} tools) - ${m.authStatus}`).join('\n')}\n\nExternal (${external.length}):\n${external.map(m => `  - ${m.name} - ${m.authStatus}`).join('\n')}`;
  }

  if (q.includes('team') || q.includes('member') || q.includes('who')) {
    return `Your team (${data.teamMembers.length} members):\n${data.teamMembers.map(m => `  ${m.emoji} ${m.name} - ${m.location}`).join('\n')}`;
  }

  if (q.includes('permission') || q.includes('perm')) {
    const total = data.permissions.reduce((sum, g) => sum + g.permissions.length, 0);
    return `You have ${total} whitelisted permissions across ${data.permissions.length} categories:\n${data.permissions.map(g => `  - ${g.category}: ${g.permissions.length} permissions`).join('\n')}`;
  }

  if (q.includes('agent')) {
    if (q.includes('how many') || q.includes('count') || q.includes('list') || q.includes('what')) {
      return `You have ${data.agents.length} agent types:\n${data.agents.map(a => `  - ${a.name} (${a.type}): ${a.description.slice(0, 80)}...`).join('\n')}`;
    }
    const agent = data.agents.find(a =>
      q.includes(a.id) || q.includes(a.name.toLowerCase())
    );
    if (agent) {
      return `**${agent.name}** (${agent.type})\n${agent.description}\n\nTools: ${agent.tools.join(', ')}\nUse cases: ${agent.useCases.join(', ')}`;
    }
    return `You have ${data.agents.length} agent types. Try asking about a specific one like "tell me about the explore agent".`;
  }

  if (q.includes('hook')) {
    return `You have ${data.hooks.length} lifecycle hooks (via Hookify):\n${data.hooks.map(h => `  - ${h.event}: ${h.description}`).join('\n')}`;
  }

  if (q.includes('project')) {
    return `You have ${data.projects.length} projects:\n${data.projects.map(p => `  - ${p.displayName}: ${p.memorySummary.slice(0, 100)}...`).join('\n')}`;
  }

  if (q.includes('task') || q.includes('schedule')) {
    return data.scheduledTasks.length > 0
      ? `You have ${data.scheduledTasks.length} scheduled tasks:\n${data.scheduledTasks.map(t => `  - ${t.taskId}: ${t.description}`).join('\n')}`
      : 'No scheduled tasks configured yet. You can create one through Claude Code.';
  }

  if (q.includes('status') || q.includes('overview') || q.includes('summary')) {
    const total = data.permissions.reduce((sum, g) => sum + g.permissions.length, 0);
    return `Organization Summary:\n  - ${data.skills.length} Skills\n  - ${data.plugins.length} Plugins\n  - ${data.mcpServers.length} MCP Servers (${data.mcpServers.filter(m => m.authStatus === 'connected').length} connected)\n  - ${data.agents.length} Agents\n  - ${data.hooks.length} Hooks\n  - ${total} Permissions\n  - ${data.projects.length} Projects\n  - ${data.teamMembers.length} Team Members`;
  }

  return `I'm not sure what you're asking about. Try asking about skills, plugins, MCP servers, team, permissions, hooks, projects, or tasks.`;
}

export function Console({ data }: ConsoleProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Welcome to Claude HQ! Ask me anything about your organization — skills, plugins, MCPs, team, and more.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [height, setHeight] = useState(220);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: Message = { role: 'user', content: input.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // Simulate typing delay
    setTimeout(() => {
      const response = generateResponse(input.trim(), data);
      const assistantMsg: Message = { role: 'assistant', content: response, timestamp: new Date() };
      setMessages(prev => [...prev, assistantMsg]);
    }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDragStart = (e: React.MouseEvent) => {
    isDragging.current = true;
    startY.current = e.clientY;
    startHeight.current = height;
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
  };

  const handleDragMove = (e: MouseEvent) => {
    if (!isDragging.current) return;
    const diff = startY.current - e.clientY;
    setHeight(Math.max(120, Math.min(500, startHeight.current + diff)));
  };

  const handleDragEnd = () => {
    isDragging.current = false;
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
  };

  return (
    <div
      className="bg-bg-surface border-t border-border flex flex-col shrink-0"
      style={{ height: isExpanded ? height : 40 }}
    >
      {/* Drag handle + toggle */}
      <div
        className="h-10 flex items-center justify-between px-4 cursor-ns-resize select-none shrink-0"
        onMouseDown={isExpanded ? handleDragStart : undefined}
      >
        <div className="flex items-center gap-2">
          <Bot size={14} className="text-accent" />
          <span className="text-xs font-medium text-text-secondary">Console</span>
          <span className="text-[10px] text-text-muted">({messages.length - 1} messages)</span>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-bg-surface-hover rounded transition-colors"
        >
          {isExpanded ? <ChevronDown size={14} className="text-text-muted" /> : <ChevronUp size={14} className="text-text-muted" />}
        </button>
      </div>

      {isExpanded && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-accent/15 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot size={12} className="text-accent" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-accent text-white rounded-br-md'
                      : 'bg-bg-primary text-text-secondary border border-border rounded-bl-md'
                  }`}
                >
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-bg-surface-hover flex items-center justify-center shrink-0 mt-0.5">
                    <User size={12} className="text-text-secondary" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-2.5 shrink-0">
            <div className="flex items-center gap-2 bg-bg-primary border border-border rounded-2xl px-3.5 py-2 focus-within:border-accent/30 focus-within:shadow-[0_0_12px_rgba(226,123,88,0.06)] transition-all">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your organization..."
                className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="p-1.5 rounded-lg hover:bg-bg-surface-hover text-text-muted hover:text-accent disabled:opacity-30 transition-all"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
