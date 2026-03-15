import { createContext, useContext, useReducer, type ReactNode, type Dispatch } from 'react';
import type { PlannerState, PlannerAction, PlannerProject, PlannerAgent, Employee } from '../types';

const initialState: PlannerState = {
  planName: '',
  projects: [],
  zoomedProjectId: null,
  showPromptPreview: false,
  showSourcePanel: true,
  activeView: 'canvas',
  workbenchAgentId: null,
};

function plannerReducer(state: PlannerState, action: PlannerAction): PlannerState {
  switch (action.type) {
    case 'SET_PLAN_NAME':
      return { ...state, planName: action.name };

    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, action.project] };

    case 'REMOVE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter(p => p.instanceId !== action.instanceId),
        zoomedProjectId: state.zoomedProjectId === action.instanceId ? null : state.zoomedProjectId,
      };

    case 'ADD_AGENT_TO_PROJECT':
      return {
        ...state,
        projects: state.projects.map(p =>
          p.instanceId === action.projectInstanceId
            ? { ...p, agents: [...p.agents, action.agent] }
            : p
        ),
      };

    case 'REMOVE_AGENT':
      return {
        ...state,
        projects: state.projects.map(p =>
          p.instanceId === action.projectInstanceId
            ? { ...p, agents: p.agents.filter(a => a.instanceId !== action.agentInstanceId) }
            : p
        ),
      };

    case 'ADD_SKILL_TO_AGENT':
      return {
        ...state,
        projects: state.projects.map(p =>
          p.instanceId === action.projectInstanceId
            ? {
                ...p,
                agents: p.agents.map(a =>
                  a.instanceId === action.agentInstanceId && !a.skillIds.includes(action.skillId)
                    ? { ...a, skillIds: [...a.skillIds, action.skillId] }
                    : a
                ),
              }
            : p
        ),
      };

    case 'REMOVE_SKILL_FROM_AGENT':
      return {
        ...state,
        projects: state.projects.map(p =>
          p.instanceId === action.projectInstanceId
            ? {
                ...p,
                agents: p.agents.map(a =>
                  a.instanceId === action.agentInstanceId
                    ? { ...a, skillIds: a.skillIds.filter(s => s !== action.skillId) }
                    : a
                ),
              }
            : p
        ),
      };

    case 'UPDATE_AGENT_PROMPT':
      return {
        ...state,
        projects: state.projects.map(p =>
          p.instanceId === action.projectInstanceId
            ? {
                ...p,
                agents: p.agents.map(a =>
                  a.instanceId === action.agentInstanceId
                    ? { ...a, prompt: action.prompt }
                    : a
                ),
              }
            : p
        ),
      };

    case 'SET_COOPERATE_WITH':
      return {
        ...state,
        projects: state.projects.map(p =>
          p.instanceId === action.projectInstanceId
            ? {
                ...p,
                agents: p.agents.map(a =>
                  a.instanceId === action.agentInstanceId
                    ? { ...a, cooperateWith: action.cooperateWith }
                    : a
                ),
              }
            : p
        ),
      };

    case 'ZOOM_INTO_PROJECT':
      return { ...state, zoomedProjectId: action.instanceId };

    case 'ZOOM_OUT':
      return { ...state, zoomedProjectId: null };

    case 'TOGGLE_SOURCE_PANEL':
      return { ...state, showSourcePanel: !state.showSourcePanel };

    case 'SHOW_PROMPT_PREVIEW':
      return { ...state, showPromptPreview: true };

    case 'HIDE_PROMPT_PREVIEW':
      return { ...state, showPromptPreview: false };

    case 'IMPORT_JIRA_PROJECTS':
      return { ...state, projects: [...state.projects, ...action.projects] };

    case 'LOAD_PLAN':
      return {
        ...action.state,
      };

    case 'RESET_PLAN':
      return { ...initialState };

    case 'SET_ACTIVE_VIEW':
      return { ...state, activeView: action.view };

    case 'SET_WORKBENCH_AGENT':
      return { ...state, workbenchAgentId: action.agentId };

    case 'ADD_EMPLOYEE_TO_PROJECT':
      return {
        ...state,
        projects: state.projects.map(p =>
          p.instanceId === action.projectInstanceId
            ? {
                ...p,
                agents: [...p.agents, createPlannerAgentFromEmployee(action.employee)],
              }
            : p
        ),
      };

    default:
      return state;
  }
}

interface PlannerContextType {
  state: PlannerState;
  dispatch: Dispatch<PlannerAction>;
}

const PlannerContext = createContext<PlannerContextType>({
  state: initialState,
  dispatch: () => {},
});

export function PlannerProvider({ children, initialPlan }: { children: ReactNode; initialPlan?: PlannerState }) {
  const [state, dispatch] = useReducer(plannerReducer, initialPlan || initialState);
  return (
    <PlannerContext.Provider value={{ state, dispatch }}>
      {children}
    </PlannerContext.Provider>
  );
}

export function usePlanner() {
  return useContext(PlannerContext);
}

export function createPlannerProject(overrides: Partial<PlannerProject> & Pick<PlannerProject, 'projectId' | 'displayName' | 'source'>): PlannerProject {
  return {
    instanceId: crypto.randomUUID(),
    description: '',
    agents: [],
    ...overrides,
  };
}

export function createPlannerAgent(agentId: string): PlannerAgent {
  return {
    instanceId: crypto.randomUUID(),
    agentId,
    skillIds: [],
    prompt: '',
    cooperateWith: [],
  };
}

export function createPlannerAgentFromEmployee(employee: Employee): PlannerAgent {
  return {
    instanceId: crypto.randomUUID(),
    agentId: employee.baseAgentId,
    employeeId: employee.id,
    skillIds: [...employee.skillIds],
    prompt: employee.defaultPrompt,
    cooperateWith: [],
  };
}

export { initialState as defaultPlannerState };
