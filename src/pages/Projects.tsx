import { useOutletContext } from 'react-router-dom';
import { useState } from 'react';
import { FolderOpen, Brain } from 'lucide-react';
import type { OrgData, Project } from '../types';
import { Badge } from '../components/shared/Badge';
import { DetailPanel } from '../components/shared/DetailPanel';
import { MarkdownRenderer } from '../components/shared/MarkdownRenderer';

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="glass-card rounded-2xl p-5 text-left card-glow group w-full"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0">
          <FolderOpen size={20} className="text-accent" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">
            {project.displayName}
          </h3>
          <p className="text-[10px] text-text-muted font-mono mt-0.5 truncate">{project.path}</p>
          <p className="text-xs text-text-secondary mt-2 line-clamp-2">{project.memorySummary}</p>
          <div className="flex gap-2 mt-3">
            {project.hasMemory && (
              <Badge variant="success">
                <span className="flex items-center gap-1"><Brain size={10} /> Has Memory</span>
              </Badge>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

export function Projects() {
  const data = useOutletContext<OrgData>();
  const [selected, setSelected] = useState<Project | null>(null);

  return (
    <>
      <div className="max-w-4xl">
        <p className="text-sm text-text-secondary mb-5">
          Project-specific contexts with persistent memory across conversations.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {data.projects.map(project => (
            <ProjectCard key={project.id} project={project} onClick={() => setSelected(project)} />
          ))}
        </div>
      </div>

      <DetailPanel
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.displayName || ''}
        subtitle={selected?.path}
      >
        {selected?.memoryContent && (
          <MarkdownRenderer content={selected.memoryContent} />
        )}
      </DetailPanel>
    </>
  );
}
