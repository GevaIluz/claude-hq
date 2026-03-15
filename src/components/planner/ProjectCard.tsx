import { Trash2, Zap } from 'lucide-react';
import { useDropZone, type DragItemType } from '../../hooks/useDragDrop';
import { usePlanner, createPlannerAgent, createPlannerAgentFromEmployee } from '../../context/PlannerContext';
import type { PlannerProject, OrgData, Employee } from '../../types';

interface ProjectCardProps {
  project: PlannerProject;
  orgData: OrgData;
  employees: Employee[];
}

export function ProjectCard({ project, orgData, employees }: ProjectCardProps) {
  const { dispatch } = usePlanner();

  const { isOver, dropZoneProps } = useDropZone(['agent', 'employee'], (type: DragItemType, data: Record<string, unknown>) => {
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

  const totalSkills = project.agents.reduce((sum, a) => sum + a.skillIds.length, 0);

  return (
    <div
      {...dropZoneProps}
      onClick={() => dispatch({ type: 'ZOOM_INTO_PROJECT', instanceId: project.instanceId })}
      className={`glass-card rounded-2xl p-6 card-glow cursor-pointer group relative transition-all duration-200 min-h-[160px]
        ${isOver ? 'ring-2 ring-accent ring-dashed border-accent/40 scale-[1.02]' : ''}`}
    >
      {/* Remove button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          dispatch({ type: 'REMOVE_PROJECT', instanceId: project.instanceId });
        }}
        className="absolute top-4 right-4 p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/10 opacity-0 group-hover:opacity-100 transition-all"
      >
        <Trash2 size={14} />
      </button>

      {/* Project info */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1.5">
          <h3 className="text-base font-semibold text-text-primary group-hover:text-accent transition-colors">
            {project.displayName}
          </h3>
          {project.source === 'jira' && (
            <span className="text-[10px] font-mono bg-info/10 text-info px-2 py-0.5 rounded shrink-0">
              {project.projectId}
            </span>
          )}
        </div>
        <p className="text-xs text-text-muted line-clamp-3 leading-relaxed">{project.description}</p>
      </div>

      {/* Agent/skill summary */}
      <div className="flex items-center gap-3 mt-auto">
        {project.agents.length > 0 ? (
          <>
            <div className="flex items-center gap-2">
              {project.agents.slice(0, 3).map((a) => {
                const emp = a.employeeId ? employees.find(e => e.id === a.employeeId) : null;
                const agentInfo = orgData.agents.find(ag => ag.id === a.agentId);
                const label = emp?.name || agentInfo?.name || a.agentId;
                return (
                  <span key={a.instanceId} className="inline-flex items-center gap-1 text-xs text-text-secondary bg-bg-surface-hover px-2 py-1 rounded-lg">
                    🤖 <span className="max-w-[80px] truncate">{label}</span>
                  </span>
                );
              })}
              {project.agents.length > 3 && (
                <span className="text-xs text-text-muted">+{project.agents.length - 3}</span>
              )}
            </div>
            {totalSkills > 0 && (
              <div className="flex items-center gap-1 text-xs text-text-muted">
                <Zap size={12} className="text-accent" />
                {totalSkills}
              </div>
            )}
          </>
        ) : (
          <span className="text-xs text-text-muted italic">Drop agents or employees here</span>
        )}
      </div>

      {/* Drop indicator */}
      {isOver && (
        <div className="absolute inset-0 rounded-2xl border-2 border-dashed border-accent/50 bg-accent/5 flex items-center justify-center pointer-events-none">
          <span className="text-sm text-accent font-medium">Drop here to assign</span>
        </div>
      )}
    </div>
  );
}
