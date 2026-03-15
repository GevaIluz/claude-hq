import { useEffect, useRef, useState } from 'react';
import type { MissionAgentStatusFile, MissionAction } from '../types';

interface UseMissionMonitorOptions {
  planId: string;
  enabled: boolean;
  dispatch: React.Dispatch<MissionAction>;
}

export function useMissionMonitor({ planId, enabled, dispatch }: UseMissionMonitorOptions) {
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!enabled || !planId) {
      setConnected(false);
      return;
    }

    const url = `/api/events/${planId}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => {
      setConnected(true);
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as MissionAgentStatusFile & { agentInstanceId: string };
        const { agentInstanceId, ...statusData } = data;
        dispatch({
          type: 'UPDATE_AGENT_STATUS_DATA',
          agentInstanceId,
          data: statusData,
        });
      } catch {
        // ignore malformed messages
      }
    };

    es.onerror = () => {
      setConnected(false);
      // EventSource auto-reconnects, so we just update the state
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
      setConnected(false);
    };
  }, [planId, enabled, dispatch]);

  return { connected };
}
