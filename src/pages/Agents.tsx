import { useOutletContext } from 'react-router-dom';
import { useState } from 'react';
import * as Icons from 'lucide-react';
import type { OrgData, Agent } from '../types';
import { Badge } from '../components/shared/Badge';
import { DetailPanel } from '../components/shared/DetailPanel';

function getIcon(name: string) {
  const iconMap: Record<string, React.ElementType> = {
    Globe: Icons.Globe,
    Search: Icons.Search,
    Map: Icons.Map,
    Eraser: Icons.Eraser,
    Eye: Icons.Eye,
    Compass: Icons.Compass,
    Blocks: Icons.Blocks,
  };
  return iconMap[name] || Icons.Bot;
}

function AgentCard({ agent, onClick }: { agent: Agent; onClick: () => void }) {
  const Icon = getIcon(agent.icon);

  return (
    <button
      onClick={onClick}
      className="glass-card rounded-2xl p-5 text-left card-glow group w-full"
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${agent.color}12` }}
        >
          <Icon size={20} style={{ color: agent.color }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">
              {agent.name}
            </h3>
          </div>
          <p className="text-xs text-text-secondary mt-1.5 line-clamp-2">{agent.description}</p>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <Badge variant="accent">{agent.type}</Badge>
            <Badge variant="info">{agent.tools.length} tools</Badge>
          </div>
        </div>
      </div>
    </button>
  );
}

export function Agents() {
  const data = useOutletContext<OrgData>();
  const [selected, setSelected] = useState<Agent | null>(null);

  return (
    <>
      <div>
        <p className="text-sm text-text-secondary mb-5">
          Specialized sub-agents that Claude can spawn for complex, multi-step tasks.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {data.agents.map(agent => (
            <AgentCard key={agent.id} agent={agent} onClick={() => setSelected(agent)} />
          ))}
        </div>
      </div>

      <DetailPanel
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name || ''}
        subtitle={selected?.type}
      >
        {selected && (
          <div className="space-y-6">
            {/* Description */}
            <div>
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Description</h4>
              <p className="text-sm text-text-secondary leading-relaxed">{selected.description}</p>
            </div>

            {/* Available Tools */}
            <div>
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                Available Tools ({selected.tools.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {selected.tools.map((tool, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1.5 bg-bg-primary border border-border rounded-xl text-xs text-text-secondary font-mono"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>

            {/* Use Cases */}
            <div>
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Use Cases</h4>
              <div className="space-y-2">
                {selected.useCases.map((uc, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 px-3.5 py-2.5 bg-bg-primary border border-border rounded-xl"
                  >
                    <Icons.Lightbulb size={14} className="text-warning shrink-0 mt-0.5" />
                    <span className="text-xs text-text-secondary leading-relaxed">{uc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Agent Type */}
            <div>
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Agent Type</h4>
              <Badge variant="accent">{selected.type}</Badge>
            </div>
          </div>
        )}
      </DetailPanel>
    </>
  );
}
