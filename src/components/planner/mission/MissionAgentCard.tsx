import { Play, Copy, Check, AlertTriangle, Loader2, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useMission } from '../../../context/MissionContext';
import type { MissionAgent, MissionAgentStatus } from '../../../types';

interface MissionAgentCardProps {
  agent: MissionAgent;
  onLaunch: (agent: MissionAgent) => void;
}

const statusConfig: Record<MissionAgentStatus, { label: string; color: string; icon: typeof Clock; bgClass: string }> = {
  idle: { label: 'Idle', color: 'text-text-muted', icon: Clock, bgClass: 'bg-text-muted/10' },
  launching: { label: 'Launching...', color: 'text-warning', icon: Loader2, bgClass: 'bg-warning/10' },
  running: { label: 'Running', color: 'text-accent', icon: Loader2, bgClass: 'bg-accent/10' },
  needs_attention: { label: 'Needs Attention', color: 'text-error', icon: AlertTriangle, bgClass: 'bg-error/10' },
  completed: { label: 'Completed', color: 'text-success', icon: CheckCircle2, bgClass: 'bg-success/10' },
  error: { label: 'Error', color: 'text-error', icon: XCircle, bgClass: 'bg-error/10' },
};

export function MissionAgentCard({ agent, onLaunch }: MissionAgentCardProps) {
  const { missionDispatch } = useMission();
  const [copied, setCopied] = useState(false);
  const config = statusConfig[agent.status];
  const StatusIcon = config.icon;
  const isSpinning = agent.status === 'launching' || agent.status === 'running';
  const needsAttention = agent.status === 'needs_attention';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(agent.command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const todoList = agent.statusData?.todoList || [];
  const doneTodos = todoList.filter(t => t.done).length;
  const logs = agent.statusData?.logs || [];
  const lastLogs = logs.slice(-3);

  return (
    <div
      onClick={() => missionDispatch({ type: 'SHOW_AGENT_DETAIL', agentInstanceId: agent.agentInstanceId })}
      className={`bg-bg-surface border rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-border-hover
        ${needsAttention ? 'border-error/50 ring-2 ring-error/20 attention-pulse' : 'border-border'}
        ${agent.status === 'completed' ? 'opacity-80' : ''}`}
    >
      {/* Header: name + project */}
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">🤖</span>
            <h3 className="text-sm font-semibold text-text-primary truncate">{agent.displayName}</h3>
          </div>
          <p className="text-xs text-text-muted mt-0.5 truncate ml-7">{agent.projectName}</p>
        </div>
      </div>

      {/* Status badge + progress bar */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${config.color} ${config.bgClass}`}>
          <StatusIcon size={11} className={isSpinning ? 'animate-spin' : ''} />
          {config.label}
        </span>
        {agent.statusData && agent.statusData.progress > 0 && (
          <div className="flex-1 h-1.5 bg-bg-primary rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-500"
              style={{ width: `${agent.statusData.progress}%` }}
            />
          </div>
        )}
        {agent.statusData && agent.statusData.progress > 0 && (
          <span className="text-[10px] text-text-muted font-mono">{agent.statusData.progress}%</span>
        )}
      </div>

      {/* Current task */}
      {agent.statusData?.currentTask && (
        <div className="mb-3">
          <p className="text-xs text-text-secondary leading-relaxed">
            <span className="text-text-muted">Currently:</span> {agent.statusData.currentTask}
          </p>
        </div>
      )}

      {/* Todo list */}
      {todoList.length > 0 && (
        <div className="mb-3 space-y-1">
          {todoList.slice(0, 4).map((todo, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className={todo.done ? 'text-success' : 'text-text-muted'}>
                {todo.done ? '☑' : '☐'}
              </span>
              <span className={todo.done ? 'text-text-muted line-through' : 'text-text-secondary'}>
                {todo.task}
              </span>
            </div>
          ))}
          {todoList.length > 4 && (
            <p className="text-[10px] text-text-muted ml-5">+{todoList.length - 4} more ({doneTodos}/{todoList.length} done)</p>
          )}
        </div>
      )}

      {/* Log tail */}
      {lastLogs.length > 0 && (
        <div className="mb-3 bg-bg-primary rounded-lg p-2.5 border border-border">
          {lastLogs.map((log, i) => (
            <p key={i} className="text-[10px] font-mono text-text-muted leading-relaxed truncate">{log}</p>
          ))}
        </div>
      )}

      {/* Skills */}
      {agent.skillNames.length > 0 && !agent.statusData && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {agent.skillNames.map(name => (
            <span key={name} className="text-[10px] px-2 py-0.5 bg-accent/8 border border-accent/15 rounded text-accent">
              {name}
            </span>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 mt-auto pt-2" onClick={e => e.stopPropagation()}>
        {!agent.launched ? (
          <button
            onClick={() => onLaunch(agent)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-accent hover:bg-accent-hover rounded-xl transition-colors"
          >
            <Play size={12} />
            Launch in Terminal
          </button>
        ) : (
          <button
            disabled
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-text-muted bg-bg-primary border border-border rounded-xl cursor-default"
          >
            <CheckCircle2 size={12} />
            Launched
          </button>
        )}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-2 text-xs text-text-muted border border-border rounded-xl hover:bg-bg-surface-hover transition-colors"
        >
          {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Attention reason */}
      {needsAttention && agent.statusData?.attentionReason && (
        <div className="mt-3 p-2.5 bg-error/5 border border-error/20 rounded-lg">
          <p className="text-xs text-error font-medium">{agent.statusData.attentionReason}</p>
        </div>
      )}
    </div>
  );
}
