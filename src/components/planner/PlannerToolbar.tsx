import { Play, RotateCcw, Check, Loader2, LayoutGrid, Wrench } from 'lucide-react';
import { usePlanner } from '../../context/PlannerContext';

interface PlannerToolbarProps {
  saveStatus: 'idle' | 'saving' | 'saved';
  onExecute: () => void;
  employeeCount: number;
}

export function PlannerToolbar({ saveStatus, onExecute, employeeCount }: PlannerToolbarProps) {
  const { state, dispatch } = usePlanner();
  const totalAgents = state.projects.reduce((sum, p) => sum + p.agents.length, 0);
  const totalSkills = state.projects.reduce((sum, p) => sum + p.agents.reduce((s, a) => s + a.skillIds.length, 0), 0);
  const canExecute = state.projects.length > 0 && totalAgents > 0;

  return (
    <div className="h-14 bg-bg-surface border-b border-border flex items-center justify-between px-5 shrink-0">
      {/* Left: Plan name + save */}
      <div className="flex items-center gap-4">
        <input
          type="text"
          value={state.planName}
          onChange={(e) => dispatch({ type: 'SET_PLAN_NAME', name: e.target.value })}
          placeholder="Untitled Plan"
          className="text-sm font-semibold text-text-primary bg-transparent border-none outline-none placeholder:text-text-muted/50 w-72"
        />
        <div className="flex items-center gap-1 text-xs">
          {saveStatus === 'saving' && (
            <>
              <Loader2 size={12} className="animate-spin text-text-muted" />
              <span className="text-text-muted">Saving...</span>
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <Check size={12} className="text-success" />
              <span className="text-success">Saved</span>
            </>
          )}
        </div>
      </div>

      {/* Center: View toggle */}
      <div className="flex items-center bg-bg-primary border border-border rounded-xl p-0.5">
        <button
          onClick={() => dispatch({ type: 'SET_ACTIVE_VIEW', view: 'canvas' })}
          className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-lg transition-all
            ${state.activeView === 'canvas'
              ? 'bg-accent text-white shadow-sm'
              : 'text-text-muted hover:text-text-primary'
            }`}
        >
          <LayoutGrid size={13} />
          Canvas
        </button>
        <button
          onClick={() => dispatch({ type: 'SET_ACTIVE_VIEW', view: 'workbench' })}
          className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-lg transition-all
            ${state.activeView === 'workbench'
              ? 'bg-accent text-white shadow-sm'
              : 'text-text-muted hover:text-text-primary'
            }`}
        >
          <Wrench size={13} />
          Workbench
          {employeeCount > 0 && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              state.activeView === 'workbench' ? 'bg-white/20' : 'bg-accent/10 text-accent'
            }`}>
              {employeeCount}
            </span>
          )}
        </button>
      </div>

      {/* Right: Stats + Actions */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-4 text-xs text-text-muted mr-2">
          <span>{state.projects.length} project{state.projects.length !== 1 ? 's' : ''}</span>
          <span>{totalAgents} agent{totalAgents !== 1 ? 's' : ''}</span>
          <span>{totalSkills} skill{totalSkills !== 1 ? 's' : ''}</span>
        </div>

        <button
          onClick={() => dispatch({ type: 'RESET_PLAN' })}
          className="flex items-center gap-1.5 px-3 py-2 text-xs text-text-muted hover:text-text-primary border border-border rounded-xl hover:bg-bg-surface-hover transition-colors"
        >
          <RotateCcw size={13} />
          Clear
        </button>

        <button
          onClick={onExecute}
          disabled={!canExecute}
          className="flex items-center gap-1.5 px-5 py-2 text-xs font-medium text-white bg-accent hover:bg-accent-hover
            rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Play size={13} />
          Execute Plan
        </button>
      </div>
    </div>
  );
}
