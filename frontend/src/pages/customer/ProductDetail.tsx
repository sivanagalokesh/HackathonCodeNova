import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getProduct, money } from '../../api/client';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { useTopic } from '../../ws/useStomp';
import Stars from '../../components/Stars';
import type { Product, InventoryUpdate } from '../../types';

export default function ProductDetail() {
  const { id } = useParams();
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const { add } = useCart();
  const { push } = useToast();

  const [p, setP] = useState<Product | null>(null);
  const [stock, setStock] = useState(0);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<'specs' | 'reviews'>('specs');

  useEffect(() => {
    if (!id) return;
    getProduct(Number(id)).then(prod => {
      setP(prod); setStock(prod.stock);
      // record recently-viewed
      try {
        const arr: number[] = JSON.parse(localStorage.getItem('cn_recent') || '[]');
        const next = [prod.id, ...arr.filter(x => x !== prod.id)].slice(0, 8);
        localStorage.setItem('cn_recent', JSON.stringify(next));
      } catch { /* ignore */ }
    }).catch(() => {});
  }, [id]);

  // Live stock — updates the instant another shopper buys, no refresh.
  useTopic<InventoryUpdate>('/topic/inventory', (u) => {
    if (p && u.productId === p.id) setStock(u.quantity);
  });

  if (!p) return <div className="loader"><div className="spin" /></div>;

  const disc = p.discountPct ?? 0;
  const was = disc > 0 ? p.price / (1 - disc / 100) : 0;
  const specs = (p.specs || '').split('|').map(s => s.trim()).filter(Boolean)
    .map(s => { const i = s.indexOf(':'); return [s.slice(0, i), s.slice(i + 1)]; });
  const maxQ = Math.min(stock, 10) || 1;

  const onAdd = async () => {
    await add(p.id, qty);
    push('success', `${qty} × ${p.name} added to cart`);
  };
  const onBuy = () => nav(`/checkout?buyNow=${p.id}&qty=${qty}`);

  return (
    <div className="container page">
      <div className="pd">
        <div className="pd-gallery">
          <div className="pd-main-img"><img src={p.imageUrl} alt={p.name} /></div>
        </div>

        <div>
          <span className="pd-brand">{p.brand}</span>
          <h1 className="pd-title">{p.name}</h1>
          <div className="pc-rate" style={{ marginTop: 10 }}>
            <Stars rating={p.rating} />
            <span>{p.rating.toFixed(1)}</span>
            <span className="muted">· {p.reviewCount} reviews</span>
          </div>

          <div className="pd-price">
            <span className="now">{money(p.price)}</span>
            {disc > 0 && <span className="was">{money(was)}</span>}
            {disc > 0 && <span className="off">{disc}% OFF</span>}
          </div>

          <p className="pd-desc">{p.description}</p>

          <div style={{ marginBottom: 18 }}>
            {stock > 0 ? (
              <span className="pd-live-stock" style={{ color: stock <= 20 ? 'var(--amber)' : 'var(--mint)' }}>
                <span className="pulse" style={{ background: stock <= 20 ? 'var(--amber)' : 'var(--mint)' }} />
                {stock <= 20 ? `Only ${stock} left — updates live` : 'In stock — updates live'}
              </span>
            ) : (
              <span className="pd-live-stock" style={{ color: 'var(--coral)', borderColor: 'var(--coral)' }}>
                ● Out of stock
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div className="qty">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} aria-label="Decrease">−</button>
              <span>{qty}</span>
              <button onClick={() => setQty(q => Math.min(maxQ, q + 1))} aria-label="Increase">+</button>
            </div>
            <span className="muted" style={{ fontSize: '0.85rem' }}>Max {maxQ} per order</span>
          </div>

          <div className="pd-buy">
            <button className="btn btn-ghost" onClick={onAdd} disabled={stock <= 0}>Add to cart</button>
            <button className="btn btn-nova" onClick={onBuy} disabled={stock <= 0}>Buy now</button>
          </div>
          <div className="deliver">✓ Free delivery · ✓ 7-day returns · ✓ Dispatched in 24 hours</div>

          <div className="tabs">
            <button className={`tab ${tab === 'specs' ? 'active' : ''}`} onClick={() => setTab('specs')}>Specifications</button>
            <button className={`tab ${tab === 'reviews' ? 'active' : ''}`} onClick={() => setTab('reviews')}>Reviews ({p.reviews?.length ?? 0})</button>
          </div>

          {tab === 'specs' ? (
            <table className="spec-table">
              <tbody>
                {specs.map(([k, v], i) => (
                  <tr key={i}><td>{k}</td><td>{v}</td></tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div>
              {(p.reviews ?? []).length === 0 && <p className="muted">No reviews yet.</p>}
              {(p.reviews ?? []).map(r => (
                <div className="review" key={r.id}>
                  <div className="review-head">
                    <span className="who">{r.author}</span>
                    <Stars rating={r.rating} />
                  </div>
                  <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: '0.92rem' }}>{r.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
