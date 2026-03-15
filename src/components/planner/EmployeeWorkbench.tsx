import { useState, useEffect } from 'react';
import { Bot, X, Zap, Save, Trash2, Edit3, Users } from 'lucide-react';
import { useDropZone, type DragItemType } from '../../hooks/useDragDrop';
import { usePlanner } from '../../context/PlannerContext';
import type { OrgData, Employee, Agent } from '../../types';

interface EmployeeWorkbenchProps {
  orgData: OrgData;
  employees: Employee[];
  onSaveEmployee: (employee: Employee) => void;
  onUpdateEmployee: (id: string, updates: Partial<Employee>) => void;
  onDeleteEmployee: (id: string) => void;
}

interface WorkbenchDraft {
  baseAgentId: string;
  name: string;
  skillIds: string[];
  defaultPrompt: string;
}

function EmployeeCard({ employee, agentInfo, onEdit, onDelete }: {
  employee: Employee;
  agentInfo?: Agent;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="glass-card rounded-xl p-5 card-glow group">
      <div className="flex items-start gap-3">
        <span className="text-2xl mt-0.5">🤖</span>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-text-primary">{employee.name}</h4>
          <p className="text-xs text-text-muted mt-0.5">Based on: {agentInfo?.name || employee.baseAgentId}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[10px] text-accent bg-accent/8 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Zap size={9} /> {employee.skillIds.length} skills
            </span>
            {employee.defaultPrompt && (
              <span className="text-[10px] text-text-muted">Has instructions</span>
            )}
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-accent/8 transition-colors"
          >
            <Edit3 size={13} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function EmployeeWorkbench({ orgData, employees, onSaveEmployee, onUpdateEmployee, onDeleteEmployee }: EmployeeWorkbenchProps) {
  const { state, dispatch } = usePlanner();
  const [draft, setDraft] = useState<WorkbenchDraft | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Auto-populate from "Configure as Employee" button in source panel
  useEffect(() => {
    if (state.workbenchAgentId && !draft) {
      const agentInfo = orgData.agents.find(a => a.id === state.workbenchAgentId);
      if (agentInfo) {
        setDraft({
          baseAgentId: agentInfo.id,
          name: `${agentInfo.name} (Custom)`,
          skillIds: [],
          defaultPrompt: '',
        });
      }
      dispatch({ type: 'SET_WORKBENCH_AGENT', agentId: null });
    }
  }, [state.workbenchAgentId]);

  // Drop zone to accept a base agent
  const { isOver: isAgentOver, dropZoneProps: agentDropProps } = useDropZone(['agent'], (_type: DragItemType, data: Record<string, unknown>) => {
    const agentInfo = orgData.agents.find(a => a.id === data.id);
    setDraft({
      baseAgentId: data.id as string,
      name: agentInfo?.name ? `${agentInfo.name} (Custom)` : 'New Employee',
      skillIds: [],
      defaultPrompt: '',
    });
    setEditingId(null);
  });

  // Drop zone to accept skills onto the draft
  const { isOver: isSkillOver, dropZoneProps: skillDropProps } = useDropZone(['skill'], (_type: DragItemType, data: Record<string, unknown>) => {
    if (!draft) return;
    const skillId = data.id as string;
    if (!draft.skillIds.includes(skillId)) {
      setDraft({ ...draft, skillIds: [...draft.skillIds, skillId] });
    }
  });

  const baseAgent = draft ? orgData.agents.find(a => a.id === draft.baseAgentId) : null;

  const handleSave = () => {
    if (!draft || !draft.name.trim()) return;

    if (editingId) {
      onUpdateEmployee(editingId, {
        name: draft.name,
        skillIds: draft.skillIds,
        defaultPrompt: draft.defaultPrompt,
      });
    } else {
      const employee: Employee = {
        id: crypto.randomUUID(),
        name: draft.name,
        baseAgentId: draft.baseAgentId,
        skillIds: draft.skillIds,
        defaultPrompt: draft.defaultPrompt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onSaveEmployee(employee);
    }

    setDraft(null);
    setEditingId(null);
  };

  const handleEdit = (emp: Employee) => {
    setDraft({
      baseAgentId: emp.baseAgentId,
      name: emp.name,
      skillIds: [...emp.skillIds],
      defaultPrompt: emp.defaultPrompt,
    });
    setEditingId(emp.id);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Left: Configuration area (3 cols) */}
          <div className="lg:col-span-3 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-text-primary mb-1">Employee Workbench</h2>
              <p className="text-sm text-text-muted">Configure agents with skills and instructions, then save as reusable employees.</p>
            </div>

            {!draft ? (
              /* Drop zone for base agent */
              <div
                {...agentDropProps}
                className={`rounded-2xl border-2 border-dashed p-12 flex flex-col items-center justify-center gap-4 transition-all duration-200
                  ${isAgentOver ? 'border-accent/50 bg-accent/5 scale-[1.01]' : 'border-border/40'}`}
              >
                <div className="w-16 h-16 rounded-2xl bg-accent/8 flex items-center justify-center">
                  <Bot size={32} className="text-accent/60" />
                </div>
                <div className="text-center">
                  <h3 className="text-base font-semibold text-text-primary mb-1">Drag an agent here</h3>
                  <p className="text-sm text-text-muted">Start by dropping a base agent from the sidebar to configure it</p>
                </div>
              </div>
            ) : (
              /* Configuration form */
              <div className="space-y-5">
                {/* Base agent info */}
                <div className="flex items-center gap-3 p-4 bg-bg-surface border border-border rounded-xl">
                  <span className="text-2xl">🤖</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-text-primary">{baseAgent?.name || draft.baseAgentId}</div>
                    <div className="text-xs text-text-muted">{baseAgent?.type} · {baseAgent?.description?.slice(0, 80)}...</div>
                  </div>
                  <button
                    onClick={() => { setDraft(null); setEditingId(null); }}
                    className="p-2 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Custom name */}
                <div>
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 block">Employee Name</label>
                  <input
                    type="text"
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    placeholder="e.g. DevOps Lead, Test Runner"
                    className="w-full px-4 py-3 bg-bg-primary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20"
                  />
                </div>

                {/* Skills drop zone */}
                <div>
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 block">Assigned Skills</label>
                  <div
                    {...skillDropProps}
                    className={`min-h-[60px] p-3 bg-bg-primary border rounded-xl transition-all
                      ${isSkillOver ? 'border-accent/50 bg-accent/5' : 'border-border'}`}
                  >
                    {draft.skillIds.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {draft.skillIds.map(skillId => {
                          const skill = orgData.skills.find(s => s.id === skillId);
                          return (
                            <span key={skillId} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent/8 border border-accent/15 rounded-lg text-xs text-accent">
                              <Zap size={10} />
                              {skill?.name || skillId}
                              <button
                                onClick={() => setDraft({ ...draft, skillIds: draft.skillIds.filter(s => s !== skillId) })}
                                className="ml-0.5 hover:text-error transition-colors"
                              >
                                <X size={10} />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-text-muted italic text-center py-2">
                        {isSkillOver ? 'Drop skill here' : 'Drag skills from the sidebar to assign them'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Default instructions */}
                <div>
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 block">Default Instructions</label>
                  <textarea
                    value={draft.defaultPrompt}
                    onChange={(e) => setDraft({ ...draft, defaultPrompt: e.target.value })}
                    placeholder="Default instructions for this employee. Can be customized per-project later..."
                    rows={5}
                    className="w-full px-4 py-3 bg-bg-primary border border-border rounded-xl text-sm text-text-primary
                      placeholder:text-text-muted/50 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20
                      resize-y leading-relaxed"
                  />
                </div>

                {/* Save button */}
                <button
                  onClick={handleSave}
                  disabled={!draft.name.trim()}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium text-white bg-accent hover:bg-accent-hover
                    rounded-xl transition-colors disabled:opacity-40"
                >
                  <Save size={16} />
                  {editingId ? 'Update Employee' : 'Save Employee'}
                </button>
              </div>
            )}
          </div>

          {/* Right: Saved employees gallery (2 cols) */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Users size={16} className="text-accent" />
              <h3 className="text-sm font-semibold text-text-primary">Saved Employees</h3>
              <span className="text-xs text-text-muted">({employees.length})</span>
            </div>

            {employees.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/40 p-8 text-center">
                <p className="text-sm text-text-muted">No employees yet</p>
                <p className="text-xs text-text-muted mt-1">Configure an agent above to create your first employee</p>
              </div>
            ) : (
              <div className="space-y-3">
                {employees.map(emp => (
                  <EmployeeCard
                    key={emp.id}
                    employee={emp}
                    agentInfo={orgData.agents.find(a => a.id === emp.baseAgentId)}
                    onEdit={() => handleEdit(emp)}
                    onDelete={() => onDeleteEmployee(emp.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
