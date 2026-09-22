import { useEffect, useMemo, useRef, useState } from 'react';
import { opsEvents } from '../../api/client';
import { useTopic } from '../../ws/useStomp';
import type { EventMessage, OrderEvent } from '../../types';

interface Row { ts: string; type: string; msg: string; worker: string | null; ref: string | null; id: string; }

function tclass(type: string) {
  if (type.includes('SUCCESS')) return 't-success';
  if (type.includes('FAIL') || type.includes('DLQ')) return 't-fail';
  if (type.includes('RETRY')) return 't-retry';
  if (type.includes('LOCK')) return 't-lock';
  if (type.includes('INVENTORY')) return 't-inv';
  return 't-default';
}
const fmt = (iso: string) =>
  iso ? new Date(iso).toLocaleTimeString('en-GB', { hour12: false }) +
  '.' + String(new Date(iso).getMilliseconds()).padStart(3, '0') : '--:--:--.---';

function normalizeEvent(event: OrderEvent | EventMessage, id: string): Row {
  const source = event as OrderEvent & EventMessage;
  return {
    id,
    ts: fmt(source.createdAt ?? source.timestamp),
    type: source.type ?? source.eventType ?? 'UNKNOWN_EVENT',
    msg: source.message ?? 'Event received',
    worker: source.worker ?? null,
    ref: source.orderRef ?? null,
  };
}

let k = 0;

export default function EventStream() {
  const [rows, setRows] = useState<Row[]>([]);
  const [paused, setPaused] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    opsEvents().then((evs: OrderEvent[]) => {
      // backend returns newest-first; show oldest-first in the console
      setRows(evs.slice().reverse().map(e => normalizeEvent(e, 'h' + e.id)));
    }).catch(() => {});
  }, []);

  useTopic<EventMessage>('/topic/events', (e) => {
    if (pausedRef.current) return;
    setRows(prev => {
      const next = [...prev, normalizeEvent(e, 'w' + (k++))];
      return next.slice(-400);
    });
  });

  useEffect(() => {
    if (!paused && boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [rows, paused]);

  const visibleRows = useMemo(() => rows, [rows]);

  return (
    <>
      <div className="ops-h">
        <div>
          <div className="ops-kicker">NIXON / SYSTEM PULSE</div>
          <h1>Live Event Stream</h1>
          <p>Persisted to the <code>order_events</code> table and streamed over <code>/topic/events</code>.</p>
        </div>
        <div className="event-actions">
          <span className="event-count"><i /> {rows.length} events buffered</span>
          <button className="ops-btn ghost" onClick={() => setPaused(p => !p)}>
            {paused ? '▶ Resume' : '⏸ Pause'}
          </button>
          <button className="ops-btn ghost" onClick={() => setRows([])}>Clear</button>
        </div>
      </div>

      <div className="console" ref={boxRef}>
        {rows.length === 0 && <div style={{ color: 'var(--txt-faint)' }}>Waiting for events… fire a test to populate the stream.</div>}
        {visibleRows.map(r => (
          <div key={r.id} className={`ev ${tclass(r.type)}`}>
            <span className="ts">{r.ts}</span>
            <span className="tag">{r.type}</span>
            <span className="msg">
              {r.ref && <b style={{ color: 'var(--txt)' }}>{r.ref} </b>}
              {r.worker && <span style={{ color: 'var(--v)' }}>{r.worker} </span>}
              {r.msg}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
