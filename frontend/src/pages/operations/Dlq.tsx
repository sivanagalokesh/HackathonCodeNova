import { useEffect, useState } from 'react';
import { opsDlq } from '../../api/client';
import { useTopic } from '../../ws/useStomp';
import OrderTimeline from './OrderTimeline';
import type { DeadLetter, EventMessage } from '../../types';

export default function Dlq() {
  const [rows, setRows] = useState<DeadLetter[]>([]);
  const [open, setOpen] = useState<number | null>(null);

  const load = () => opsDlq().then(setRows).catch(() => {});
  useEffect(() => { load(); }, []);

  // Refresh when an order is moved to the DLQ.
  useTopic<EventMessage>('/topic/events', (e) => {
    if (e.type === 'ORDER_MOVED_TO_DLQ') load();
  });

  return (
    <>
      <div className="ops-h">
        <div>
          <h1>Dead-Letter Queue</h1>
          <p>Orders that exhausted all {3} technical retries. Business failures (out of stock) never land here.</p>
        </div>
        <button className="ops-btn ghost" onClick={load}>↻ Refresh</button>
      </div>

      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="otable">
          <thead>
            <tr><th>Order</th><th>Failure Reason</th><th>Retries</th><th>Worker</th><th>Timestamp</th></tr>
          </thead>
          <tbody>
            {rows.map(d => (
              <tr key={d.id} onClick={() => setOpen(d.orderId)}>
                <td className="ref">{d.orderRef}</td>
                <td><span className="badge b-FAILED">{d.failureReason}</span></td>
                <td>{d.retryCount}</td>
                <td style={{ fontFamily: 'var(--mono)', color: 'var(--v)' }}>{d.worker}</td>
                <td style={{ color: 'var(--txt-faint)', fontFamily: 'var(--mono)', fontSize: '0.78rem' }}>
                  {new Date(d.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} className="ops-empty">
                Queue is empty. Run the permanent-failure test to see an order land here.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {open !== null && <OrderTimeline orderId={open} onClose={() => setOpen(null)} />}
    </>
  );
}
