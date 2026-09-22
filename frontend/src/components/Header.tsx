import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { getCategories } from '../api/client';
import type { Category } from '../types';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { count } = useCart();
  const [cats, setCats] = useState<Category[]>([]);
  const [q, setQ] = useState('');
  const nav = useNavigate();
  const { user, signOut } = useAuth();

  useEffect(() => { getCategories().then(setCats).catch(() => {}); }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    nav(q.trim() ? `/products?q=${encodeURIComponent(q.trim())}` : '/products');
  };

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="brand" aria-label="CodeNova home">
          <span className="brand-mark" />
          Code<em>Nova</em>
        </Link>

        <form className="search" onSubmit={submit} role="search">
          <span aria-hidden>⌕</span>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search laptops, audio, wearables…"
            aria-label="Search products"
          />
        </form>

        <nav className="header-actions">
          <Link to="/orders" className="icon-link">
            <span className="glyph" aria-hidden>❖</span>
            Orders
          </Link>
          <button type="button" className="icon-link account-link" onClick={() => user ? signOut() : nav('/login')} aria-label={user ? 'Sign out' : 'Sign in'}>
            <span className="glyph" aria-hidden>◍</span>
            {user ? user.name : 'Sign in'}
          </button>
          <Link to="/cart" className="icon-link" aria-label={`Cart, ${count} items`}>
            <span className="glyph" aria-hidden>▤</span>
            Cart
            {count > 0 && <span className="badge-count">{count}</span>}
          </Link>
        </nav>
      </div>

      <div className="nav-row">
        <div className="container">
          <NavLink to="/" end className="nav-link">Home</NavLink>
          <NavLink to="/products" className="nav-link">All Products</NavLink>
          {cats.slice(0, 6).map(c => (
            <NavLink key={c.id} to={`/category/${c.id}`} className="nav-link">
              {c.icon} {c.name}
            </NavLink>
          ))}
          <NavLink to="/deals" className="nav-link">Deals</NavLink>
          <NavLink to="/operations" className="nav-link ops">◎ Operations Center</NavLink>
        </div>
      </div>
    </header>
  );
}
