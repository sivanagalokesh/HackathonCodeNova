import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { money } from '../../api/client';

export default function Cart() {
  const { cart, setQty, remove } = useCart();
  const nav = useNavigate();

  if (!cart) return <div className="loader"><div className="spin" /></div>;

  if (cart.items.length === 0) {
    return (
      <div className="container page">
        <div className="empty">
          <div className="big">▤</div>
          <h2 style={{ marginBottom: 8 }}>Your cart is empty</h2>
          <p className="muted" style={{ marginBottom: 20 }}>Add something worth queueing for.</p>
          <Link to="/products" className="btn btn-nova">Browse products</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container page">
      <div className="section-head"><h2>Your cart</h2><span className="muted">{cart.items.length} items</span></div>
      <div className="two-col">
        <div className="card" style={{ padding: '4px 22px' }}>
          {cart.items.map(l => (
            <div className="cart-line" key={l.productId}>
              <img src={l.imageUrl} alt={l.name} />
              <div>
                <Link to={`/products/${l.productId}`} style={{ fontWeight: 600 }}>{l.name}</Link>
                <div className="muted" style={{ fontSize: '0.85rem', margin: '4px 0' }}>
                  {money(l.price)} {l.discountPct > 0 && <span style={{ color: 'var(--mint)' }}>· {l.discountPct}% off</span>}
                </div>
                {l.stock <= 20 && l.stock > 0 && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--amber)', fontWeight: 600 }}>Only {l.stock} left</div>
                )}
                {l.stock <= 0 && <div style={{ fontSize: '0.8rem', color: 'var(--coral)', fontWeight: 600 }}>Out of stock</div>}
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 10 }}>
                  <div className="qty">
                    <button onClick={() => setQty(l.productId, Math.max(1, l.quantity - 1))} aria-label="Decrease">−</button>
                    <span>{l.quantity}</span>
                    <button onClick={() => setQty(l.productId, l.quantity + 1)}
                            disabled={l.quantity >= l.stock} aria-label="Increase">+</button>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => remove(l.productId)}>Remove</button>
                </div>
              </div>
              <div style={{ fontWeight: 800, fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>
                {money(l.lineTotal)}
              </div>
            </div>
          ))}
        </div>

        <aside className="card summary">
          <h3>Order summary</h3>
          <div className="sum-row"><span>Subtotal</span><span>{money(cart.subtotal)}</span></div>
          <div className="sum-row"><span>Discount</span><span style={{ color: 'var(--mint)' }}>−{money(cart.discount)}</span></div>
          <div className="sum-row"><span>Delivery</span><span>Free</span></div>
          <div className="sum-row total"><span>Total</span><span>{money(cart.total)}</span></div>
          <button className="btn btn-nova btn-block" style={{ marginTop: 16 }}
                  onClick={() => nav('/checkout')}>
            Checkout →
          </button>
          <p className="muted" style={{ fontSize: '0.78rem', marginTop: 12, textAlign: 'center' }}>
            Inventory is re-validated on the server at checkout.
          </p>
        </aside>
      </div>
    </div>
  );
}
