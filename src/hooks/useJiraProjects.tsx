import { useState, useCallback } from 'react';
import type { PlannerProject } from '../types';

interface JiraIssue {
  key: string;
  fields: {
    summary: string;
    status: { name: string };
    priority: { name: string };
    issuetype: { name: string };
    project: { key: string; name: string };
    assignee?: { displayName: string };
    updated: string;
    created: string;
    customfield_10004?: string[]; // Sprint field (Jira Server format)
  };
}

interface JiraSearchResponse {
  issues: JiraIssue[];
  total: number;
}

export interface JiraTicket extends PlannerProject {
  jiraKey: string;
  status: string;
  priority: string;
  issueType: string;
  sprint: string | null;
  sprintState: 'active' | 'closed' | 'future' | null;
}

/** Parse sprint string like "com.atlassian.greenhopper...Sprint@123[id=...,name=CP.2w.2026.Q1.5,state=ACTIVE,...]" */
function parseSprint(raw: string): { name: string; state: string } | null {
  const nameMatch = raw.match(/name=([^,\]]+)/);
  const stateMatch = raw.match(/state=([^,\]]+)/);
  if (!nameMatch) return null;
  return { name: nameMatch[1], state: (stateMatch?.[1] || 'unknown').toLowerCase() };
}

function getLatestSprint(sprints?: string[]): { name: string; state: string } | null {
  if (!sprints || sprints.length === 0) return null;
  // Parse all, prefer active > future > closed
  const parsed = sprints.map(parseSprint).filter(Boolean) as { name: string; state: string }[];
  return (
    parsed.find(s => s.state === 'active') ||
    parsed.find(s => s.state === 'future') ||
    parsed[parsed.length - 1] || null
  );
}

function issuesToTickets(issues: JiraIssue[]): JiraTicket[] {
  return issues.map(issue => {
    const sprint = getLatestSprint(issue.fields.customfield_10004);
    return {
      instanceId: crypto.randomUUID(),
      projectId: issue.key,
      source: 'jira' as const,
      displayName: issue.fields.summary,
      description: `${issue.key} · ${issue.fields.status.name} · ${issue.fields.priority.name}`,
      agents: [],
      jiraKey: issue.key,
      status: issue.fields.status.name,
      priority: issue.fields.priority.name,
      issueType: issue.fields.issuetype.name,
      sprint: sprint?.name || null,
      sprintState: (sprint?.state as JiraTicket['sprintState']) || null,
    };
  });
}

export type JiraGroup = { label: string; state: 'active' | 'closed' | 'future' | 'backlog'; tickets: JiraTicket[] };

function groupBySprint(tickets: JiraTicket[]): JiraGroup[] {
  const groups = new Map<string, JiraGroup>();

  for (const t of tickets) {
    const label = t.sprint || 'Backlog';
    const state = t.sprintState || 'backlog';
    if (!groups.has(label)) {
      groups.set(label, { label, state, tickets: [] });
    }
    groups.get(label)!.tickets.push(t);
  }

  // Sort: active sprints first, then future, then backlog, then closed
  const order = { active: 0, future: 1, backlog: 2, closed: 3 };
  return Array.from(groups.values()).sort((a, b) => order[a.state] - order[b.state]);
}

export function useJiraProjects() {
  const [tickets, setTickets] = useState<JiraTicket[]>([]);
  const [groups, setGroups] = useState<JiraGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [synced, setSynced] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sync = useCallback(async (jql?: string) => {
    setLoading(true);
    setError(null);

    try {
      const query = jql || 'assignee = currentUser() AND status != Done ORDER BY updated DESC';
      const res = await fetch(`/api/jira/search?jql=${encodeURIComponent(query)}&maxResults=50`);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(errData.error || `Jira API returned ${res.status}`);
      }

      const data = (await res.json()) as JiraSearchResponse;
      const allTickets = issuesToTickets(data.issues);
      const grouped = groupBySprint(allTickets);

      setTickets(allTickets);
      setGroups(grouped);
      setSynced(true);
      setLoading(false);

      // Return as PlannerProject[] for backward compat with Planner.tsx
      return allTickets as PlannerProject[];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch Jira issues';
      setError(message);
      setLoading(false);
      return [];
    }
  }, []);

  // Expose both flat list (for canvas) and grouped (for sidebar)
  return { projects: tickets as PlannerProject[], tickets, groups, loading, synced, sync, error };
}
