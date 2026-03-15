import { useOutletContext } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import type { OrgData } from '../types';
import { PlannerProvider, usePlanner } from '../context/PlannerContext';
import { MissionProvider } from '../context/MissionContext';
import { usePlanStorage } from '../hooks/usePlanStorage';
import { useJiraProjects } from '../hooks/useJiraProjects';
import { useEmployeeStorage } from '../hooks/useEmployeeStorage';
import { PlanLanding } from '../components/planner/PlanLanding';
import { PlannerToolbar } from '../components/planner/PlannerToolbar';
import { SourcePanel } from '../components/planner/SourcePanel';
import { ProjectGrid } from '../components/planner/ProjectGrid';
import { ProjectDetail } from '../components/planner/ProjectDetail';
import { PromptPreview } from '../components/planner/PromptPreview';
import { EmployeeWorkbench } from '../components/planner/EmployeeWorkbench';
import { MissionControlView } from '../components/planner/mission/MissionControlView';

type StorageHandle = ReturnType<typeof usePlanStorage>;

function PlannerInner({ orgData, storage }: { orgData: OrgData; storage: StorageHandle }) {
  const { state, dispatch } = usePlanner();
  const jira = useJiraProjects();
  const employeeStorage = useEmployeeStorage();

  // Auto-save on state changes
  useEffect(() => {
    if (storage.activePlanId) {
      storage.savePlan(state);
    }
  }, [state, storage.activePlanId]);

  const addedProjectIds = new Set(state.projects.map(p => p.projectId));

  const handleAddManualProject = (name: string, description: string) => {
    dispatch({
      type: 'ADD_PROJECT',
      project: {
        instanceId: crypto.randomUUID(),
        projectId: `manual-${Date.now()}`,
        source: 'manual',
        displayName: name,
        description,
        agents: [],
      },
    });
  };

  const handleSyncJira = async () => {
    const jiraProjects = await jira.sync();
    const newProjects = jiraProjects.filter(
      jp => !state.projects.some(p => p.projectId === jp.projectId)
    );
    if (newProjects.length > 0) {
      dispatch({ type: 'IMPORT_JIRA_PROJECTS', projects: newProjects });
    }
  };

  const handleConfigureAgent = (agentId: string) => {
    dispatch({ type: 'SET_ACTIVE_VIEW', view: 'workbench' });
    dispatch({ type: 'SET_WORKBENCH_AGENT', agentId });
  };

  // Mission control view is a full takeover — no source panel, no prompt preview
  if (state.activeView === 'mission-control') {
    return (
      <div className="flex flex-col h-full -m-6 lg:-m-8">
        <MissionControlView orgData={orgData} employees={employeeStorage.employees} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full -m-6 lg:-m-8">
      <PlannerToolbar
        saveStatus={storage.saveStatus}
        onExecute={() => dispatch({ type: 'SET_ACTIVE_VIEW', view: 'mission-control' })}
        employeeCount={employeeStorage.employees.length}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Source panel */}
        {state.showSourcePanel && (
          <SourcePanel
            agents={orgData.agents}
            skills={orgData.skills}
            jiraProjects={jira.projects}
            jiraLoading={jira.loading}
            jiraSynced={jira.synced}
            onSyncJira={handleSyncJira}
            onAddManualProject={handleAddManualProject}
            addedProjectIds={addedProjectIds}
            isZoomed={!!state.zoomedProjectId || state.activeView === 'workbench'}
            employees={employeeStorage.employees}
            onConfigureAgent={handleConfigureAgent}
          />
        )}

        {/* Main content */}
        {state.activeView === 'workbench' ? (
          <EmployeeWorkbench
            orgData={orgData}
            employees={employeeStorage.employees}
            onSaveEmployee={employeeStorage.saveEmployee}
            onUpdateEmployee={employeeStorage.updateEmployee}
            onDeleteEmployee={employeeStorage.deleteEmployee}
          />
        ) : state.zoomedProjectId ? (
          <ProjectDetail orgData={orgData} employees={employeeStorage.employees} />
        ) : (
          <ProjectGrid orgData={orgData} employees={employeeStorage.employees} />
        )}
      </div>

      <PromptPreview orgData={orgData} employees={employeeStorage.employees} />
    </div>
  );
}

export function Planner() {
  const orgData = useOutletContext<OrgData>();
  const storage = usePlanStorage();
  const [mode, setMode] = useState<'landing' | 'active'>(() =>
    storage.plans.length > 0 ? 'landing' : 'landing'
  );
  const [initialState, setInitialState] = useState(undefined as any);

  const handleNewPlan = useCallback(() => {
    const plan = storage.createPlan('');
    setInitialState(plan.state);
    setMode('active');
  }, [storage]);

  const handleLoadPlan = useCallback((id: string) => {
    const loaded = storage.loadPlan(id);
    if (loaded) {
      setInitialState(loaded);
      setMode('active');
    }
  }, [storage]);

  if (mode === 'landing') {
    return (
      <div className="h-full -m-6 lg:-m-8 flex">
        <PlanLanding
          plans={storage.plans}
          onNewPlan={handleNewPlan}
          onLoadPlan={handleLoadPlan}
          onDeletePlan={storage.deletePlan}
        />
      </div>
    );
  }

  return (
    <PlannerProvider initialPlan={initialState}>
      <MissionProvider>
        <PlannerInner orgData={orgData} storage={storage} />
      </MissionProvider>
    </PlannerProvider>
  );
}
