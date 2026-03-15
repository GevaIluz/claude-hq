import { useDropZone, type DragItemType } from '../../hooks/useDragDrop';
import { usePlanner, createPlannerProject } from '../../context/PlannerContext';
import { ProjectCard } from './ProjectCard';
import type { OrgData, Employee } from '../../types';
import { Plus } from 'lucide-react';

interface ProjectGridProps {
  orgData: OrgData;
  employees: Employee[];
}

export function ProjectGrid({ orgData, employees }: ProjectGridProps) {
  const { state, dispatch } = usePlanner();

  const { isOver, dropZoneProps } = useDropZone(['project'], (_type: DragItemType, data: Record<string, unknown>) => {
    const existing = state.projects.find(p => p.projectId === data.id);
    if (existing) return;

    dispatch({
      type: 'ADD_PROJECT',
      project: createPlannerProject({
        projectId: data.id as string,
        displayName: data.displayName as string,
        source: (data.source as 'local' | 'jira' | 'manual') || 'local',
        description: '',
      }),
    });
  });

  if (state.projects.length === 0) {
    return (
      <div
        {...dropZoneProps}
        className={`flex-1 p-8 overflow-y-auto transition-all duration-200
          ${isOver ? 'bg-accent/5' : ''}`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`rounded-2xl border-2 border-dashed min-h-[180px] flex items-center justify-center transition-all duration-200
                ${isOver ? 'border-accent/40 bg-accent/5 scale-[1.01]' : 'border-border/30 hover:border-border/60'}`}
            >
              <Plus size={28} className={`${isOver ? 'text-accent/50' : 'text-text-muted/20'} transition-colors`} />
            </div>
          ))}
        </div>
        {!isOver && (
          <p className="text-center text-sm text-text-muted mt-8">
            Drag projects from the left panel to start planning your day
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      {...dropZoneProps}
      className={`flex-1 p-8 overflow-y-auto transition-all duration-200
        ${isOver ? 'bg-accent/5' : ''}`}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {state.projects.map(project => (
          <ProjectCard key={project.instanceId} project={project} orgData={orgData} employees={employees} />
        ))}

        {/* Drop zone card for adding more */}
        <div
          className={`rounded-2xl border-2 border-dashed p-6 flex items-center justify-center min-h-[160px] transition-all duration-200
            ${isOver ? 'border-accent/50 bg-accent/5' : 'border-border/40 hover:border-border/60'}`}
        >
          <div className="text-center">
            <Plus size={24} className="mx-auto mb-2 text-text-muted/30" />
            <span className="text-xs text-text-muted">Drag a project here</span>
          </div>
        </div>
      </div>
    </div>
  );
}
