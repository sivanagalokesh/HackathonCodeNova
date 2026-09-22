import { useEffect, useState } from 'react';
import { opsOrders, money } from '../../api/client';
import { useTopic } from '../../ws/useStomp';
import OrderTimeline from './OrderTimeline';
import type { OrderView } from '../../types';

export default function OpsOrders() {
  const [orders, setOrders] = useState<OrderView[]>([]);
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => { opsOrders().then(setOrders).catch(() => {}); }, []);

  useTopic<OrderView>('/topic/orders', (o) => {
    setOrders(prev => {
      const i = prev.findIndex(x => x.id === o.id);
      if (i === -1) return [o, ...prev].slice(0, 100);
      const next = prev.slice(); next[i] = o; return next;
    });
  });

  return (
    <>
      <div className="ops-h">
        <div>
          <h1>Orders</h1>
          <p>Most recent orders across every channel. Click any row for its full event timeline.</p>
        </div>
        <span className="hint" style={{ color: 'var(--txt-faint)' }}>{orders.length} shown</span>
      </div>

      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="otable">
          <thead>
            <tr>
              <th>Ref</th><th>Customer</th><th>Fulfilment</th><th>Processing</th>
              <th>Worker</th><th>Retries</th><th>Total</th><th>Source</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id} onClick={() => setOpen(o.id)}>
                <td className="ref">{o.ref}</td>
                <td>{o.customerName}</td>
                <td><span className={`badge b-${o.status}`}>{o.status}</span></td>
                <td><span className={`badge b-${o.processing}`}>{o.processing}</span></td>
                <td style={{ fontFamily: 'var(--mono)', color: 'var(--v)' }}>{o.worker ?? '—'}</td>
                <td>{o.retryCount || '—'}</td>
                <td>{money(o.total)}</td>
                <td style={{ color: 'var(--txt-faint)', fontSize: '0.78rem' }}>{o.source}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={8} className="ops-empty">No orders yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {open !== null && <OrderTimeline orderId={open} onClose={() => setOpen(null)} />}
    </>
  );
}
