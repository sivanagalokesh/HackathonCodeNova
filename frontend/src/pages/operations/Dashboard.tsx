import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { opsMetrics } from '../../api/client';
import { useTopic } from '../../ws/useStomp';
import type { MetricsView } from '../../types';

function Metric({ cap, val, sub, accent, spark }:
  { cap: string; val: React.ReactNode; sub?: string; accent?: string; spark?: string }) {
  return (
    <div className={`metric ${accent ? 'accent-' + accent : ''}`}>
      {spark && <span className="spark">{spark}</span>}
      <div className="cap">{cap}</div>
      <div className="val">{val}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [m, setM] = useState<MetricsView | null>(null);

  useEffect(() => { opsMetrics().then(setM).catch(() => {}); }, []);
  useTopic<MetricsView>('/topic/metrics', setM);

  if (!m) return <div className="ops-empty">Connecting to metrics…</div>;

  return (
    <>
      <div className="ops-h">
        <div>
          <h1>System Dashboard</h1>
          <p>Every number below is computed from real Spring Boot thread-pool state, MySQL rows and WebSocket events.</p>
        </div>
        <Link to="/operations/test" className="ops-btn">⚡ Run concurrent test</Link>
      </div>

      <div className="metric-grid">
        <Metric cap="Total Orders" val={m.totalOrders} spark="❖" />
        <Metric cap="Orders / sec" val={m.ordersPerSecond.toFixed(1)} accent="v" spark="⚡" />
        <Metric cap="Processing" val={m.processing} accent="warn" spark="◉" />
        <Metric cap="Queued" val={m.queued} accent="info" spark="≣" />
        <Metric cap="Successful" val={m.successful} accent="ok" spark="✓" />
        <Metric cap="Out of Stock" val={m.failed} accent="err" spark="✕"
                sub="business failures — not retried" />
        <Metric cap="Retrying" val={m.retrying} accent="warn" spark="↻" />
        <Metric cap="Dead Letter" val={m.deadLetter} accent="err" spark="⚠" />
        <Metric cap="Active Workers" val={`${m.activeWorkers} / ${m.totalWorkers}`} accent="v" spark="◉" />
        <Metric cap="Peak Workers" val={m.peakActiveWorkers} spark="▲" />
        <Metric cap="Hero Inventory" val={m.currentInventoryHero}
                accent={m.currentInventoryHero === 0 ? 'err' : 'ok'} spark="📦"
                sub="flash-sale product stock" />
        <Metric cap="Avg Processing" val={<span className="mono">{m.avgProcessingMs.toFixed(0)}ms</span>} spark="⏱" />
      </div>

      <div className="panel" style={{ marginTop: 20 }}>
        <div className="panel-h">
          <h2>How to read this</h2>
          <span className="hint">Demo guidance for judges</span>
        </div>
        <div style={{ color: 'var(--txt-soft)', fontSize: '0.9rem', lineHeight: 1.7 }}>
          Open the <Link to="/operations/test" style={{ color: 'var(--v)' }}>Concurrent Test</Link> panel
          and fire 50 orders against 20 units with 5 workers. Watch <b>Processing</b> and <b>Active Workers</b>
          climb, <b>Hero Inventory</b> fall to exactly 0, <b>Successful</b> stop at 20 and the rest land in
          <b> Out of Stock</b> — never negative. Then run the retry and permanent-failure tests to see the
          <Link to="/operations/dlq" style={{ color: 'var(--v)' }}> dead-letter queue</Link> fill.
        </div>
      </div>
    </>
  );
}
