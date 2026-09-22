import { useEffect, useState } from 'react';
import { opsWorkers, opsMetrics } from '../../api/client';
import { useTopic } from '../../ws/useStomp';
import type { WorkerView, MetricsView } from '../../types';

export default function Workers() {
  const [workers, setWorkers] = useState<WorkerView[]>([]);
  const [m, setM] = useState<MetricsView | null>(null);

  useEffect(() => {
    opsWorkers().then(setWorkers).catch(() => {});
    opsMetrics().then(setM).catch(() => {});
  }, []);

  useTopic<WorkerView[]>('/topic/workers', setWorkers);
  useTopic<MetricsView>('/topic/metrics', setM);

  const active = workers.filter(w => w.state === 'ACTIVE').length;

  return (
    <>
      <div className="ops-h">
        <div>
          <h1>Worker Pool</h1>
          <p>Real threads from the Spring Boot <code>ThreadPoolExecutor</code>, named WORKER-01…N.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="metric" style={{ padding: '10px 16px' }}>
            <div className="cap">Active</div>
            <div className="val" style={{ fontSize: '1.5rem' }}>{active}/{workers.length}</div>
          </div>
          {m && (
            <div className="metric" style={{ padding: '10px 16px' }}>
              <div className="cap">Queued</div>
              <div className="val" style={{ fontSize: '1.5rem' }}>{m.queued}</div>
            </div>
          )}
        </div>
      </div>

      {workers.length === 0 ? (
        <div className="ops-empty">No workers reported yet.</div>
      ) : (
        <div className="worker-grid">
          {workers.map(w => (
            <div key={w.name} className={`worker ${w.state === 'ACTIVE' ? 'active' : 'idle'}`}>
              <div className="wname"><span className="wled" />{w.name}</div>
              <span className="wstate">{w.state}</span>
              <div className="word">{w.currentOrder ? `▶ ${w.currentOrder}` : '—'}</div>
              <div className="wproc">{w.processed} processed</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
