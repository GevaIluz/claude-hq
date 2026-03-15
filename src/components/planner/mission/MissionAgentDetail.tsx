import { X, Copy, Check, Terminal } from 'lucide-react';
import { useState } from 'react';
import { useMission } from '../../../context/MissionContext';
import type { MissionAgent } from '../../../types';

interface MissionAgentDetailProps {
  agent: MissionAgent;
  onLaunch: (agent: MissionAgent) => void;
}

export function MissionAgentDetail({ agent, onLaunch }: MissionAgentDetailProps) {
  const { missionDispatch } = useMission();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(agent.command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const todoList = agent.statusData?.todoList || [];
  const logs = agent.statusData?.logs || [];
  const doneTodos = todoList.filter(t => t.done).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={() => missionDispatch({ type: 'HIDE_AGENT_DETAIL' })}
      />

      {/* Modal */}
      <div className="relative bg-bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🤖</span>
            <div>
              <h2 className="text-base font-semibold text-text-primary">{agent.displayName}</h2>
              <p className="text-xs text-text-muted">{agent.projectName} · {agent.status}</p>
            </div>
          </div>
          <button
            onClick={() => missionDispatch({ type: 'HIDE_AGENT_DETAIL' })}
            className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-surface-hover transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Progress */}
          {agent.statusData && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Progress</span>
                <span className="text-sm font-mono text-accent">{agent.statusData.progress}%</span>
              </div>
              <div className="h-2 bg-bg-primary rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-500"
                  style={{ width: `${agent.statusData.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Current task */}
          {agent.statusData?.currentTask && (
            <div>
              <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Current Task</div>
              <p className="text-sm text-text-primary">{agent.statusData.currentTask}</p>
            </div>
          )}

          {/* Attention reason */}
          {agent.statusData?.needsAttention && agent.statusData?.attentionReason && (
            <div className="p-4 bg-error/5 border border-error/20 rounded-xl">
              <div className="text-xs font-semibold text-error uppercase tracking-wider mb-1">Needs Attention</div>
              <p className="text-sm text-error">{agent.statusData.attentionReason}</p>
            </div>
          )}

          {/* Todo list */}
          {todoList.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                Todo List ({doneTodos}/{todoList.length})
              </div>
              <div className="space-y-1.5">
                {todoList.map((todo, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm">
                    <span className={todo.done ? 'text-success' : 'text-text-muted'}>{todo.done ? '☑' : '☐'}</span>
                    <span className={todo.done ? 'text-text-muted line-through' : 'text-text-primary'}>{todo.task}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {agent.skillNames.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Skills</div>
              <div className="flex flex-wrap gap-2">
                {agent.skillNames.map(name => (
                  <span key={name} className="text-xs px-2.5 py-1 bg-accent/8 border border-accent/15 rounded-lg text-accent">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Logs */}
          {logs.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Activity Log</div>
              <div className="bg-bg-primary border border-border rounded-xl p-4 max-h-48 overflow-y-auto">
                {logs.map((log, i) => (
                  <p key={i} className="text-[11px] font-mono text-text-secondary leading-relaxed">{log}</p>
                ))}
              </div>
            </div>
          )}

          {/* Command preview */}
          <div>
            <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Launch Command</div>
            <pre className="text-[11px] font-mono text-text-secondary bg-bg-primary border border-border rounded-xl p-4 whitespace-pre-wrap max-h-32 overflow-y-auto leading-relaxed">
              {agent.command}
            </pre>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 px-6 py-5 border-t border-border shrink-0">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs text-text-secondary border border-border rounded-xl hover:bg-bg-surface-hover transition-colors"
          >
            {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
            {copied ? 'Copied!' : 'Copy Command'}
          </button>
          {!agent.launched && (
            <button
              onClick={() => {
                onLaunch(agent);
                missionDispatch({ type: 'HIDE_AGENT_DETAIL' });
              }}
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-medium text-white bg-accent hover:bg-accent-hover rounded-xl transition-colors"
            >
              <Terminal size={13} />
              Launch in Terminal
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
