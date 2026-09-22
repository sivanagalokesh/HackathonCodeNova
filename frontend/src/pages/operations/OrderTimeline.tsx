import { useEffect, useState } from 'react';
import { opsOrder, money } from '../../api/client';
import type { OrderDetail, OrderEvent } from '../../types';

const LOCK_STEPS = [
  { key: 'INVENTORY_LOCK_REQUESTED', e: '🔒', label: 'Lock requested' },
  { key: 'INVENTORY_LOCK_ACQUIRED', e: '🔐', label: 'Lock acquired' },
  { key: 'INVENTORY_CHECKED', e: '✓', label: 'Stock validated' },
  { key: 'INVENTORY_DEDUCTED', e: '📉', label: 'Inventory updated' },
  { key: 'INVENTORY_LOCK_RELEASED', e: '🔓', label: 'Lock released' },
];

function cls(type: string) {
  if (type.includes('SUCCESS')) return 'ok';
  if (type.includes('FAIL') || type.includes('DLQ') || type === 'ORDER_FAILED') return 'err';
  if (type.includes('RETRY')) return 'retry';
  if (type.includes('LOCK') || type.includes('INVENTORY')) return 'lock';
  return '';
}

export default function OrderTimeline({ orderId, onClose }: { orderId: number; onClose: () => void }) {
  const [d, setD] = useState<OrderDetail | null>(null);

  useEffect(() => { opsOrder(orderId).then(setD).catch(() => {}); }, [orderId]);

  const types = new Set((d?.timeline ?? []).map((e: OrderEvent) => e.type));

  return (
    <div className="ops-modal" onClick={onClose}>
      <div className="box" onClick={e => e.stopPropagation()}>
        <div className="box-h">
          <div>
            <h2 style={{ fontFamily: 'var(--mono)' }}>{d?.order.ref ?? `#${orderId}`}</h2>
            {d && <div style={{ color: 'var(--txt-soft)', fontSize: '0.84rem', marginTop: 4 }}>
              {d.order.customerName} · {money(d.order.total)} · {d.order.source}
              {d.order.worker && ` · ${d.order.worker}`}
            </div>}
          </div>
          <button className="x" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {!d ? <div className="ops-empty">Loading timeline…</div> : (
          <>
            <div className="lock-viz">
              {LOCK_STEPS.map(s => (
                <div key={s.key} className={`lock-step ${types.has(s.key) ? 'hit' : ''}`}>
                  <span className="le">{s.e}</span>{s.label}
                </div>
              ))}
            </div>

            <div className="timeline">
              {d.timeline.map(e => (
                <div key={e.id} className={`tl-item ${cls(e.type)}`}>
                  <span className="tl-dot">●</span>
                  <div className="tl-type">{e.type}</div>
                  <div className="tl-msg">{e.message}</div>
                  <div className="tl-meta">
                    <span>{new Date(e.createdAt).toLocaleTimeString('en-GB', { hour12: false })}
                      .{String(new Date(e.createdAt).getMilliseconds()).padStart(3, '0')}</span>
                    {e.worker && <span>{e.worker}</span>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
