'use client';

import { useEffect, useRef } from 'react';
import { api } from '../api';

export function useSSE(onEvent: (event: { type: string; data: any }) => void) {
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const token = api.getToken();
    if (!token) return;

    const url = api.getEventStreamUrl();
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.addEventListener('new_email', (e) => {
      const data = JSON.parse(e.data);
      onEvent({ type: 'new_email', data });

      // Auto-classify new emails via local AI route
      api.classifyEmail(data.id).catch((err) =>
        console.warn('Auto-classify failed:', err)
      );
    });

    es.addEventListener('draft_ready', (e) => {
      onEvent({ type: 'draft_ready', data: JSON.parse(e.data) });
    });

    es.addEventListener('email_classified', (e) => {
      onEvent({ type: 'email_classified', data: JSON.parse(e.data) });
    });

    es.onerror = () => {
      // EventSource will auto-reconnect
      console.warn('SSE connection error, reconnecting...');
    };

    return () => {
      es.close();
    };
  }, [onEvent]);

  return eventSourceRef;
}
