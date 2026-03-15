import { ArrowLeft, Rocket, Wifi, WifiOff, RotateCcw } from 'lucide-react';
import { useMission } from '../../../context/MissionContext';
import { usePlanner } from '../../../context/PlannerContext';

interface MissionToolbarProps {
  onLaunchAll: () => void;
}

export function MissionToolbar({ onLaunchAll }: MissionToolbarProps) {
  const { mission, missionDispatch } = useMission();
  const { dispatch } = usePlanner();

  const totalAgents = mission.agents.length;
  const launchedCount = mission.agents.filter(a => a.launched).length;
  const completedCount = mission.agents.filter(a => a.status === 'completed').length;
  const attentionCount = mission.agents.filter(a => a.status === 'needs_attention').length;
  const allLaunched = launchedCount === totalAgents;

  return (
    <div className="h-14 bg-bg-surface border-b border-border flex items-center justify-between px-5 shrink-0">
      {/* Left: Back + Plan name */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => dispatch({ type: 'SET_ACTIVE_VIEW', view: 'canvas' })}
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-accent transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Plan
        </button>
        <div className="h-5 w-px bg-border" />
        <h2 className="text-sm font-semibold text-text-primary">
          Mission Control
          {mission.planName && <span className="text-text-muted font-normal"> — {mission.planName}</span>}
        </h2>
      </div>

      {/* Center: Stats */}
      <div className="flex items-center gap-4 text-xs text-text-muted">
        <span>{totalAgents} agent{totalAgents !== 1 ? 's' : ''}</span>
        <span>{launchedCount}/{totalAgents} launched</span>
        <span className="text-success">{completedCount} done</span>
        {attentionCount > 0 && (
          <span className="text-error font-medium">{attentionCount} need attention</span>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => missionDispatch({
            type: 'SET_MONITORING_MODE',
            mode: mission.monitoringMode === 'live' ? 'manual' : 'live',
          })}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs border rounded-xl transition-colors
            ${mission.monitoringMode === 'live'
              ? 'border-success/30 text-success bg-success/5'
              : 'border-border text-text-muted hover:bg-bg-surface-hover'
            }`}
        >
          {mission.monitoringMode === 'live' ? <Wifi size={13} /> : <WifiOff size={13} />}
          {mission.monitoringMode === 'live' ? 'Live' : 'Manual'}
        </button>

        <button
          onClick={() => {
            missionDispatch({ type: 'RESET_MISSION' });
            dispatch({ type: 'SET_ACTIVE_VIEW', view: 'canvas' });
          }}
          className="flex items-center gap-1.5 px-3 py-2 text-xs text-text-muted border border-border rounded-xl hover:bg-bg-surface-hover transition-colors"
        >
          <RotateCcw size={13} />
          Reset
        </button>

        {!allLaunched && (
          <button
            onClick={onLaunchAll}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-medium text-white bg-accent hover:bg-accent-hover rounded-xl transition-colors"
          >
            <Rocket size={13} />
            Launch All
          </button>
        )}
      </div>
    </div>
  );
}
