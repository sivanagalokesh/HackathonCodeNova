import { FormEvent, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '../context/AuthContext';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState<UserRole>(location.pathname.startsWith('/operations') ? 'OPERATOR' : 'CUSTOMER');
  const [email, setEmail] = useState('hello@codenova.store');
  const [password, setPassword] = useState('demo123');
  const [error, setError] = useState('');
  const destination = (location.state as { from?: string } | null)?.from ?? (role === 'OPERATOR' ? '/operations' : '/');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!signIn(email, password, role)) { setError('Use a valid email and a password with at least 4 characters.'); return; }
    navigate(destination, { replace: true });
  };

  return (
    <main className="auth-page">
      <section className="auth-art">
        <div className="auth-orbit orbit-one" /><div className="auth-orbit orbit-two" />
        <div className="auth-kicker">CODENOVA / 01</div>
        <h1>Commerce that<br /><em>keeps moving.</em></h1>
        <p>One calm command center for a catalog, a live inventory, and every order in motion.</p>
        <div className="auth-live"><span /> Live systems online <strong>24/7</strong></div>
      </section>
      <section className="auth-form-wrap">
        <div className="auth-form-head"><span className="brand-mark" /><span>Code<em>Nova</em></span></div>
        <div className="auth-form-copy"><span className="eyebrow">Welcome back</span><h2>Sign in to your space</h2><p>Choose the view you want to open.</p></div>
        <div className="role-switch" role="tablist">
          {(['CUSTOMER', 'OPERATOR'] as UserRole[]).map(item => <button key={item} type="button" className={role === item ? 'selected' : ''} onClick={() => setRole(item)}>{item === 'CUSTOMER' ? 'Shopping' : 'Operations'}</button>)}
        </div>
        <form onSubmit={submit}>
          <div className="field"><label htmlFor="email">Email address</label><input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
          <div className="field"><label htmlFor="password">Password</label><input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} minLength={4} required /></div>
          {error && <div className="auth-error">{error}</div>}
          <button className="btn btn-primary btn-block auth-submit" type="submit">Continue <span>↗</span></button>
        </form>
        <p className="auth-note">Demo access is local to this browser. Connect your identity provider here when deploying.</p>
      </section>
    </main>
  );
}