import type { PlannerState, PlannerAgent, OrgData, Employee, MissionAgent } from '../types';

const STATUS_FILE_PATH = '/tmp/claude-hq-mission';

interface AgentPromptContext {
  plannerAgent: PlannerAgent;
  projectName: string;
  projectDescription: string;
  projectInstanceId: string;
  agentInfo: OrgData['agents'][0] | undefined;
  employeeInfo: Employee | undefined;
  skillNames: string[];
  skillDescriptions: { name: string; description: string }[];
  cooperatorNames: string[];
  planId: string;
}

function buildAgentPrompt(ctx: AgentPromptContext): string {
  const lines: string[] = [];
  const displayName = ctx.employeeInfo?.name || ctx.agentInfo?.name || ctx.plannerAgent.agentId;

  lines.push(`# Agent Identity`);
  lines.push(`You are **${displayName}**, a ${ctx.agentInfo?.type || 'general'} agent.`);
  if (ctx.employeeInfo) {
    lines.push(`You are configured as "${ctx.employeeInfo.name}" based on the ${ctx.agentInfo?.name || ctx.plannerAgent.agentId} agent template.`);
  }
  lines.push('');

  lines.push(`# Project: ${ctx.projectName}`);
  if (ctx.projectDescription) {
    lines.push(ctx.projectDescription);
  }
  lines.push('');

  if (ctx.skillDescriptions.length > 0) {
    lines.push('# Your Skills');
    for (const skill of ctx.skillDescriptions) {
      lines.push(`- **${skill.name}**: ${skill.description}`);
    }
    lines.push('');
  }

  if (ctx.agentInfo?.tools?.length) {
    lines.push(`# Available Tools`);
    lines.push(`You can use: ${ctx.agentInfo.tools.join(', ')}`);
    lines.push('');
  }

  if (ctx.plannerAgent.prompt) {
    lines.push('# Your Instructions');
    lines.push(ctx.plannerAgent.prompt);
    lines.push('');
  }

  if (ctx.cooperatorNames.length > 0) {
    lines.push('# Cooperation');
    lines.push(`Coordinate with: ${ctx.cooperatorNames.join(', ')}`);
    lines.push('These agents are working on the same project. Share relevant findings and avoid duplicate work.');
    lines.push('');
  }

  // Status reporting mandate
  const statusPath = `${STATUS_FILE_PATH}/${ctx.planId}/${ctx.plannerAgent.instanceId}.json`;
  lines.push('# Status Reporting (IMPORTANT)');
  lines.push(`Throughout your work, regularly update your status file at: \`${statusPath}\``);
  lines.push('');
  lines.push('Write a JSON file with this exact structure:');
  lines.push('```json');
  lines.push(JSON.stringify({
    status: 'running',
    currentTask: 'Description of what you are doing right now',
    todoList: [
      { task: 'Example task 1', done: true },
      { task: 'Example task 2', done: false },
    ],
    progress: 40,
    lastUpdate: new Date().toISOString(),
    needsAttention: false,
    attentionReason: '',
    logs: ['[HH:MM] What you did...'],
  }, null, 2));
  lines.push('```');
  lines.push('');
  lines.push('Rules for status updates:');
  lines.push('- Update the file **after completing each significant step**');
  lines.push('- Set `status` to: "running" while working, "completed" when done, "error" if stuck');
  lines.push('- Set `needsAttention: true` and fill `attentionReason` if you need human input');
  lines.push('- Keep `logs` as a running log of what you did (append, don\'t replace)');
  lines.push('- `progress` should be 0-100 reflecting overall completion');
  lines.push('- Create the directory if it doesn\'t exist: `mkdir -p ' + STATUS_FILE_PATH + '/' + ctx.planId + '`');
  lines.push('- Write the initial status file IMMEDIATELY when you start');
  lines.push('');
  lines.push('# Begin');
  lines.push('Start working now. Create the status file first, then proceed with your instructions.');

  return lines.join('\n');
}

function buildAgentCommand(prompt: string): string {
  const escapedPrompt = prompt.replace(/'/g, "'\\''");
  if (prompt.length > 4000) {
    return `cat << 'AGENT_EOF' > /tmp/agent-prompt-$$.md\n${prompt}\nAGENT_EOF\n\nclaude --dangerously-skip-permissions -p "$(cat /tmp/agent-prompt-$$.md)"`;
  }
  return `claude --dangerously-skip-permissions -p '${escapedPrompt}'`;
}

export function generateMissionAgents(
  state: PlannerState,
  orgData: OrgData,
  employees: Employee[],
  planId: string,
): MissionAgent[] {
  const agents: MissionAgent[] = [];

  for (const project of state.projects) {
    for (const plannerAgent of project.agents) {
      const agentInfo = orgData.agents.find(a => a.id === plannerAgent.agentId);
      const employeeInfo = plannerAgent.employeeId ? employees.find(e => e.id === plannerAgent.employeeId) : undefined;
      const skillNames = plannerAgent.skillIds.map(sid => orgData.skills.find(s => s.id === sid)?.name || sid);
      const skillDescriptions = plannerAgent.skillIds.map(sid => {
        const s = orgData.skills.find(sk => sk.id === sid);
        return { name: s?.name || sid, description: s?.description || '' };
      });

      const cooperatorNames = plannerAgent.cooperateWith.map(id => {
        const coopAgent = project.agents.find(a => a.instanceId === id);
        if (!coopAgent) return id;
        const coopEmp = coopAgent.employeeId ? employees.find(e => e.id === coopAgent.employeeId) : undefined;
        return coopEmp?.name || orgData.agents.find(a => a.id === coopAgent.agentId)?.name || coopAgent.agentId;
      });

      const displayName = employeeInfo?.name || agentInfo?.name || plannerAgent.agentId;

      const ctx: AgentPromptContext = {
        plannerAgent,
        projectName: project.displayName,
        projectDescription: project.description,
        projectInstanceId: project.instanceId,
        agentInfo,
        employeeInfo,
        skillNames,
        skillDescriptions,
        cooperatorNames,
        planId,
      };

      const prompt = buildAgentPrompt(ctx);
      const command = buildAgentCommand(prompt);

      agents.push({
        agentInstanceId: plannerAgent.instanceId,
        projectInstanceId: project.instanceId,
        agentId: plannerAgent.agentId,
        employeeId: plannerAgent.employeeId,
        displayName,
        projectName: project.displayName,
        skillNames,
        status: 'idle',
        statusData: null,
        command,
        prompt,
        launched: false,
      });
    }
  }

  return agents;
}

export function generateLaunchAllScript(agents: MissionAgent[]): string {
  const lines: string[] = [
    '#!/bin/bash',
    '# Launch all mission agents in separate Terminal tabs',
    '',
  ];

  for (const agent of agents) {
    const escapedCommand = agent.command.replace(/"/g, '\\"').replace(/\\/g, '\\\\');
    lines.push(`# ${agent.displayName} → ${agent.projectName}`);
    lines.push(`osascript -e 'tell application "Terminal" to do script "${escapedCommand}"'`);
    lines.push('sleep 1');
    lines.push('');
  }

  return lines.join('\n');
}

export function generateSingleLaunchScript(agent: MissionAgent): string {
  const escapedCommand = agent.command.replace(/"/g, '\\"').replace(/\\/g, '\\\\');
  return `osascript -e 'tell application "Terminal" to do script "${escapedCommand}"'`;
}
