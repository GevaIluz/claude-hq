import { useState, useCallback } from 'react';
import type { Employee } from '../types';

const STORAGE_KEY = 'claude-hq-employees';

function loadEmployees(): Employee[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persist(employees: Employee[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
}

export function useEmployeeStorage() {
  const [employees, setEmployees] = useState<Employee[]>(loadEmployees);

  const saveEmployee = useCallback((employee: Employee) => {
    setEmployees(prev => {
      const updated = [employee, ...prev];
      persist(updated);
      return updated;
    });
  }, []);

  const updateEmployee = useCallback((id: string, updates: Partial<Employee>) => {
    setEmployees(prev => {
      const updated = prev.map(e =>
        e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
      );
      persist(updated);
      return updated;
    });
  }, []);

  const deleteEmployee = useCallback((id: string) => {
    setEmployees(prev => {
      const updated = prev.filter(e => e.id !== id);
      persist(updated);
      return updated;
    });
  }, []);

  return { employees, saveEmployee, updateEmployee, deleteEmployee };
}
