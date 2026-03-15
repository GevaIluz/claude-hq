import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Skill } from '../types';

export interface SkillSet {
  id: string;
  label: string;
  icon: string;
  color: string;
  skillIds: string[];
}

const STORAGE_KEY = 'claude-hq-skill-sets';

// ─── Prefix-based auto-grouping ──────────────────────────────

const AUTO_GROUPS: { prefix: string; label: string; icon: string; color: string }[] = [
  { prefix: 'aws-', label: 'AWS', icon: 'Cloud', color: '#f59e0b' },
  { prefix: 'azure', label: 'Azure', icon: 'Server', color: '#0078d4' },
];

function generateDefaults(skills: Skill[]): SkillSet[] {
  const sets: SkillSet[] = [];
  const claimed = new Set<string>();

  for (const group of AUTO_GROUPS) {
    const matching = skills.filter(s => s.id.startsWith(group.prefix));
    if (matching.length > 0) {
      sets.push({
        id: group.prefix.replace(/-$/, ''),
        label: group.label,
        icon: group.icon,
        color: group.color,
        skillIds: matching.map(s => s.id),
      });
      matching.forEach(s => claimed.add(s.id));
    }
  }

  const remaining = skills.filter(s => !claimed.has(s.id));
  if (remaining.length > 0) {
    sets.push({
      id: 'other',
      label: 'Other',
      icon: 'Zap',
      color: '#8b5cf6',
      skillIds: remaining.map(s => s.id),
    });
  }

  return sets;
}

// ─── Hook ────────────────────────────────────────────────────

export function useSkillSets(skills: Skill[]) {
  const [sets, setSets] = useState<SkillSet[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SkillSet[];
        const totalBundled = parsed.reduce((n, s) => n + s.skillIds.length, 0);
        if (totalBundled === 0 && skills.length > 0) return generateDefaults(skills);
        return parsed;
      }
    } catch { /* ignore */ }
    return generateDefaults(skills);
  });

  // Persist to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sets));
  }, [sets]);

  // When skills change (live sync), add new skills to Ungrouped
  useEffect(() => {
    const allIds = new Set(sets.flatMap(s => s.skillIds));
    const newSkillIds = skills.filter(s => !allIds.has(s.id)).map(s => s.id);
    if (newSkillIds.length === 0) return;

    setSets(prev => {
      const hasUngrouped = prev.some(s => s.id === '__ungrouped');
      if (hasUngrouped) {
        return prev.map(s =>
          s.id === '__ungrouped'
            ? { ...s, skillIds: [...new Set([...s.skillIds, ...newSkillIds])] }
            : s
        );
      }
      return [...prev, {
        id: '__ungrouped',
        label: 'Ungrouped',
        icon: 'Inbox',
        color: '#6b7280',
        skillIds: newSkillIds,
      }];
    });
  }, [skills]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clean up skill IDs that no longer exist
  useEffect(() => {
    const existingIds = new Set(skills.map(s => s.id));
    setSets(prev => prev.map(s => ({
      ...s,
      skillIds: s.skillIds.filter(id => existingIds.has(id)),
    })));
  }, [skills]);

  // ─── CRUD ────────────────────────────────────────────────

  const createSet = useCallback((label: string) => {
    const id = `custom-${Date.now()}`;
    setSets(prev => [...prev, {
      id,
      label,
      icon: 'FolderOpen',
      color: '#6366f1',
      skillIds: [],
    }]);
    return id;
  }, []);

  const renameSet = useCallback((setId: string, label: string) => {
    setSets(prev => prev.map(s => s.id === setId ? { ...s, label } : s));
  }, []);

  const deleteSet = useCallback((setId: string) => {
    setSets(prev => {
      const target = prev.find(s => s.id === setId);
      if (!target) return prev;
      const orphanedIds = target.skillIds;
      const without = prev.filter(s => s.id !== setId);

      if (orphanedIds.length === 0) return without;

      const hasUngrouped = without.some(s => s.id === '__ungrouped');
      if (hasUngrouped) {
        return without.map(s =>
          s.id === '__ungrouped'
            ? { ...s, skillIds: [...s.skillIds, ...orphanedIds] }
            : s
        );
      }
      return [...without, {
        id: '__ungrouped',
        label: 'Ungrouped',
        icon: 'Inbox',
        color: '#6b7280',
        skillIds: orphanedIds,
      }];
    });
  }, []);

  const setColor = useCallback((setId: string, color: string) => {
    setSets(prev => prev.map(s => s.id === setId ? { ...s, color } : s));
  }, []);

  const moveSkill = useCallback((skillId: string, toSetId: string) => {
    setSets(prev => prev.map(s => {
      if (s.id === toSetId) {
        return s.skillIds.includes(skillId) ? s : { ...s, skillIds: [...s.skillIds, skillId] };
      }
      return { ...s, skillIds: s.skillIds.filter(id => id !== skillId) };
    }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setSets(generateDefaults(skills));
  }, [skills]);

  // ─── Derived ─────────────────────────────────────────────

  const ungroupedSkills = useMemo(() => {
    const allIds = new Set(sets.flatMap(s => s.skillIds));
    return skills.filter(s => !allIds.has(s.id));
  }, [sets, skills]);

  const getSkillsForSet = useCallback((setId: string): Skill[] => {
    const set = sets.find(s => s.id === setId);
    if (!set) return [];
    const skillMap = new Map(skills.map(s => [s.id, s]));
    return set.skillIds.map(id => skillMap.get(id)).filter(Boolean) as Skill[];
  }, [sets, skills]);

  return {
    sets,
    createSet,
    renameSet,
    deleteSet,
    setColor,
    moveSkill,
    resetToDefaults,
    ungroupedSkills,
    getSkillsForSet,
  };
}
