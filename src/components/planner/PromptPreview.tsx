import { X, Copy, Terminal, Check } from 'lucide-react';
import { useState } from 'react';
import { usePlanner } from '../../context/PlannerContext';
import type { OrgData, Employee } from '../../types';

interface PromptPreviewProps {
  orgData: OrgData;
  employees: Employee[];
}

function generateMissionPrompt(state: ReturnType<typeof usePlanner>['state'], orgData: OrgData, employees: Employee[]): string {
  const lines: string[] = [];

  lines.push(`You are executing a mission plan called "${state.planName || 'Untitled Plan'}".`);
  lines.push(`You have ${state.projects.length} project${state.projects.length !== 1 ? 's' : ''} to work on today.`);
  lines.push('');
  lines.push('For each project, execute the specified agents with their assigned skills and instructions.');
  lines.push('');

  for (const project of state.projects) {
    lines.push(`## Project: ${project.displayName}`);
    if (project.source === 'jira') {
      lines.push(`Jira Key: ${project.projectId}`);
    }
    if (project.description) {
      lines.push(`Description: ${project.description}`);
    }
    lines.push('');

    for (const agent of project.agents) {
      const agentInfo = orgData.agents.find(a => a.id === agent.agentId);
      const employeeInfo = agent.employeeId ? employees.find(e => e.id === agent.employeeId) : null;
      const skillNames = agent.skillIds.map(sid => orgData.skills.find(s => s.id === sid)?.name || sid);
      const displayName = employeeInfo?.name || agentInfo?.name || agent.agentId;

      lines.push(`### Agent: ${displayName} 🤖`);
      if (employeeInfo) {
        lines.push(`Role: ${employeeInfo.name} (based on ${agentInfo?.name || agent.agentId})`);
      }
      lines.push(`Type: ${agentInfo?.type || 'general'}`);

      if (skillNames.length > 0) {
        lines.push(`Skills: ${skillNames.join(', ')}`);
      }

      if (agentInfo?.tools?.length) {
        lines.push(`Available tools: ${agentInfo.tools.join(', ')}`);
      }

      if (agent.prompt) {
        lines.push('');
        lines.push('Instructions:');
        lines.push(agent.prompt);
      }

      if (agent.cooperateWith.length > 0) {
        const coopNames = agent.cooperateWith.map(id => {
          const coopAgent = project.agents.find(a => a.instanceId === id);
          if (!coopAgent) return id;
          const coopEmp = coopAgent.employeeId ? employees.find(e => e.id === coopAgent.employeeId) : null;
          return coopEmp?.name || orgData.agents.find(a => a.id === coopAgent.agentId)?.name || coopAgent.agentId;
        });
        lines.push(`Cooperate with: ${coopNames.join(', ')}`);
      }

      lines.push('');
    }

    lines.push('---');
    lines.push('');
  }

  lines.push('## Execution Rules');
  lines.push('- Work through projects sequentially unless the user specified otherwise');
  lines.push('- Within each project, agents can work in parallel where their tasks don\'t conflict');
  lines.push('- Report progress after completing each project');
  lines.push('- If an agent\'s instructions mention cooperation, coordinate with the specified agents');
  lines.push('- Use the assigned skills for each agent — they define the agent\'s capabilities');

  return lines.join('\n');
}

export function PromptPreview({ orgData, employees }: PromptPreviewProps) {
  const { state, dispatch } = usePlanner();
  const [copied, setCopied] = useState<'prompt' | 'command' | null>(null);

  if (!state.showPromptPreview) return null;

  const prompt = generateMissionPrompt(state, orgData, employees);
  const escapedPrompt = prompt.replace(/'/g, "'\\''");
  const command = prompt.length > 4000
    ? `# Prompt is long — save to file first:\ncat << 'MISSION_EOF' > /tmp/mission-plan.md\n${prompt}\nMISSION_EOF\n\nclaude --dangerously-skip-permissions -p "$(cat /tmp/mission-plan.md)"`
    : `claude --dangerously-skip-permissions -p '${escapedPrompt}'`;

  const handleCopy = async (text: string, type: 'prompt' | 'command') => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={() => dispatch({ type: 'HIDE_PROMPT_PREVIEW' })}
      />

      {/* Modal */}
      <div className="relative bg-bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
          <div>
            <h2 className="text-base font-semibold text-text-primary">Generated Mission Prompt</h2>
            <p className="text-xs text-text-muted mt-0.5">Review and execute your day plan</p>
          </div>
          <button
            onClick={() => dispatch({ type: 'HIDE_PROMPT_PREVIEW' })}
            className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-surface-hover transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <pre className="text-xs text-text-secondary font-mono whitespace-pre-wrap bg-bg-primary border border-border rounded-xl p-5 leading-relaxed">
            {prompt}
          </pre>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-6 py-5 border-t border-border shrink-0">
          <p className="text-xs text-text-muted">
            {prompt.length > 4000 ? 'Long prompt — will use temp file approach' : `${prompt.length} characters`}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy(prompt, 'prompt')}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs text-text-secondary border border-border rounded-xl hover:bg-bg-surface-hover transition-colors"
            >
              {copied === 'prompt' ? <Check size={13} className="text-success" /> : <Copy size={13} />}
              {copied === 'prompt' ? 'Copied!' : 'Copy Prompt'}
            </button>
            <button
              onClick={() => handleCopy(command, 'command')}
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-medium text-white bg-accent hover:bg-accent-hover rounded-xl transition-colors"
            >
              {copied === 'command' ? <Check size={13} /> : <Terminal size={13} />}
              {copied === 'command' ? 'Copied!' : 'Copy Launch Command'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
