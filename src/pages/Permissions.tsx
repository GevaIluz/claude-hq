import { useOutletContext } from 'react-router-dom';
import { useState } from 'react';
import * as Icons from 'lucide-react';
import type { OrgData, PermissionGroup } from '../types';
import { Badge } from '../components/shared/Badge';

function getIcon(name: string) {
  const iconMap: Record<string, React.ElementType> = {
    Cloud: Icons.Cloud,
    Server: Icons.Server,
    Terminal: Icons.Terminal,
    GitBranch: Icons.GitBranch,
    Shield: Icons.Shield,
    Wrench: Icons.Wrench,
  };
  return iconMap[name] || Icons.Key;
}

const INITIAL_SHOW = 5;

function PermGroupCard({ group }: { group: PermissionGroup }) {
  const [expanded, setExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [expandedPerm, setExpandedPerm] = useState<number | null>(null);
  const Icon = getIcon(group.icon);
  const count = group.permissions.length;
  const visiblePerms = showAll ? group.permissions : group.permissions.slice(0, INITIAL_SHOW);

  return (
    <div className="glass-card rounded-2xl overflow-hidden card-glow">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 flex items-center gap-3 text-left"
      >
        <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0">
          <Icon size={20} className="text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-text-primary">{group.category}</h3>
          <p className="text-xs text-text-muted mt-0.5">{count} whitelisted commands</p>
        </div>
        <Badge variant="accent">{count}</Badge>
        <Icons.ChevronDown
          size={16}
          className={`text-text-muted transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && (
        <div className="px-5 pb-4 space-y-1.5 border-t border-border/50 pt-3">
          {visiblePerms.map((perm, i) => (
            <div key={i}>
              <button
                onClick={() => setExpandedPerm(expandedPerm === i ? null : i)}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-bg-primary rounded-lg border border-border hover:border-border-hover transition-colors text-left group"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Icons.ChevronRight
                    size={12}
                    className={`text-text-muted shrink-0 transition-transform duration-150 ${expandedPerm === i ? 'rotate-90' : ''}`}
                  />
                  <span className="text-xs text-text-secondary group-hover:text-text-primary transition-colors truncate">
                    {perm.summary}
                  </span>
                </div>
                <Badge variant={perm.source === 'global' ? 'info' : 'default'}>{perm.source}</Badge>
              </button>
              {expandedPerm === i && (
                <div className="ml-7 mt-1 mb-1 px-3 py-2 bg-bg-surface-hover rounded-lg border border-border">
                  <code className="text-[11px] text-accent font-mono break-all">{perm.raw}</code>
                </div>
              )}
            </div>
          ))}

          {!showAll && count > INITIAL_SHOW && (
            <button
              onClick={() => setShowAll(true)}
              className="w-full text-center py-2 text-xs text-accent hover:text-accent-hover font-medium transition-colors"
            >
              Show all {count} permissions
            </button>
          )}
          {showAll && count > INITIAL_SHOW && (
            <button
              onClick={() => setShowAll(false)}
              className="w-full text-center py-2 text-xs text-text-muted hover:text-text-secondary font-medium transition-colors"
            >
              Show less
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function Permissions() {
  const data = useOutletContext<OrgData>();
  const total = data.permissions.reduce((sum, g) => sum + g.permissions.length, 0);

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-text-secondary">
          Pre-approved bash commands organized by category. {total} total permissions.
        </p>
        <div className="flex gap-2">
          <Badge variant="info">Global</Badge>
          <Badge>Local</Badge>
        </div>
      </div>

      <div className="space-y-3">
        {data.permissions.map(group => (
          <PermGroupCard key={group.category} group={group} />
        ))}
      </div>
    </div>
  );
}
