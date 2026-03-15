import { useState, useEffect } from 'react';
import { useMission } from '../../../context/MissionContext';
import { usePlanner } from '../../../context/PlannerContext';
import { useMissionMonitor } from '../../../hooks/useMissionMonitor';
import { generateMissionAgents, generateSingleLaunchScript } from '../../../utils/missionPrompt';
import { MissionToolbar } from './MissionToolbar';
import { MissionAgentCard } from './MissionAgentCard';
import { MissionAgentDetail } from './MissionAgentDetail';
import { MissionLaunchAllModal } from './MissionLaunchAllModal';
import type { OrgData, Employee, MissionAgent } from '../../../types';

interface MissionControlViewProps {
  orgData: OrgData;
  employees: Employee[];
}

export function MissionControlView({ orgData, employees }: MissionControlViewProps) {
  const { state } = usePlanner();
  const { mission, missionDispatch } = useMission();
  const [showLaunchAll, setShowLaunchAll] = useState(false);
  const [mounted, setMounted] = useState(false);

  // SSE live monitoring
  const { connected: _connected } = useMissionMonitor({
    planId: mission.planId,
    enabled: mission.monitoringMode === 'live' && mission.planId !== '',
    dispatch: missionDispatch,
  });

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
    return () => setMounted(false);
  }, []);

  // Initialize mission if not yet done
  useEffect(() => {
    if (mission.agents.length === 0 && state.projects.length > 0) {
      const planId = `plan-${Date.now()}`;
      const agents = generateMissionAgents(state, orgData, employees, planId);
      missionDispatch({ type: 'INIT_MISSION', planId, planName: state.planName, agents });
    }
  }, []);

  const handleLaunchAgent = async (agent: MissionAgent) => {
    const script = generateSingleLaunchScript(agent);
    try {
      // Copy launch script to clipboard for the user
      await navigator.clipboard.writeText(script);
      missionDispatch({ type: 'MARK_LAUNCHED', agentInstanceId: agent.agentInstanceId });
    } catch {
      // Fallback: just mark as launched
      missionDispatch({ type: 'MARK_LAUNCHED', agentInstanceId: agent.agentInstanceId });
    }
  };

  const handleLaunchAll = () => {
    missionDispatch({ type: 'MARK_ALL_LAUNCHED' });
    setShowLaunchAll(false);
  };

  const detailAgent = mission.showAgentDetail
    ? mission.agents.find(a => a.agentInstanceId === mission.showAgentDetail)
    : null;

  // Group agents by project
  const projectGroups = new Map<string, { name: string; agents: typeof mission.agents }>();
  for (const agent of mission.agents) {
    const existing = projectGroups.get(agent.projectInstanceId);
    if (existing) {
      existing.agents.push(agent);
    } else {
      projectGroups.set(agent.projectInstanceId, { name: agent.projectName, agents: [agent] });
    }
  }

  return (
    <div className={`flex flex-col h-full transition-all duration-300 ease-out
      ${mounted ? 'opacity-100' : 'opacity-0'}`}
    >
      <MissionToolbar onLaunchAll={() => setShowLaunchAll(true)} />

      <div className="flex-1 overflow-y-auto p-6">
        {mission.agents.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <span className="text-4xl block mb-4">🚀</span>
              <p className="text-sm text-text-muted">Initializing mission...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {Array.from(projectGroups.entries()).map(([projectId, group]) => (
              <div key={projectId}>
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">
                  {group.name}
                </h3>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-4">
                  {group.agents.map(agent => (
                    <MissionAgentCard
                      key={agent.agentInstanceId}
                      agent={agent}
                      onLaunch={handleLaunchAgent}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {detailAgent && (
        <MissionAgentDetail agent={detailAgent} onLaunch={handleLaunchAgent} />
      )}

      {/* Launch all modal */}
      {showLaunchAll && (
        <MissionLaunchAllModal
          onClose={() => setShowLaunchAll(false)}
          onConfirm={handleLaunchAll}
        />
      )}
    </div>
  );
}
