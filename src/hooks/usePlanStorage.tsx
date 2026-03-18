import { useState, useCallback, useEffect, useRef } from 'react';
import type { PlannerState, SavedPlan } from '../types';

const STORAGE_KEY = 'claude-hq-plans';
const DEBOUNCE_MS = 500;

function loadPlans(): SavedPlan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistPlans(plans: SavedPlan[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
}

export function usePlanStorage() {
  const [plans, setPlans] = useState<SavedPlan[]>(loadPlans);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const savePlan = useCallback((state: PlannerState) => {
    if (!activePlanId) return;
    setSaveStatus('saving');

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPlans(prev => {
        const updated = prev.map(p =>
          p.id === activePlanId
            ? { ...p, name: state.planName || p.name, updatedAt: new Date().toISOString(), state }
            : p
        );
        persistPlans(updated);
        return updated;
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, DEBOUNCE_MS);
  }, [activePlanId]);

  const createPlan = useCallback((name: string): SavedPlan => {
    const plan: SavedPlan = {
      id: crypto.randomUUID(),
      name: name || `Plan — ${new Date().toLocaleDateString('en-GB')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      state: {
        planName: name || `Plan — ${new Date().toLocaleDateString('en-GB')}`,
        projects: [],
        zoomedProjectId: null,
        showPromptPreview: false,
        showSourcePanel: true,
        activeView: 'canvas' as const,
        workbenchAgentId: null,
      },
    };
    setPlans(prev => {
      const updated = [plan, ...prev];
      persistPlans(updated);
      return updated;
    });
    setActivePlanId(plan.id);
    return plan;
  }, []);

  const loadPlan = useCallback((id: string): PlannerState | null => {
    const plan = plans.find(p => p.id === id);
    if (plan) {
      setActivePlanId(id);
      return plan.state;
    }
    return null;
  }, [plans]);

  const deletePlan = useCallback((id: string) => {
    setPlans(prev => {
      const updated = prev.filter(p => p.id !== id);
      persistPlans(updated);
      return updated;
    });
    if (activePlanId === id) setActivePlanId(null);
  }, [activePlanId]);

  // cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return {
    plans,
    activePlanId,
    saveStatus,
    savePlan,
    createPlan,
    loadPlan,
    deletePlan,
  };
}
