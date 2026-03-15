import { useState, useCallback } from 'react';
import type { PlannerProject } from '../types';

// Mock data based on Guy's real FWaaS Cluster Operations board
// Sprint CP.2w.2026.Q1.5 (Active) + Backlog stories grouped by epic

const mockJiraEpics: PlannerProject[] = [
  {
    instanceId: crypto.randomUUID(),
    projectId: 'FWAAS-Azure',
    source: 'jira',
    displayName: 'Azure Setup',
    description: 'FWaaS Azure monitoring & environment setup\n• FWAAS-310 — Set up manually N-S enabling env in Azure\n• FWAAS-311 — Write script for all traffic enabling env in Azure\n• FWAAS-312 — Full Azure environment deep dive for SMO team',
    agents: [],
  },
  {
    instanceId: crypto.randomUUID(),
    projectId: 'FWAAS-InstallMe',
    source: 'jira',
    displayName: 'InstallMe',
    description: 'InstallMe infrastructure & automation\n• FWAAS-229 — Adding our ESX to InstallMe',
    agents: [],
  },
  {
    instanceId: crypto.randomUUID(),
    projectId: 'FWAAS-SMO-Auto',
    source: 'jira',
    displayName: 'SMO Automation',
    description: 'SMO automation & scaling tests\n• FWAAS-135 — Test time to auto scale\n• FWAAS-256 — Build Heavy Traffic test',
    agents: [],
  },
];

export function useJiraProjects() {
  const [projects, setProjects] = useState<PlannerProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [synced, setSynced] = useState(false);

  const sync = useCallback(async () => {
    setLoading(true);
    // Simulate Jira API call delay
    await new Promise(r => setTimeout(r, 800));
    // Re-generate instanceIds so each sync creates fresh instances
    const fresh = mockJiraEpics.map(p => ({ ...p, instanceId: crypto.randomUUID() }));
    setProjects(fresh);
    setSynced(true);
    setLoading(false);
    return fresh;
  }, []);

  return { projects, loading, synced, sync };
}
