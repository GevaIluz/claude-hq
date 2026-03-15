import { useState } from 'react';
import { ChevronDown, ChevronRight, FolderOpen, Bot, Zap, Plus, RefreshCw, Check, Users, Wrench, Lightbulb } from 'lucide-react';
import { useDraggable } from '../../hooks/useDragDrop';
import type { Agent, Skill, PlannerProject, Employee } from '../../types';

interface SourcePanelProps {
  agents: Agent[];
  skills: Skill[];
  jiraProjects: PlannerProject[];
  jiraLoading: boolean;
  jiraSynced: boolean;
  onSyncJira: () => void;
  onAddManualProject: (name: string, description: string) => void;
  addedProjectIds: Set<string>;
  isZoomed: boolean;
  employees: Employee[];
  onConfigureAgent: (agentId: string) => void;
}

// ─── Inline Add Project Form ──────────────────────────────

function InlineAddProjectForm({ onAdd, onCancel }: { onAdd: (name: string, desc: string) => void; onCancel: () => void }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  return (
    <div className="bg-bg-primary border border-accent/20 rounded-xl p-3 space-y-2 mt-2">
      <input
        autoFocus
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Project name"
        className="w-full px-3 py-2 bg-bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent/50"
      />
      <textarea
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder="Brief description (optional)"
        rows={2}
        className="w-full px-3 py-2 bg-bg-surface border border-border rounded-lg text-xs text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent/50 resize-none"
      />
      <div className="flex gap-2">
        <button
          onClick={() => { if (name.trim()) { onAdd(name.trim(), desc.trim()); } }}
          disabled={!name.trim()}
          className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-accent hover:bg-accent-hover rounded-lg transition-colors disabled:opacity-40"
        >
          Add Project
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-xs text-text-muted border border-border rounded-lg hover:bg-bg-surface-hover transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Draggable Items ──────────────────────────────

function DraggableProject({ project, added }: { project: { id: string; displayName: string; source: string }; added: boolean }) {
  const dragProps = useDraggable('project', { id: project.id, displayName: project.displayName, source: project.source });

  return (
    <div
      {...dragProps}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm cursor-grab active:cursor-grabbing transition-all
        ${added
          ? 'bg-bg-surface-hover/50 text-text-muted'
          : 'bg-bg-primary border border-border hover:border-accent/30 hover:shadow-sm text-text-secondary hover:text-text-primary'
        }`}
    >
      <FolderOpen size={16} className={added ? 'text-text-muted' : 'text-accent'} />
      <span className="flex-1">{project.displayName}</span>
      {added && <Check size={14} className="text-success" />}
      {project.source === 'jira' && (
        <span className="text-[10px] font-mono bg-info/10 text-info px-2 py-0.5 rounded">JIRA</span>
      )}
    </div>
  );
}

function DraggableEmployee({ employee, agentInfo }: { employee: Employee; agentInfo?: Agent }) {
  const dragProps = useDraggable('employee', {
    id: employee.id,
    name: employee.name,
    baseAgentId: employee.baseAgentId,
    skillIds: employee.skillIds,
    defaultPrompt: employee.defaultPrompt,
  });

  return (
    <div
      {...dragProps}
      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm bg-bg-primary border border-accent/20
        hover:border-accent/40 hover:shadow-sm text-text-primary cursor-grab active:cursor-grabbing transition-all"
    >
      <span className="text-lg">🤖</span>
      <div className="flex-1 min-w-0">
        <div className="font-medium">{employee.name}</div>
        <div className="text-[10px] text-text-muted">{agentInfo?.type || 'agent'} · {employee.skillIds.length} skills</div>
      </div>
      <span className="text-[10px] text-accent bg-accent/8 px-2 py-0.5 rounded-full">configured</span>
    </div>
  );
}

function DraggableAgent({ agent, expanded, onToggle, onConfigure }: {
  agent: Agent;
  expanded: boolean;
  onToggle: () => void;
  onConfigure: () => void;
}) {
  const dragProps = useDraggable('agent', { id: agent.id, name: agent.name });

  return (
    <div className="space-y-0">
      <div
        {...dragProps}
        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm bg-bg-primary border border-border
          hover:border-accent/30 hover:shadow-sm text-text-secondary hover:text-text-primary cursor-grab active:cursor-grabbing transition-all"
      >
        <span className="text-lg" style={{ filter: 'hue-rotate(-10deg) saturate(1.5)' }}>🤖</span>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-text-primary">{agent.name}</div>
          <div className="text-[10px] text-text-muted">{agent.type}</div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); onToggle(); }}
          onMouseDown={(e) => e.stopPropagation()}
          className="p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-accent/8 transition-colors"
          title="View details"
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>

      {/* Expanded agent info */}
      {expanded && (
        <div className="ml-4 mr-1 mt-1 mb-2 p-3 bg-bg-surface border border-border/60 rounded-xl space-y-2.5">
          <p className="text-xs text-text-secondary leading-relaxed">{agent.description}</p>

          {agent.tools.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">
                <Wrench size={10} /> Tools
              </div>
              <div className="flex flex-wrap gap-1">
                {agent.tools.slice(0, 6).map(tool => (
                  <span key={tool} className="text-[10px] bg-bg-surface-hover px-2 py-0.5 rounded text-text-muted">{tool}</span>
                ))}
                {agent.tools.length > 6 && (
                  <span className="text-[10px] text-text-muted">+{agent.tools.length - 6} more</span>
                )}
              </div>
            </div>
          )}

          {agent.useCases.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">
                <Lightbulb size={10} /> Use Cases
              </div>
              <ul className="space-y-0.5">
                {agent.useCases.slice(0, 3).map((uc, i) => (
                  <li key={i} className="text-[10px] text-text-muted">· {uc}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={onConfigure}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-accent border border-accent/20 rounded-lg hover:bg-accent/8 transition-colors"
          >
            <Users size={12} />
            Configure as Employee
          </button>
        </div>
      )}
    </div>
  );
}

function DraggableSkill({ skill }: { skill: Skill }) {
  const dragProps = useDraggable('skill', { id: skill.id, name: skill.name });

  return (
    <div
      {...dragProps}
      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm bg-bg-primary border border-border
        hover:border-accent/30 hover:shadow-sm text-text-secondary hover:text-text-primary cursor-grab active:cursor-grabbing transition-all"
    >
      <Zap size={14} className="text-accent" />
      <span className="flex-1">{skill.name}</span>
      <span className="text-[10px] text-text-muted">{skill.triggers.length} triggers</span>
    </div>
  );
}

// ─── Accordion ──────────────────────────────

function AccordionSection({ title, icon: Icon, count, defaultOpen, children }: {
  title: string;
  icon: React.ElementType;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? true);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-text-muted uppercase tracking-wider hover:text-text-secondary transition-colors"
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <Icon size={14} />
        <span>{title}</span>
        <span className="ml-auto text-xs font-normal">{count}</span>
      </button>
      {open && <div className="space-y-2 pb-4">{children}</div>}
    </div>
  );
}

// ─── Main Panel ──────────────────────────────

export function SourcePanel({
  agents, skills, jiraProjects, jiraLoading, jiraSynced,
  onSyncJira, onAddManualProject, addedProjectIds, isZoomed,
  employees, onConfigureAgent,
}: SourcePanelProps) {
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const allProjects = jiraProjects.map(p => ({ id: p.projectId, displayName: p.displayName, source: 'jira' }));

  return (
    <div className="w-80 shrink-0 bg-bg-surface border-r border-border overflow-y-auto">
      <div className="p-4 space-y-1">
        {/* Projects Section */}
        <AccordionSection title="Projects" icon={FolderOpen} count={allProjects.length} defaultOpen={!isZoomed}>
          {allProjects.map(p => (
            <DraggableProject key={p.id} project={p} added={addedProjectIds.has(p.id)} />
          ))}

          {showAddForm ? (
            <InlineAddProjectForm
              onAdd={(name, desc) => {
                onAddManualProject(name, desc);
                setShowAddForm(false);
              }}
              onCancel={() => setShowAddForm(false)}
            />
          ) : (
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setShowAddForm(true)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs text-accent border border-accent/20 rounded-xl hover:bg-accent/5 transition-colors"
              >
                <Plus size={12} /> Add Manual
              </button>
              <button
                onClick={onSyncJira}
                disabled={jiraLoading}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs text-info border border-info/20 rounded-xl hover:bg-info/5 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={12} className={jiraLoading ? 'animate-spin' : ''} />
                {jiraSynced ? 'Re-sync' : 'Sync Jira'}
              </button>
            </div>
          )}
        </AccordionSection>

        {/* Employees Section */}
        {employees.length > 0 && (
          <AccordionSection title="Employees" icon={Users} count={employees.length} defaultOpen>
            {employees.map(emp => (
              <DraggableEmployee
                key={emp.id}
                employee={emp}
                agentInfo={agents.find(a => a.id === emp.baseAgentId)}
              />
            ))}
          </AccordionSection>
        )}

        {/* Agents Section */}
        <AccordionSection title="Agents" icon={Bot} count={agents.length} defaultOpen={isZoomed}>
          {agents.map(a => (
            <DraggableAgent
              key={a.id}
              agent={a}
              expanded={expandedAgentId === a.id}
              onToggle={() => setExpandedAgentId(expandedAgentId === a.id ? null : a.id)}
              onConfigure={() => onConfigureAgent(a.id)}
            />
          ))}
        </AccordionSection>

        {/* Skills Section */}
        <AccordionSection title="Skills" icon={Zap} count={skills.length} defaultOpen={isZoomed}>
          {skills.map(s => (
            <DraggableSkill key={s.id} skill={s} />
          ))}
        </AccordionSection>
      </div>
    </div>
  );
}
