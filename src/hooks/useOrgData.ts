import { useState, useEffect, useRef } from 'react';
import type { OrgData } from '../types';
import orgDataJson from '../data/org.json';

const STATIC_FALLBACK = orgDataJson as unknown as OrgData;

export function useOrgData() {
  const [data, setData] = useState<OrgData>(STATIC_FALLBACK);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      // Try fetching live data from the HQ server
      try {
        const res = await fetch('/api/org');
        if (res.ok) {
          const liveData = await res.json() as OrgData;
          if (!cancelled) {
            setData(liveData);
            setLoading(false);
            connectSSE();
          }
          return;
        }
      } catch {
        // Server not running — fall back to static
      }

      // Fallback: use static JSON
      if (!cancelled) {
        setLoading(false);
      }
    }

    function connectSSE() {
      const es = new EventSource('/api/org/events');
      eventSourceRef.current = es;

      es.addEventListener('org-update', (event) => {
        try {
          const updated = JSON.parse(event.data) as OrgData;
          if (!cancelled) {
            setData(updated);
          }
        } catch {
          // Ignore malformed messages
        }
      });

      es.onopen = () => {
        if (!cancelled) setLive(true);
      };

      es.onerror = () => {
        if (!cancelled) setLive(false);
        // EventSource auto-reconnects
      };
    }

    init();

    return () => {
      cancelled = true;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  return { data, loading, live };
}
