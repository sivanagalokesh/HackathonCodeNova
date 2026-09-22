import { useEffect, useState } from 'react';
import {
  getProducts, runLoadTest, runRetryTest, runPermanentFailure,
  resetInventory, opsMetrics, HERO_PRODUCT_ID,
} from '../../api/client';
import { useTopic } from '../../ws/useStomp';
import type { Product, LoadTestResult, MetricsView } from '../../types';

export default function ConcurrentTest() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState(HERO_PRODUCT_ID);
  const [inventory, setInventory] = useState(20);
  const [orders, setOrders] = useState(50);
  const [qty, setQty] = useState(1);
  const [workers, setWorkers] = useState(5);

  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<LoadTestResult | null>(null);
  const [live, setLive] = useState<MetricsView | null>(null);
  const [msg, setMsg] = useState<string>('');

  useEffect(() => {
    getProducts().then(setProducts).catch(() => {});
    opsMetrics().then(setLive).catch(() => {});
  }, []);
  useTopic<MetricsView>('/topic/metrics', setLive);

  const start = async () => {
    setRunning(true); setResult(null); setMsg('');
    try {
      const r = await runLoadTest({
        productId, orders, quantityPerOrder: qty, workers, resetInventoryTo: inventory,
      });
      setResult(r);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || 'Test failed to run.');
    } finally {
      setRunning(false);
    }
  };

  const flash = async (fn: () => Promise<string>) => {
    try { setMsg(await fn()); } catch { setMsg('Action failed.'); }
  };

  const oversold = result ? (result.successful * qty) > result.initialInventory || result.negativeInventory : false;

  return (
    <>
      <div className="ops-h">
        <div>
          <h1>Concurrent Test Panel</h1>
          <p>Fires real, concurrent orders through the Spring Boot thread pool against live MySQL inventory.</p>
        </div>
      </div>

      <div className="ct-grid">
        {/* ---- form ---- */}
        <div className="panel ct-form">
          <label>Product</label>
          <select value={productId} onChange={e => setProductId(Number(e.target.value))}>
            {products.map(p => <option key={p.id} value={p.id}>{p.name} (stock {p.stock})</option>)}
          </select>

          <label>Initial inventory (reset before run)</label>
          <input type="number" min={0} value={inventory} onChange={e => setInventory(Number(e.target.value))} />

          <label>Number of concurrent orders</label>
          <input type="number" min={1} value={orders} onChange={e => setOrders(Number(e.target.value))} />

          <label>Quantity per order</label>
          <input type="number" min={1} value={qty} onChange={e => setQty(Number(e.target.value))} />

          <label>Worker threads</label>
          <input type="number" min={1} max={64} value={workers} onChange={e => setWorkers(Number(e.target.value))} />

          <div className="ct-actions">
            <button className="ops-btn full" onClick={start} disabled={running}>
              {running ? 'Running…' : '⚡ Start concurrent test'}
            </button>
            <button className="ops-btn ghost full" disabled={running}
                    onClick={() => flash(() => runRetryTest(productId))}>
              ↻ Controlled retry test (fails 2×, then succeeds)
            </button>
            <button className="ops-btn ghost full" disabled={running}
                    onClick={() => flash(() => runPermanentFailure(productId))}>
              ⚠ Permanent-failure test (→ dead-letter queue)
            </button>
            <button className="ops-btn ghost full" disabled={running}
                    onClick={() => flash(() => resetInventory(productId, inventory))}>
              ⟳ Reset inventory to {inventory}
            </button>
          </div>
          {msg && <div style={{ marginTop: 12, color: 'var(--txt-soft)', fontSize: '0.84rem' }}>{msg}</div>}
        </div>

        {/* ---- live + results ---- */}
        <div>
          <div className="panel">
            <div className="panel-h"><h2>Live while running</h2><span className="hint">/topic/metrics</span></div>
            {live && (
              <div className="result-grid">
                <div className="result-cell"><div className="rc">Processing</div><div className="rv" style={{ color: 'var(--warn)' }}>{live.processing}</div></div>
                <div className="result-cell"><div className="rc">Queued</div><div className="rv" style={{ color: 'var(--info)' }}>{live.queued}</div></div>
                <div className="result-cell"><div className="rc">Active workers</div><div className="rv" style={{ color: 'var(--v)' }}>{live.activeWorkers}/{live.totalWorkers}</div></div>
                <div className="result-cell"><div className="rc">Successful</div><div className="rv" style={{ color: 'var(--ok)' }}>{live.successful}</div></div>
                <div className="result-cell"><div className="rc">Out of stock</div><div className="rv" style={{ color: 'var(--err)' }}>{live.failed}</div></div>
                <div className="result-cell"><div className="rc">Inventory</div><div className="rv">{live.currentInventoryHero}</div></div>
              </div>
            )}
          </div>

          {result && (
            <div className="panel" style={{ marginTop: 18 }}>
              <div className="panel-h"><h2>Test result</h2><span className="hint">{result.wallClockMs} ms wall-clock</span></div>
              <div className="result-grid">
                <div className="result-cell"><div className="rc">Submitted</div><div className="rv">{result.submitted}</div></div>
                <div className="result-cell"><div className="rc">Successful</div><div className="rv" style={{ color: 'var(--ok)' }}>{result.successful}</div></div>
                <div className="result-cell"><div className="rc">Out of stock</div><div className="rv" style={{ color: 'var(--err)' }}>{result.outOfStock}</div></div>
                <div className="result-cell"><div className="rc">Technical failures</div><div className="rv" style={{ color: 'var(--warn)' }}>{result.technicalFailures}</div></div>
                <div className="result-cell"><div className="rc">Retries</div><div className="rv">{result.retries}</div></div>
                <div className="result-cell"><div className="rc">Dead-letter</div><div className="rv" style={{ color: 'var(--err)' }}>{result.deadLetter}</div></div>
                <div className="result-cell"><div className="rc">Initial inventory</div><div className="rv">{result.initialInventory}</div></div>
                <div className="result-cell"><div className="rc">Final inventory</div><div className="rv">{result.finalInventory}</div></div>
                <div className="result-cell"><div className="rc">Peak workers</div><div className="rv" style={{ color: 'var(--v)' }}>{result.peakActiveWorkers}</div></div>
                <div className="result-cell"><div className="rc">Avg processing</div><div className="rv" style={{ fontSize: '1.3rem' }}>{result.avgProcessingMs.toFixed(0)}ms</div></div>
              </div>

              <div className={`verdict ${oversold ? 'fail' : 'pass'}`}>
                {oversold
                  ? <>✕ Overselling detected — this should never happen.</>
                  : <>✓ No overselling. Final inventory {result.finalInventory} ≥ 0, successful units ({result.successful * qty}) ≤ initial ({result.initialInventory}).</>}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
