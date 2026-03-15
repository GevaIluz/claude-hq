import { X, Copy, Check, Rocket, Terminal } from 'lucide-react';
import { useState } from 'react';
import { useMission } from '../../../context/MissionContext';
import { generateLaunchAllScript } from '../../../utils/missionPrompt';

interface MissionLaunchAllModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

export function MissionLaunchAllModal({ onClose, onConfirm }: MissionLaunchAllModalProps) {
  const { mission } = useMission();
  const [copied, setCopied] = useState(false);

  const unlaunchedAgents = mission.agents.filter(a => !a.launched);
  const script = generateLaunchAllScript(unlaunchedAgents);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Rocket size={20} className="text-accent" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">Launch All Agents</h2>
              <p className="text-xs text-text-muted">
                {unlaunchedAgents.length} agent{unlaunchedAgents.length !== 1 ? 's' : ''} will open in separate Terminal tabs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-surface-hover transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Agent list */}
        <div className="px-6 py-4">
          <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Agents to launch</div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {unlaunchedAgents.map(agent => (
              <div key={agent.agentInstanceId} className="flex items-center gap-3 text-sm">
                <span>🤖</span>
                <span className="text-text-primary font-medium">{agent.displayName}</span>
                <span className="text-text-muted">→</span>
                <span className="text-text-secondary">{agent.projectName}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Script preview */}
        <div className="px-6 pb-4">
          <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Launch script</div>
          <pre className="text-[10px] font-mono text-text-secondary bg-bg-primary border border-border rounded-xl p-3 max-h-32 overflow-y-auto leading-relaxed">
            {script}
          </pre>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 px-6 py-5 border-t border-border">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs text-text-secondary border border-border rounded-xl hover:bg-bg-surface-hover transition-colors"
          >
            {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
            {copied ? 'Copied!' : 'Copy Script'}
          </button>
          <button
            onClick={onConfirm}
            className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-medium text-white bg-accent hover:bg-accent-hover rounded-xl transition-colors"
          >
            <Terminal size={13} />
            Launch {unlaunchedAgents.length} Agent{unlaunchedAgents.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
