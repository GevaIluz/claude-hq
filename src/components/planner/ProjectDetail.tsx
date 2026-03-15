import { ArrowLeft, Bot } from 'lucide-react';
import { useDropZone, type DragItemType } from '../../hooks/useDragDrop';
import { usePlanner, createPlannerAgent, createPlannerAgentFromEmployee } from '../../context/PlannerContext';
import { AgentSlot } from './AgentSlot';
import type { OrgData, Employee } from '../../types';
import { useEffect, useState } from 'react';

interface ProjectDetailProps {
  orgData: OrgData;
  employees: Employee[];
}

export function ProjectDetail({ orgData, employees }: ProjectDetailProps) {
  const { state, dispatch } = usePlanner();
  const [mounted, setMounted] = useState(false);
  const project = state.projects.find(p => p.instanceId === state.zoomedProjectId);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dispatch({ type: 'ZOOM_OUT' });
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch]);

  const { isOver, dropZoneProps } = useDropZone(['agent', 'employee'], (type: DragItemType, data: Record<string, unknown>) => {
    if (!project) return;
    if (type === 'agent') {
      dispatch({
        type: 'ADD_AGENT_TO_PROJECT',
        projectInstanceId: project.instanceId,
        agent: createPlannerAgent(data.id as string),
      });
    } else if (type === 'employee') {
      const emp = employees.find(e => e.id === data.id);
      if (emp) {
        dispatch({
          type: 'ADD_AGENT_TO_PROJECT',
          projectInstanceId: project.instanceId,
          agent: createPlannerAgentFromEmployee(emp),
        });
      }
    }
  });

  if (!project) return null;

  return (
    <div
      className={`flex-1 overflow-y-auto transition-all duration-300 ease-out
        ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.03]'}`}
    >
      <div className="max-w-3xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => dispatch({ type: 'ZOOM_OUT' })}
            className="flex items-center gap-1.5 text-sm text-text-muted hover:text-accent transition-colors mb-4"
          >
            <ArrowLeft size={16} />
            Back to overview
          </button>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-text-primary">{project.displayName}</h2>
            {project.source === 'jira' && (
              <span className="text-[10px] font-mono bg-info/10 text-info px-2 py-0.5 rounded">{project.projectId}</span>
            )}
          </div>
          {project.description && (
            <p className="text-sm text-text-secondary mt-2 leading-relaxed" style={{ whiteSpace: 'pre-line' }}>{project.description}</p>
          )}
        </div>

        {/* Agent slots */}
        <div className="space-y-5">
          <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Agents ({project.agents.length})
          </div>

          {project.agents.map(agent => (
            <AgentSlot
              key={agent.instanceId}
              agent={agent}
              projectInstanceId={project.instanceId}
              orgData={orgData}
              otherAgents={project.agents.filter(a => a.instanceId !== agent.instanceId)}
              employees={employees}
            />
          ))}

          {/* Drop zone for new agents */}
          <div
            {...dropZoneProps}
            className={`rounded-xl border-2 border-dashed p-8 flex flex-col items-center justify-center gap-3 transition-all duration-200
              ${isOver ? 'border-accent/50 bg-accent/5 scale-[1.02]' : 'border-border/50'}`}
          >
            <Bot size={28} className="text-text-muted" />
            <span className="text-sm text-text-muted">Drag an agent or employee here to assign</span>
          </div>
        </div>
      </div>
    </div>
  );
}
