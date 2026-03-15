import { useOutletContext } from 'react-router-dom';
import { useState } from 'react';
import { Server, Cloud, Wifi, WifiOff, Wrench } from 'lucide-react';
import type { OrgData, McpServer } from '../types';
import { Badge } from '../components/shared/Badge';
import { DetailPanel } from '../components/shared/DetailPanel';

function McpCard({ server, onClick }: { server: McpServer; onClick: () => void }) {
  const authVariant = server.authStatus === 'connected' ? 'success' : server.authStatus === 'needs-auth' ? 'warning' : 'default';

  return (
    <button
      onClick={onClick}
      className="glass-card rounded-2xl p-5 text-left card-glow group"
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
          server.type === 'custom' ? 'bg-accent/10' : 'bg-info/10'
        }`}>
          {server.type === 'custom' ? (
            <Server size={20} className="text-accent" />
          ) : (
            <Cloud size={20} className="text-info" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors truncate">
              {server.name}
            </h3>
          </div>
          <p className="text-xs text-text-secondary mt-1 line-clamp-2">{server.description}</p>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <Badge variant={authVariant}>
              {server.authStatus === 'connected' ? (
                <span className="flex items-center gap-1"><Wifi size={10} /> Connected</span>
              ) : (
                <span className="flex items-center gap-1"><WifiOff size={10} /> Needs Auth</span>
              )}
            </Badge>
            {server.toolCount > 0 && <Badge variant="accent">{server.toolCount} tools</Badge>}
            <Badge>{server.transport}</Badge>
          </div>
        </div>
      </div>
    </button>
  );
}

export function McpServers() {
  const data = useOutletContext<OrgData>();
  const [selected, setSelected] = useState<McpServer | null>(null);

  const custom = data.mcpServers.filter(m => m.type === 'custom');
  const external = data.mcpServers.filter(m => m.type === 'external');

  return (
    <>
      <div className="space-y-8">
        <p className="text-sm text-text-secondary">
          Model Context Protocol servers that extend Claude's capabilities with external tools and services.
        </p>

        {/* Custom MCPs */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Wrench size={16} className="text-accent" />
            <h3 className="text-sm font-semibold text-text-primary">Custom ({custom.length})</h3>
            <span className="text-xs text-text-muted">Check Point internal servers</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {custom.map(server => (
              <McpCard key={server.id} server={server} onClick={() => setSelected(server)} />
            ))}
          </div>
        </section>

        {/* External MCPs */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Cloud size={16} className="text-info" />
            <h3 className="text-sm font-semibold text-text-primary">External ({external.length})</h3>
            <span className="text-xs text-text-muted">Third-party integrations</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {external.map(server => (
              <McpCard key={server.id} server={server} onClick={() => setSelected(server)} />
            ))}
          </div>
        </section>
      </div>

      <DetailPanel
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name || ''}
        subtitle={selected?.type === 'custom' ? selected?.packageName : selected?.transport}
      >
        {selected && (
          <div className="space-y-5">
            <div>
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Info</h4>
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-xs text-text-muted">Type</span>
                  <Badge variant={selected.type === 'custom' ? 'accent' : 'info'}>{selected.type}</Badge>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-xs text-text-muted">Transport</span>
                  <span className="text-xs text-text-secondary font-mono">{selected.transport}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-xs text-text-muted">Auth Status</span>
                  <Badge variant={selected.authStatus === 'connected' ? 'success' : 'warning'}>
                    {selected.authStatus}
                  </Badge>
                </div>
                {selected.packageName && (
                  <div className="flex justify-between py-2 border-b border-border/50">
                    <span className="text-xs text-text-muted">Package</span>
                    <span className="text-xs text-text-secondary font-mono">{selected.packageName}</span>
                  </div>
                )}
              </div>
            </div>

            {selected.tools.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                  Tools ({selected.tools.length})
                </h4>
                <div className="space-y-1">
                  {selected.tools.map((tool, i) => (
                    <div key={i} className="px-3 py-2 bg-bg-primary border border-border rounded-lg">
                      <div className="text-xs font-mono text-accent">{tool.name}</div>
                      <div className="text-[11px] text-text-muted mt-0.5">{tool.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Description</h4>
              <p className="text-sm text-text-secondary">{selected.description}</p>
            </div>
          </div>
        )}
      </DetailPanel>
    </>
  );
}
