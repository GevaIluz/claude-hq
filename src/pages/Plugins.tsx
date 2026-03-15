import { useOutletContext } from 'react-router-dom';
import { useState } from 'react';
import * as Icons from 'lucide-react';
import type { OrgData, Plugin } from '../types';
import { Badge } from '../components/shared/Badge';
import { DetailPanel } from '../components/shared/DetailPanel';

function getIcon(name: string) {
  const iconMap: Record<string, React.ElementType> = {
    Eye: Icons.Eye,
    GitCommitHorizontal: Icons.GitCommitHorizontal,
    Sparkles: Icons.Sparkles,
    Kanban: Icons.Kanban,
    Github: Icons.Github,
    Wand2: Icons.Wand2,
    Layers: Icons.Layers,
    Anchor: Icons.Anchor,
  };
  return iconMap[name] || Icons.Puzzle;
}

function PluginCard({ plugin, onClick }: { plugin: Plugin; onClick: () => void }) {
  const Icon = getIcon(plugin.icon);

  return (
    <button
      onClick={onClick}
      className="glass-card rounded-2xl p-5 text-left card-glow group"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0">
          <Icon size={20} className="text-accent" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">
              {plugin.shortName}
            </h3>
            <Badge variant={plugin.enabled ? 'success' : 'default'}>
              {plugin.enabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
          <p className="text-xs text-text-secondary mt-1.5 line-clamp-2">{plugin.description}</p>
          <p className="text-[10px] text-text-muted mt-2 font-mono">{plugin.marketplace}</p>
        </div>
      </div>
    </button>
  );
}

export function Plugins() {
  const data = useOutletContext<OrgData>();
  const [selected, setSelected] = useState<Plugin | null>(null);

  return (
    <>
      <div>
        <p className="text-sm text-text-secondary mb-5">
          Extensions that add specialized capabilities to Claude Code.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {data.plugins.map(plugin => (
            <PluginCard key={plugin.id} plugin={plugin} onClick={() => setSelected(plugin)} />
          ))}
        </div>
      </div>

      <DetailPanel
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.shortName || ''}
        subtitle={selected?.id}
      >
        {selected && (
          <div className="space-y-5">
            {/* Documentation Link */}
            {selected.docUrl && (
              <a
                href={selected.docUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-2 px-3.5 py-2.5 bg-accent/8 border border-accent/20 rounded-xl text-xs text-accent hover:bg-accent/15 transition-colors group"
              >
                <Icons.BookOpen size={14} />
                <span className="flex-1 text-left truncate">Official Documentation</span>
                <Icons.ExternalLink size={12} className="shrink-0 opacity-60 group-hover:opacity-100" />
              </a>
            )}

            <div>
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Description</h4>
              <p className="text-sm text-text-secondary">{selected.description}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Details</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-xs text-text-muted">Status</span>
                  <Badge variant={selected.enabled ? 'success' : 'default'}>
                    {selected.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-xs text-text-muted">Marketplace</span>
                  <span className="text-xs text-text-secondary font-mono">{selected.marketplace}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-xs text-text-muted">Plugin ID</span>
                  <span className="text-xs text-text-secondary font-mono">{selected.id}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </DetailPanel>
    </>
  );
}
