import { Trash2, X, Zap } from 'lucide-react';
import { useDropZone, type DragItemType } from '../../hooks/useDragDrop';
import { usePlanner } from '../../context/PlannerContext';
import type { PlannerAgent, OrgData, Employee } from '../../types';

interface AgentSlotProps {
  agent: PlannerAgent;
  projectInstanceId: string;
  orgData: OrgData;
  otherAgents: PlannerAgent[];
  employees: Employee[];
}

export function AgentSlot({ agent, projectInstanceId, orgData, otherAgents, employees }: AgentSlotProps) {
  const { dispatch } = usePlanner();
  const agentInfo = orgData.agents.find(a => a.id === agent.agentId);
  const employeeInfo = agent.employeeId ? employees.find(e => e.id === agent.employeeId) : null;

  const { isOver, dropZoneProps } = useDropZone(['skill'], (_type: DragItemType, data: Record<string, unknown>) => {
    dispatch({
      type: 'ADD_SKILL_TO_AGENT',
      projectInstanceId,
      agentInstanceId: agent.instanceId,
      skillId: data.id as string,
    });
  });

  const displayName = employeeInfo?.name || agentInfo?.name || agent.agentId;

  return (
    <div
      {...dropZoneProps}
      className={`bg-bg-primary border rounded-xl p-5 transition-all duration-200
        ${isOver ? 'border-accent/50 ring-2 ring-accent/20 bg-accent/5' : 'border-border'}`}
    >
      {/* Agent header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xl">🤖</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-base font-semibold text-text-primary">{displayName}</h4>
            {employeeInfo && (
              <span className="text-[10px] text-accent bg-accent/8 px-2 py-0.5 rounded-full">employee</span>
            )}
          </div>
          <p className="text-xs text-text-muted">{agentInfo?.type}</p>
        </div>
        <button
          onClick={() => dispatch({ type: 'REMOVE_AGENT', projectInstanceId, agentInstanceId: agent.instanceId })}
          className="p-2 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Skills */}
      <div className="mb-4">
        <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Skills</div>
        <div className="flex flex-wrap gap-2">
          {agent.skillIds.map(skillId => {
            const skill = orgData.skills.find(s => s.id === skillId);
            return (
              <span
                key={skillId}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-accent/8 border border-accent/15 rounded-lg text-xs text-accent"
              >
                <Zap size={10} />
                {skill?.name || skillId}
                <button
                  onClick={() => dispatch({
                    type: 'REMOVE_SKILL_FROM_AGENT',
                    projectInstanceId,
                    agentInstanceId: agent.instanceId,
                    skillId,
                  })}
                  className="ml-0.5 hover:text-error transition-colors"
                >
                  <X size={10} />
                </button>
              </span>
            );
          })}
          {agent.skillIds.length === 0 && (
            <span className="text-xs text-text-muted italic">Drag skills here to assign them</span>
          )}
        </div>
      </div>

      {/* Prompt */}
      <div className="mb-4">
        <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Instructions</div>
        <textarea
          value={agent.prompt}
          onChange={(e) => dispatch({
            type: 'UPDATE_AGENT_PROMPT',
            projectInstanceId,
            agentInstanceId: agent.instanceId,
            prompt: e.target.value,
          })}
          placeholder="What should this agent do? Be specific about tasks, priorities, and expected outcomes..."
          rows={4}
          className="w-full px-3.5 py-2.5 bg-bg-surface border border-border rounded-xl text-sm text-text-primary
            placeholder:text-text-muted/50 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20
            resize-y transition-all leading-relaxed"
        />
      </div>

      {/* Cooperation */}
      {otherAgents.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Cooperate with</div>
          <div className="flex flex-wrap gap-2">
            {otherAgents.map(other => {
              const otherEmp = other.employeeId ? employees.find(e => e.id === other.employeeId) : null;
              const otherInfo = orgData.agents.find(a => a.id === other.agentId);
              const isSelected = agent.cooperateWith.includes(other.instanceId);
              return (
                <button
                  key={other.instanceId}
                  onClick={() => {
                    const newList = isSelected
                      ? agent.cooperateWith.filter(id => id !== other.instanceId)
                      : [...agent.cooperateWith, other.instanceId];
                    dispatch({
                      type: 'SET_COOPERATE_WITH',
                      projectInstanceId,
                      agentInstanceId: agent.instanceId,
                      cooperateWith: newList,
                    });
                  }}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-colors
                    ${isSelected
                      ? 'bg-info/10 border-info/30 text-info'
                      : 'bg-bg-surface border-border text-text-muted hover:border-info/30'
                    }`}
                >
                  🤖 {otherEmp?.name || otherInfo?.name || other.agentId}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Skill drop indicator */}
      {isOver && (
        <div className="mt-3 py-2.5 border-2 border-dashed border-accent/40 rounded-xl text-center">
          <span className="text-xs text-accent font-medium">Drop skill here</span>
        </div>
      )}
    </div>
  );
}
