import { useOutletContext } from 'react-router-dom';
import { useState } from 'react';
import { User, Cloud, Target, Users, FolderOpen } from 'lucide-react';
import type { OrgData } from '../types';
import { MarkdownRenderer } from '../components/shared/MarkdownRenderer';

export function MemoryPage() {
  const data = useOutletContext<OrgData>();
  const [activeTab, setActiveTab] = useState<'profile' | 'projects'>('profile');

  return (
    <div className="max-w-4xl space-y-6">
      <p className="text-sm text-text-secondary">
        What Claude knows about you, your work, and your active projects.
      </p>

      {/* Tab Switcher */}
      <div className="flex gap-1 glass-card rounded-2xl p-1 w-fit">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'profile' ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Profile & Context
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'projects' ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Project Memories ({data.projects.length})
        </button>
      </div>

      {activeTab === 'profile' && (
        <div className="space-y-4">
          {/* User Profile Card */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-accent/15 flex items-center justify-center">
                <User size={24} className="text-accent" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-text-primary">{data.memory.userProfile.name}</h3>
                <p className="text-xs text-text-secondary">{data.memory.userProfile.role} at {data.memory.userProfile.company}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="px-3 py-2 bg-bg-primary rounded-lg border border-border">
                <span className="text-[10px] text-text-muted uppercase tracking-wider">Team</span>
                <p className="text-sm text-text-primary mt-0.5">{data.memory.userProfile.team}</p>
              </div>
              <div className="px-3 py-2 bg-bg-primary rounded-lg border border-border">
                <span className="text-[10px] text-text-muted uppercase tracking-wider">Focus</span>
                <p className="text-sm text-text-primary mt-0.5">{data.memory.userProfile.focus}</p>
              </div>
            </div>
          </div>

          {/* AWS Context */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Cloud size={18} className="text-warning" />
              <h3 className="text-sm font-semibold text-text-primary">AWS Context</h3>
            </div>
            <div className="space-y-2">
              {Object.entries(data.memory.awsContext).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                  <span className="text-xs text-text-muted">{key}</span>
                  <span className="text-xs text-text-secondary font-mono">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Goals */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target size={18} className="text-success" />
              <h3 className="text-sm font-semibold text-text-primary">Goals</h3>
            </div>
            <ul className="space-y-2">
              {data.memory.goals.map((goal, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-accent mt-0.5 text-xs">-</span>
                  <span className="text-sm text-text-secondary">{goal}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Team */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users size={18} className="text-info" />
              <h3 className="text-sm font-semibold text-text-primary">Team</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {data.teamMembers.map(member => (
                <div key={member.name} className="flex items-center gap-2.5 px-3 py-2 bg-bg-primary rounded-lg border border-border">
                  <span className="text-lg">{member.emoji}</span>
                  <div>
                    <div className="text-xs font-medium text-text-primary">{member.name}</div>
                    <div className="text-[10px] text-text-muted">{member.location}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'projects' && (
        <div className="space-y-4">
          {data.projects.map(project => (
            <div key={project.id} className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-1">
                <FolderOpen size={16} className="text-accent" />
                <h3 className="text-sm font-semibold text-text-primary">{project.displayName}</h3>
              </div>
              <p className="text-[10px] text-text-muted font-mono mb-4">{project.path}</p>
              {project.memoryContent && (
                <MarkdownRenderer content={project.memoryContent} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
