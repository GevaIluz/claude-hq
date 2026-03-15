import { createContext, useContext, useReducer, type ReactNode, type Dispatch } from 'react';
import type { MissionState, MissionAction, MissionAgentStatus } from '../types';

const initialState: MissionState = {
  planId: '',
  planName: '',
  agents: [],
  monitoringMode: 'manual',
  startedAt: '',
  showAgentDetail: null,
};

function missionReducer(state: MissionState, action: MissionAction): MissionState {
  switch (action.type) {
    case 'INIT_MISSION':
      return {
        ...initialState,
        planId: action.planId,
        planName: action.planName,
        agents: action.agents,
        startedAt: new Date().toISOString(),
      };

    case 'SET_AGENT_STATUS':
      return {
        ...state,
        agents: state.agents.map(a =>
          a.agentInstanceId === action.agentInstanceId
            ? { ...a, status: action.status }
            : a
        ),
      };

    case 'UPDATE_AGENT_STATUS_DATA':
      return {
        ...state,
        agents: state.agents.map(a =>
          a.agentInstanceId === action.agentInstanceId
            ? { ...a, status: action.data.status, statusData: action.data }
            : a
        ),
      };

    case 'MARK_LAUNCHED':
      return {
        ...state,
        agents: state.agents.map(a =>
          a.agentInstanceId === action.agentInstanceId
            ? { ...a, launched: true, launchedAt: new Date().toISOString(), status: 'launching' as MissionAgentStatus }
            : a
        ),
      };

    case 'MARK_ALL_LAUNCHED':
      return {
        ...state,
        agents: state.agents.map(a => ({
          ...a,
          launched: true,
          launchedAt: new Date().toISOString(),
          status: 'launching' as MissionAgentStatus,
        })),
      };

    case 'SET_MONITORING_MODE':
      return { ...state, monitoringMode: action.mode };

    case 'SHOW_AGENT_DETAIL':
      return { ...state, showAgentDetail: action.agentInstanceId };

    case 'HIDE_AGENT_DETAIL':
      return { ...state, showAgentDetail: null };

    case 'RESET_MISSION':
      return { ...initialState };

    default:
      return state;
  }
}

interface MissionContextType {
  mission: MissionState;
  missionDispatch: Dispatch<MissionAction>;
}

const MissionContext = createContext<MissionContextType>({
  mission: initialState,
  missionDispatch: () => {},
});

export function MissionProvider({ children }: { children: ReactNode }) {
  const [mission, missionDispatch] = useReducer(missionReducer, initialState);
  return (
    <MissionContext.Provider value={{ mission, missionDispatch }}>
      {children}
    </MissionContext.Provider>
  );
}

export function useMission() {
  return useContext(MissionContext);
}
