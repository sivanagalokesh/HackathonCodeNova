import { NavLink, Outlet, Link } from 'react-router-dom';
import { useConnection } from '../../ws/useStomp';

const NAV = [
  { to: '/operations', end: true, g: '▦', label: 'Dashboard' },
  { to: '/operations/workers', g: '◉', label: 'Worker Pool' },
  { to: '/operations/events', g: '≣', label: 'Event Stream' },
  { to: '/operations/orders', g: '❖', label: 'Orders' },
  { to: '/operations/analysis', g: '◒', label: 'Analysis' },
  { to: '/operations/dlq', g: '⚠', label: 'Dead-Letter Queue' },
  { to: '/operations/test', g: '⚡', label: 'Concurrent Test' },
];

export default function OperationsLayout() {
  const up = useConnection();
  return (
    <div className="ops">
      <div className="ops-shell">
        <aside className="ops-side">
          <div className="ops-brand">
            <span className="brand-mark" />
            <div>
              CodeNova
              <small>OPERATIONS CENTER</small>
            </div>
          </div>
          <nav className="ops-nav">
            {NAV.map(n => (
              <NavLink key={n.to} to={n.to} end={n.end}
                className={({ isActive }) => isActive ? 'active' : ''}>
                <span className="g">{n.g}</span>{n.label}
              </NavLink>
            ))}
          </nav>
          <Link to="/" className="back">← Back to storefront</Link>
          <div className="ops-conn">
            <div className="row">
              <span className={`live-dot ${up ? '' : 'off'}`} />
              {up ? 'WebSocket live' : 'Reconnecting…'}
            </div>
            <div className="row" style={{ marginTop: 6, color: 'var(--txt-faint)', fontSize: '0.68rem' }}>
              STOMP · /ws
            </div>
          </div>
        </aside>

        <main className="ops-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
