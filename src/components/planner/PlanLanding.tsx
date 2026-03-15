import { Plus, Clock, Trash2, Map } from 'lucide-react';
import type { SavedPlan } from '../../types';

interface PlanLandingProps {
  plans: SavedPlan[];
  onNewPlan: () => void;
  onLoadPlan: (id: string) => void;
  onDeletePlan: (id: string) => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

export function PlanLanding({ plans, onNewPlan, onLoadPlan, onDeletePlan }: PlanLandingProps) {
  const recentPlans = plans.slice(0, 10);

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <Map size={32} className="text-accent" />
          </div>
          <h1 className="text-xl font-bold text-text-primary mb-2">Mission Planner</h1>
          <p className="text-sm text-text-secondary">
            Plan your day by assembling projects, agents, and skills. Then execute it all with a single command.
          </p>
        </div>

        {/* New Plan button */}
        <button
          onClick={onNewPlan}
          className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-accent hover:bg-accent-hover text-white
            rounded-xl text-sm font-medium transition-colors mb-6"
        >
          <Plus size={16} />
          Start New Plan
        </button>

        {/* Recent plans */}
        {recentPlans.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Continue where you left off</h2>
            <div className="space-y-2">
              {recentPlans.map(plan => {
                const projectCount = plan.state.projects.length;
                const agentCount = plan.state.projects.reduce((s, p) => s + p.agents.length, 0);

                return (
                  <div
                    key={plan.id}
                    className="glass-card rounded-xl p-4 card-glow cursor-pointer group flex items-center gap-3"
                    onClick={() => onLoadPlan(plan.id)}
                  >
                    <div className="w-10 h-10 rounded-xl bg-accent/8 flex items-center justify-center shrink-0">
                      <Map size={18} className="text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors truncate">
                        {plan.name || 'Untitled Plan'}
                      </h3>
                      <div className="flex items-center gap-3 text-[10px] text-text-muted mt-0.5">
                        <span>{projectCount} project{projectCount !== 1 ? 's' : ''}</span>
                        <span>{agentCount} agent{agentCount !== 1 ? 's' : ''}</span>
                        <span className="flex items-center gap-1">
                          <Clock size={9} />
                          {formatDate(plan.updatedAt)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePlan(plan.id);
                      }}
                      className="p-2 rounded-lg text-text-muted hover:text-error hover:bg-error/10 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
