import { useOutletContext } from 'react-router-dom';
import { ArrowDown, Terminal } from 'lucide-react';
import type { OrgData } from '../types';
import { Badge } from '../components/shared/Badge';

const eventColors: Record<string, string> = {
  UserPromptSubmit: '#E27B58',
  PreToolUse: '#E5A84B',
  PostToolUse: '#5CB87A',
  Stop: '#D9534F',
};

export function Hooks() {
  const data = useOutletContext<OrgData>();

  return (
    <div className="max-w-3xl">
      <p className="text-sm text-text-secondary mb-6">
        Lifecycle hooks that run at specific points during Claude's execution pipeline. Powered by Hookify.
      </p>

      {/* Flow Diagram */}
      <div className="space-y-0">
        {data.hooks.map((hook, i) => (
          <div key={hook.event}>
            {/* Hook Card */}
            <div className="glass-card rounded-2xl p-5 card-glow">
              <div className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${eventColors[hook.event] || '#6366f1'}15` }}
                >
                  <Terminal size={18} style={{ color: eventColors[hook.event] || '#6366f1' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-text-primary">{hook.event}</h3>
                    <Badge variant="accent">{hook.source}</Badge>
                  </div>
                  <p className="text-xs text-text-secondary mt-1">{hook.description}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-text-muted">Handler:</span>
                      <code className="text-[11px] text-accent font-mono bg-bg-primary px-1.5 py-0.5 rounded">
                        {hook.command}
                      </code>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-text-muted">Timeout:</span>
                      <span className="text-[11px] text-text-secondary">{hook.timeout}s</span>
                    </div>
                  </div>
                </div>
                {/* Step number */}
                <div className="w-7 h-7 rounded-full bg-bg-primary border border-border flex items-center justify-center shrink-0">
                  <span className="text-xs font-mono text-text-muted">{i + 1}</span>
                </div>
              </div>
            </div>

            {/* Connector Arrow */}
            {i < data.hooks.length - 1 && (
              <div className="flex justify-center py-1">
                <ArrowDown size={16} className="text-border" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Explanation */}
      <div className="mt-6 p-4 glass-card rounded-2xl">
        <p className="text-xs text-text-muted leading-relaxed">
          Hooks execute Python scripts at each lifecycle stage. They can validate inputs, modify behavior,
          enforce patterns, and perform cleanup. All hooks are managed by the Hookify plugin with a {data.hooks[0]?.timeout || 10}s timeout per execution.
        </p>
      </div>
    </div>
  );
}
