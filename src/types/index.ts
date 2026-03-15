export interface OrgData {
  meta: OrgMeta;
  skills: Skill[];
  plugins: Plugin[];
  mcpServers: McpServer[];
  agents: Agent[];
  hooks: Hook[];
  projects: Project[];
  permissions: PermissionGroup[];
  memory: Memory;
  scheduledTasks: ScheduledTask[];
  teamMembers: TeamMember[];
}

export interface OrgMeta {
  generatedAt: string;
  userName: string;
  company: string;
  team: string;
  role: string;
  currentFocus: string;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  triggers: string[];
  hasReferences: boolean;
  referenceFiles: string[];
  content: string;
  icon: string;
  color: string;
  knowledge?: string[];
  capabilities?: string[];
  requiredTools?: string[];
  workflow?: string[];
}

export interface Agent {
  id: string;
  name: string;
  type: string;
  description: string;
  tools: string[];
  useCases: string[];
  icon: string;
  color: string;
}

export interface Plugin {
  id: string;
  shortName: string;
  marketplace: string;
  description: string;
  enabled: boolean;
  icon: string;
  docUrl?: string;
}

export interface McpServer {
  id: string;
  name: string;
  type: 'custom' | 'external';
  transport: 'stdio' | 'http' | 'cloud';
  packageName?: string;
  toolCount: number;
  tools: McpTool[];
  authStatus: 'connected' | 'needs-auth' | 'unknown';
  description: string;
}

export interface McpTool {
  name: string;
  description: string;
}

export interface Hook {
  event: string;
  type: string;
  command: string;
  timeout: number;
  source: string;
  description: string;
}

export interface Project {
  id: string;
  path: string;
  displayName: string;
  hasMemory: boolean;
  memorySummary: string;
  memoryContent: string;
}

export interface PermissionGroup {
  category: string;
  icon: string;
  count?: number;
  permissions: PermissionEntry[];
}

export interface PermissionEntry {
  raw: string;
  summary: string;
  source: 'global' | 'local';
}

export interface Memory {
  userProfile: {
    name: string;
    company: string;
    team: string;
    role: string;
    focus: string;
  };
  awsContext: Record<string, string>;
  goals: string[];
  rawContent: string;
}

export interface TeamMember {
  name: string;
  location: string;
  emoji: string;
}

export interface ScheduledTask {
  taskId: string;
  description: string;
  schedule: string;
  enabled: boolean;
  nextRunAt?: string;
  lastRunAt?: string;
}

// ─── Mission Planner Types ──────────────────────────────

export interface Employee {
  id: string;
  name: string;
  baseAgentId: string;
  skillIds: string[];
  defaultPrompt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlannerAgent {
  instanceId: string;
  agentId: string;
  employeeId?: string;
  skillIds: string[];
  prompt: string;
  cooperateWith: string[];
}

export interface PlannerProject {
  instanceId: string;
  projectId: string;
  source: 'local' | 'jira' | 'manual';
  displayName: string;
  description: string;
  agents: PlannerAgent[];
}

export interface PlannerState {
  planName: string;
  projects: PlannerProject[];
  zoomedProjectId: string | null;
  showPromptPreview: boolean;
  showSourcePanel: boolean;
  activeView: 'canvas' | 'workbench' | 'mission-control';
  workbenchAgentId: string | null;
}

export interface SavedPlan {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  state: PlannerState;
}

export type PlannerAction =
  | { type: 'SET_PLAN_NAME'; name: string }
  | { type: 'ADD_PROJECT'; project: PlannerProject }
  | { type: 'REMOVE_PROJECT'; instanceId: string }
  | { type: 'ADD_AGENT_TO_PROJECT'; projectInstanceId: string; agent: PlannerAgent }
  | { type: 'REMOVE_AGENT'; projectInstanceId: string; agentInstanceId: string }
  | { type: 'ADD_SKILL_TO_AGENT'; projectInstanceId: string; agentInstanceId: string; skillId: string }
  | { type: 'REMOVE_SKILL_FROM_AGENT'; projectInstanceId: string; agentInstanceId: string; skillId: string }
  | { type: 'UPDATE_AGENT_PROMPT'; projectInstanceId: string; agentInstanceId: string; prompt: string }
  | { type: 'SET_COOPERATE_WITH'; projectInstanceId: string; agentInstanceId: string; cooperateWith: string[] }
  | { type: 'ZOOM_INTO_PROJECT'; instanceId: string }
  | { type: 'ZOOM_OUT' }
  | { type: 'TOGGLE_SOURCE_PANEL' }
  | { type: 'SHOW_PROMPT_PREVIEW' }
  | { type: 'HIDE_PROMPT_PREVIEW' }
  | { type: 'IMPORT_JIRA_PROJECTS'; projects: PlannerProject[] }
  | { type: 'LOAD_PLAN'; state: PlannerState }
  | { type: 'RESET_PLAN' }
  | { type: 'SET_ACTIVE_VIEW'; view: 'canvas' | 'workbench' | 'mission-control' }
  | { type: 'SET_WORKBENCH_AGENT'; agentId: string | null }
  | { type: 'ADD_EMPLOYEE_TO_PROJECT'; projectInstanceId: string; employee: Employee };

// ─── Mission Control Types ──────────────────────────────

export type MissionAgentStatus = 'idle' | 'launching' | 'running' | 'needs_attention' | 'completed' | 'error';

export interface MissionTodoItem {
  task: string;
  done: boolean;
}

export interface MissionAgentStatusFile {
  status: MissionAgentStatus;
  currentTask: string;
  todoList: MissionTodoItem[];
  progress: number;
  lastUpdate: string;
  needsAttention: boolean;
  attentionReason?: string;
  logs: string[];
}

export interface MissionAgent {
  agentInstanceId: string;
  projectInstanceId: string;
  agentId: string;
  employeeId?: string;
  displayName: string;
  projectName: string;
  skillNames: string[];
  status: MissionAgentStatus;
  statusData: MissionAgentStatusFile | null;
  command: string;
  launched: boolean;
  launchedAt?: string;
}

export interface MissionState {
  planId: string;
  planName: string;
  agents: MissionAgent[];
  monitoringMode: 'live' | 'manual';
  startedAt: string;
  showAgentDetail: string | null;
}

export type MissionAction =
  | { type: 'INIT_MISSION'; planId: string; planName: string; agents: MissionAgent[] }
  | { type: 'SET_AGENT_STATUS'; agentInstanceId: string; status: MissionAgentStatus }
  | { type: 'UPDATE_AGENT_STATUS_DATA'; agentInstanceId: string; data: MissionAgentStatusFile }
  | { type: 'MARK_LAUNCHED'; agentInstanceId: string }
  | { type: 'MARK_ALL_LAUNCHED' }
  | { type: 'SET_MONITORING_MODE'; mode: 'live' | 'manual' }
  | { type: 'SHOW_AGENT_DETAIL'; agentInstanceId: string }
  | { type: 'HIDE_AGENT_DETAIL' }
  | { type: 'RESET_MISSION' };
