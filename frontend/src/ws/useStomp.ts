import { useEffect, useRef, useState } from 'react';
import { hub } from './stomp';

/** Subscribe to a topic; `handler` is kept in a ref so re-renders don't resubscribe. */
export function useTopic<T = any>(topic: string, handler: (body: T) => void) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    const off = hub.subscribe(topic, (b) => ref.current(b));
    return off;
  }, [topic]);
}

/** Live connection status for the "LIVE / OFFLINE" indicator. */
export function useConnection(): boolean {
  const [up, setUp] = useState(false);
  useEffect(() => hub.onStatus(setUp), []);
  return up;
}
