import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { myOrders, getOrder, money } from '../../api/client';
import { useTopic } from '../../ws/useStomp';
import type { OrderView, OrderDetail } from '../../types';

const TRACK = ['ORDER_PLACED', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED'];
const TRACK_LABEL: Record<string, string> = {
  ORDER_PLACED: 'Placed', PROCESSING: 'Processing', PACKED: 'Packed',
  SHIPPED: 'Shipped', DELIVERED: 'Delivered',
};

function Tracker({ status }: { status: string }) {
  if (status === 'FAILED') {
    return <div style={{ color: 'var(--coral)', fontWeight: 600, marginTop: 16 }}>
      This order failed and was not fulfilled.
    </div>;
  }
  const idx = TRACK.indexOf(status);
  return (
    <div className="track">
      {TRACK.map((s, i) => (
        <div key={s} className={`track-step ${i < idx ? 'reached' : i === idx ? 'current reached' : ''}`}>
          <div className="node">{i < idx ? '✓' : i + 1}</div>
          {TRACK_LABEL[s]}
        </div>
      ))}
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  return (
    <span className={`status-chip st-${status}`}>
      <span className="d" />{status.replace(/_/g, ' ')}
    </span>
  );
}

export default function Orders() {
  const { id } = useParams();
  if (id) return <OrderDetailView id={Number(id)} />;
  return <OrderList />;
}

function OrderList() {
  const [orders, setOrders] = useState<OrderView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    myOrders().then(setOrders).catch(() => setOrders([])).finally(() => setLoading(false));
  }, []);

  // Live status updates pushed from the backend as orders are processed.
  useTopic<OrderView>('/topic/orders', (o) => {
    setOrders(prev => {
      const i = prev.findIndex(x => x.id === o.id);
      if (i === -1) return prev; // only track this customer's own orders already loaded
      const next = prev.slice(); next[i] = o; return next;
    });
  });

  if (loading) return <div className="loader"><div className="spin" /></div>;

  if (orders.length === 0) {
    return (
      <div className="container page">
        <div className="empty"><div className="big">❖</div>
          <h2 style={{ marginBottom: 8 }}>No orders yet</h2>
          <p className="muted" style={{ marginBottom: 20 }}>Your placed orders will appear here with live tracking.</p>
          <Link to="/products" className="btn btn-nova">Start shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container page">
      <div className="section-head"><h2>My orders</h2><span className="muted">{orders.length} orders</span></div>
      <div className="card">
        {orders.map(o => (
          <div className="order-row" key={o.id}>
            <div>
              <Link to={`/orders/${o.id}`} className="order-ref">{o.ref}</Link>
              <div className="muted" style={{ fontSize: '0.85rem', margin: '4px 0' }}>
                {money(o.total)} · {new Date(o.createdAt).toLocaleString()}
              </div>
              <Tracker status={o.status} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <StatusChip status={o.status} />
              <div style={{ marginTop: 10 }}>
                <Link to={`/orders/${o.id}`} className="btn btn-ghost btn-sm">View timeline</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrderDetailView({ id }: { id: number }) {
  const [detail, setDetail] = useState<OrderDetail | null>(null);

  const load = () => getOrder(id).then(setDetail).catch(() => {});
  useEffect(() => { load(); }, [id]);

  // Re-pull the timeline whenever this order changes state.
  useTopic<OrderView>('/topic/orders', (o) => { if (o.id === id) load(); });

  if (!detail) return <div className="loader"><div className="spin" /></div>;
  const { order, items, timeline } = detail;

  return (
    <div className="container page">
      <Link to="/orders" className="muted" style={{ fontSize: '0.88rem' }}>← All orders</Link>
      <div className="section-head" style={{ marginTop: 12 }}>
        <h2 style={{ fontFamily: 'var(--font-mono)' }}>{order.ref}</h2>
        <StatusChip status={order.status} />
      </div>

      <div className="two-col">
        <div className="card" style={{ padding: 24 }}>
          <Tracker status={order.status} />
          <h3 style={{ margin: '28px 0 12px' }}>Items</h3>
          {items.map(it => (
            <div key={it.id} className="sum-row">
              <span>{it.quantity} × {it.productName}</span><span>{money(it.unitPrice * it.quantity)}</span>
            </div>
          ))}

          <h3 style={{ margin: '24px 0 12px' }}>Processing timeline</h3>
          <div className="muted" style={{ fontSize: '0.85rem', marginBottom: 12 }}>
            Every step below is a real backend event persisted in MySQL.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {timeline.map(e => (
              <div key={e.id} style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', color: 'var(--ink-faint)', minWidth: 96 }}>
                  {new Date(e.createdAt).toLocaleTimeString('en-GB', { hour12: false })}
                </span>
                <span style={{ fontWeight: 600, fontSize: '0.85rem', minWidth: 190, fontFamily: 'var(--font-mono)' }}>
                  {e.type}
                </span>
                <span className="muted" style={{ fontSize: '0.85rem' }}>{e.message}</span>
              </div>
            ))}
          </div>
        </div>

        <aside className="card summary">
          <h3>Details</h3>
          <div className="sum-row"><span>Total</span><span>{money(order.total)}</span></div>
          <div className="sum-row"><span>Placed</span><span>{new Date(order.createdAt).toLocaleDateString()}</span></div>
          <div className="sum-row"><span>Processing</span><span>{order.processing}</span></div>
          {order.worker && <div className="sum-row"><span>Handled by</span><span style={{ fontFamily: 'var(--font-mono)' }}>{order.worker}</span></div>}
          {order.retryCount > 0 && <div className="sum-row"><span>Retries</span><span>{order.retryCount}</span></div>}
          {order.failureReason && <div className="sum-row"><span>Reason</span><span style={{ color: 'var(--coral)' }}>{order.failureReason}</span></div>}
        </aside>
      </div>
    </div>
  );
}
