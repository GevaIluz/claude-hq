import { useOutletContext } from 'react-router-dom';
import { CalendarClock, Plus } from 'lucide-react';
import type { OrgData } from '../types';

export function Tasks() {
  const data = useOutletContext<OrgData>();

  if (data.scheduledTasks.length === 0) {
    return (
      <div className="max-w-4xl">
        <p className="text-sm text-text-secondary mb-5">
          Recurring and one-time tasks that Claude runs automatically on a schedule.
        </p>
        <div className="flex flex-col items-center justify-center py-16 glass-card border-dashed rounded-2xl">
          <div className="w-14 h-14 rounded-2xl bg-bg-surface-hover flex items-center justify-center mb-4">
            <CalendarClock size={28} className="text-text-muted" />
          </div>
          <h3 className="text-sm font-semibold text-text-primary mb-1">No scheduled tasks</h3>
          <p className="text-xs text-text-muted text-center max-w-xs">
            You haven't configured any scheduled tasks yet. Use Claude Code to create recurring or one-time automated tasks.
          </p>
          <div className="mt-4 flex items-center gap-1.5 px-3 py-1.5 bg-bg-primary border border-border rounded-lg">
            <Plus size={12} className="text-accent" />
            <span className="text-xs text-text-secondary font-mono">claude "schedule a daily report"</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <p className="text-sm text-text-secondary mb-5">
        Recurring and one-time tasks that Claude runs automatically.
      </p>
      <div className="space-y-3">
        {data.scheduledTasks.map(task => (
          <div key={task.taskId} className="glass-card rounded-2xl p-5 card-glow">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">{task.taskId}</h3>
                <p className="text-xs text-text-secondary mt-1">{task.description}</p>
                <p className="text-[10px] text-text-muted mt-2 font-mono">{task.schedule}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                task.enabled ? 'bg-success/15 text-success' : 'bg-bg-surface-hover text-text-muted'
              }`}>
                {task.enabled ? 'Active' : 'Paused'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
