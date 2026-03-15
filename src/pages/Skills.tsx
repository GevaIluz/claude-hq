import { useOutletContext } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import * as Icons from 'lucide-react';
import type { OrgData, Skill } from '../types';
import { Badge } from '../components/shared/Badge';
import { DetailPanel } from '../components/shared/DetailPanel';
import { MarkdownRenderer } from '../components/shared/MarkdownRenderer';
import { useSkillSets, type SkillSet } from '../hooks/useSkillSets';

// ─── Icon Resolver ───────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  Cloud: Icons.Cloud,
  Server: Icons.Server,
  Activity: Icons.Activity,
  FlaskConical: Icons.FlaskConical,
  Sun: Icons.Sun,
  Hammer: Icons.Hammer,
  BarChart3: Icons.BarChart3,
  Play: Icons.Play,
  Wand2: Icons.Wand2,
  ArrowUpDown: Icons.ArrowUpDown,
  Terminal: Icons.Terminal,
  Network: Icons.Network,
  Trash2: Icons.Trash2,
  Heart: Icons.Heart,
  Zap: Icons.Zap,
  FolderOpen: Icons.FolderOpen,
  Inbox: Icons.Inbox,
  Layers: Icons.Layers,
  Shield: Icons.Shield,
  Wrench: Icons.Wrench,
  Globe: Icons.Globe,
  Database: Icons.Database,
  Code: Icons.Code,
  Cpu: Icons.Cpu,
  Sparkles: Icons.Sparkles,
};

function resolveIcon(name: string): React.ElementType {
  return ICON_MAP[name] || Icons.Zap;
}

// ─── Color Palette ───────────────────────────────────────────

const COLOR_PALETTE = [
  '#f59e0b', '#0078d4', '#22c55e', '#ec4899', '#8b5cf6',
  '#06b6d4', '#f97316', '#ef4444', '#6366f1', '#14b8a6',
  '#a855f7', '#d946ef', '#6b7280',
];

// ─── Skill Card ──────────────────────────────────────────────

function SkillCard({
  skill,
  sets,
  onSelect,
  onMove,
}: {
  skill: Skill;
  sets: SkillSet[];
  onSelect: () => void;
  onMove: (skillId: string, toSetId: string) => void;
}) {
  const Icon = resolveIcon(skill.icon);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const moveRef = useRef<HTMLDivElement>(null);

  // Close move menu on click outside
  useEffect(() => {
    if (!showMoveMenu) return;
    const handler = (e: MouseEvent) => {
      if (moveRef.current && !moveRef.current.contains(e.target as Node)) {
        setShowMoveMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMoveMenu]);

  return (
    <div className="glass-card rounded-2xl p-5 text-left card-glow group relative">
      {/* Move-to-bundle button */}
      <div ref={moveRef} className="absolute top-3 right-3 z-10">
        <button
          onClick={(e) => { e.stopPropagation(); setShowMoveMenu(!showMoveMenu); }}
          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-bg-surface-hover text-text-muted hover:text-text-primary transition-all"
          title="Move to skill set"
        >
          <Icons.ArrowRightLeft size={13} />
        </button>
        {showMoveMenu && (
          <div className="absolute right-0 top-8 w-44 bg-bg-surface border border-border rounded-xl shadow-lg py-1 z-50">
            <div className="px-3 py-1.5 text-[10px] font-semibold text-text-muted uppercase tracking-wider">Move to</div>
            {sets.map(b => (
              <button
                key={b.id}
                onClick={(e) => { e.stopPropagation(); onMove(skill.id, b.id); setShowMoveMenu(false); }}
                className="w-full text-left px-3 py-2 text-xs text-text-secondary hover:bg-bg-surface-hover hover:text-text-primary flex items-center gap-2 transition-colors"
              >
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
                {b.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <button onClick={onSelect} className="w-full text-left">
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${skill.color}12` }}
          >
            <Icon size={20} style={{ color: skill.color }} />
          </div>
          <div className="min-w-0 pr-6">
            <h3 className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">
              {skill.name}
            </h3>
            <p className="text-xs text-text-secondary mt-1.5 line-clamp-2">{skill.description}</p>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <Badge variant="accent">{skill.triggers.length} triggers</Badge>
              {skill.hasReferences && <Badge variant="info">{skill.referenceFiles.length} refs</Badge>}
              {skill.capabilities && <Badge variant="success">{skill.capabilities.length} capabilities</Badge>}
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}

// ─── Skill Set Header ────────────────────────────────────────

function SkillSetHeader({
  skillSet,
  count,
  expanded,
  onToggle,
  onRename,
  onDelete,
  onColorChange,
}: {
  skillSet: SkillSet;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  onRename: (label: string) => void;
  onDelete: () => void;
  onColorChange: (color: string) => void;
}) {
  const Icon = resolveIcon(skillSet.icon);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(skillSet.label);
  const [showMenu, setShowMenu] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  // Close menu on click outside
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
        setShowColors(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  function commitRename() {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== skillSet.label) onRename(trimmed);
    setEditing(false);
  }

  return (
    <div className="flex items-center gap-3 py-3 px-1 group">
      <button onClick={onToggle} className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${skillSet.color}15` }}
        >
          <Icon size={16} style={{ color: skillSet.color }} />
        </div>

        {editing ? (
          <input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename();
              if (e.key === 'Escape') { setEditValue(skillSet.label); setEditing(false); }
            }}
            onClick={(e) => e.stopPropagation()}
            className="text-sm font-semibold text-text-primary bg-transparent border-b border-accent outline-none py-0"
          />
        ) : (
          <h2 className="text-sm font-semibold text-text-primary">{skillSet.label}</h2>
        )}

        <span className="text-xs text-text-muted bg-bg-surface-hover px-2 py-0.5 rounded-full">{count}</span>
        <div className="flex-1" />
        <Icons.ChevronDown
          size={16}
          className={`text-text-muted transition-transform duration-200 ${expanded ? '' : '-rotate-90'}`}
        />
      </button>

      {/* Actions menu */}
      <div ref={menuRef} className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-bg-surface-hover text-text-muted hover:text-text-primary transition-all"
        >
          <Icons.MoreHorizontal size={14} />
        </button>

        {showMenu && (
          <div className="absolute right-0 top-8 w-40 bg-bg-surface border border-border rounded-xl shadow-lg py-1 z-50">
            <button
              onClick={() => { setShowMenu(false); setEditValue(skillSet.label); setEditing(true); }}
              className="w-full text-left px-3 py-2 text-xs text-text-secondary hover:bg-bg-surface-hover hover:text-text-primary flex items-center gap-2"
            >
              <Icons.Pencil size={12} /> Rename
            </button>
            <button
              onClick={() => setShowColors(!showColors)}
              className="w-full text-left px-3 py-2 text-xs text-text-secondary hover:bg-bg-surface-hover hover:text-text-primary flex items-center gap-2"
            >
              <Icons.Palette size={12} /> Color
            </button>
            {showColors && (
              <div className="flex flex-wrap gap-1.5 px-3 py-2 border-t border-border">
                {COLOR_PALETTE.map(c => (
                  <button
                    key={c}
                    onClick={() => { onColorChange(c); setShowColors(false); setShowMenu(false); }}
                    className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
                    style={{ backgroundColor: c, borderColor: c === skillSet.color ? 'white' : 'transparent' }}
                  />
                ))}
              </div>
            )}
            <button
              onClick={() => { setShowMenu(false); onDelete(); }}
              className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2"
            >
              <Icons.Trash2 size={12} /> Delete skill set
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────

export function Skills() {
  const data = useOutletContext<OrgData>();
  const [selected, setSelected] = useState<Skill | null>(null);
  const [viewMode, setViewMode] = useState<'sets' | 'flat'>('sets');
  const [collapsedSets, setCollapsedSets] = useState<Set<string>>(new Set());

  const {
    sets,
    createSet,
    renameSet,
    deleteSet,
    setColor,
    moveSkill,
    ungroupedSkills,
    getSkillsForSet,
    resetToDefaults,
  } = useSkillSets(data.skills);

  function toggleSet(id: string) {
    setCollapsedSets(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-text-secondary">
            Custom workflows that Claude triggers based on keywords in your requests.
          </p>
          <div className="flex items-center gap-2 shrink-0 ml-4">
            {/* View toggle */}
            <div className="flex items-center bg-bg-surface border border-border rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('sets')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  viewMode === 'sets' ? 'bg-accent text-white' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Icons.FolderOpen size={12} />
                  Skill Sets
                </span>
              </button>
              <button
                onClick={() => setViewMode('flat')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  viewMode === 'flat' ? 'bg-accent text-white' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Icons.LayoutGrid size={12} />
                  All
                </span>
              </button>
            </div>
          </div>
        </div>

        {viewMode === 'flat' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {data.skills.map(skill => (
              <SkillCard key={skill.id} skill={skill} sets={sets} onSelect={() => setSelected(skill)} onMove={moveSkill} />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {sets.map(skillSet => {
              const skills = getSkillsForSet(skillSet.id);
              // Hide empty auto-generated sets, but show empty custom ones
              if (skills.length === 0 && !skillSet.id.startsWith('custom-')) return null;
              const expanded = !collapsedSets.has(skillSet.id);

              return (
                <div key={skillSet.id}>
                  <SkillSetHeader
                    skillSet={skillSet}
                    count={skills.length}
                    expanded={expanded}
                    onToggle={() => toggleSet(skillSet.id)}
                    onRename={(label) => renameSet(skillSet.id, label)}
                    onDelete={() => deleteSet(skillSet.id)}
                    onColorChange={(color) => setColor(skillSet.id, color)}
                  />
                  {expanded && skills.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-4 pl-1">
                      {skills.map(skill => (
                        <SkillCard key={skill.id} skill={skill} sets={sets} onSelect={() => setSelected(skill)} onMove={moveSkill} />
                      ))}
                    </div>
                  )}
                  {expanded && skills.length === 0 && (
                    <p className="text-xs text-text-muted pl-12 pb-4">No skills yet — move skills here from other skill sets</p>
                  )}
                </div>
              );
            })}

            {/* Ungrouped skills (not in any skill set) */}
            {ungroupedSkills.length > 0 && (
              <div>
                <SkillSetHeader
                  skillSet={{ id: '__orphaned', label: 'Ungrouped', icon: 'Inbox', color: '#6b7280', skillIds: [] }}
                  count={ungroupedSkills.length}
                  expanded={!collapsedSets.has('__orphaned')}
                  onToggle={() => toggleSet('__orphaned')}
                  onRename={() => {}}
                  onDelete={() => {}}
                  onColorChange={() => {}}
                />
                {!collapsedSets.has('__orphaned') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-4 pl-1">
                    {ungroupedSkills.map(skill => (
                      <SkillCard key={skill.id} skill={skill} sets={sets} onSelect={() => setSelected(skill)} onMove={moveSkill} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Skill set actions bar */}
            <div className="flex items-center gap-3 pt-2 border-t border-border/50">
              <button
                onClick={() => createSet('New Skill Set')}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-accent hover:bg-accent/8 rounded-lg transition-colors"
              >
                <Icons.Plus size={14} />
                New Skill Set
              </button>
              <button
                onClick={resetToDefaults}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-text-muted hover:text-text-primary hover:bg-bg-surface-hover rounded-lg transition-colors"
              >
                <Icons.RotateCcw size={12} />
                Reset to defaults
              </button>
            </div>
          </div>
        )}
      </div>

      <DetailPanel
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name || ''}
        subtitle={selected?.id}
      >
        {selected && (
          <div className="space-y-6">
            {/* Open File Button */}
            <button
              onClick={() => {
                const path = `~/.claude/skills/${selected.id}/SKILL.md`;
                navigator.clipboard.writeText(path);
              }}
              className="w-full flex items-center gap-2 px-3.5 py-2.5 bg-accent/8 border border-accent/20 rounded-xl text-xs text-accent hover:bg-accent/15 transition-colors group"
            >
              <Icons.FileText size={14} />
              <span className="font-mono flex-1 text-left truncate">~/.claude/skills/{selected.id}/SKILL.md</span>
              <Icons.ExternalLink size={12} className="shrink-0 opacity-60 group-hover:opacity-100" />
            </button>

            {/* Triggers */}
            <div>
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                <span className="flex items-center gap-1.5"><Icons.Zap size={12} /> Triggers</span>
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {selected.triggers.map((t, i) => (
                  <span key={i} className="px-2.5 py-1.5 bg-bg-primary border border-border rounded-xl text-xs text-text-secondary font-mono">
                    &quot;{t}&quot;
                  </span>
                ))}
              </div>
            </div>

            {/* Knowledge */}
            {selected.knowledge && selected.knowledge.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                  <span className="flex items-center gap-1.5"><Icons.Brain size={12} /> Knowledge</span>
                </h4>
                <div className="space-y-1.5">
                  {selected.knowledge.map((k, i) => (
                    <div key={i} className="flex items-start gap-2.5 px-3.5 py-2.5 bg-bg-primary border border-border rounded-xl">
                      <Icons.BookOpen size={13} className="text-info shrink-0 mt-0.5" />
                      <span className="text-xs text-text-secondary leading-relaxed">{k}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Capabilities */}
            {selected.capabilities && selected.capabilities.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                  <span className="flex items-center gap-1.5"><Icons.Sparkles size={12} /> Capabilities</span>
                </h4>
                <div className="space-y-1.5">
                  {selected.capabilities.map((c, i) => (
                    <div key={i} className="flex items-start gap-2.5 px-3.5 py-2.5 bg-bg-primary border border-border rounded-xl">
                      <Icons.CheckCircle2 size={13} className="text-success shrink-0 mt-0.5" />
                      <span className="text-xs text-text-secondary leading-relaxed">{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Required Tools */}
            {selected.requiredTools && selected.requiredTools.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                  <span className="flex items-center gap-1.5"><Icons.Wrench size={12} /> Required Tools</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selected.requiredTools.map((tool, i) => (
                    <span key={i} className="px-2.5 py-1.5 bg-accent/8 border border-accent/15 rounded-xl text-xs text-accent font-mono">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Workflow */}
            {selected.workflow && selected.workflow.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                  <span className="flex items-center gap-1.5"><Icons.ListOrdered size={12} /> Workflow</span>
                </h4>
                <div className="space-y-0">
                  {selected.workflow.map((step, i) => (
                    <div key={i} className="flex items-start gap-3 relative">
                      {i < (selected.workflow?.length ?? 0) - 1 && (
                        <div className="absolute left-[11px] top-7 w-px h-[calc(100%-4px)] bg-border" />
                      )}
                      <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5 z-10">
                        <span className="text-[10px] font-mono text-accent font-bold">{i + 1}</span>
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed pb-3">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reference Files */}
            {selected.referenceFiles.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                  <span className="flex items-center gap-1.5"><Icons.FileText size={12} /> References</span>
                </h4>
                <div className="space-y-1.5">
                  {selected.referenceFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 px-3.5 py-2 bg-bg-primary border border-border rounded-xl">
                      <Icons.FileText size={14} className="text-text-muted" />
                      <span className="text-xs text-text-secondary font-mono">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Raw Details */}
            <div>
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                <span className="flex items-center gap-1.5"><Icons.FileCode size={12} /> Raw Details</span>
              </h4>
              <MarkdownRenderer content={selected.content} />
            </div>
          </div>
        )}
      </DetailPanel>
    </>
  );
}
