import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { checkout, buyNow, getProduct, money, DEMO_USER_NAME } from '../../api/client';
import type { OrderView, Product } from '../../types';

const STEPS = ['Cart', 'Address', 'Summary', 'Payment', 'Done'];

export default function Checkout() {
  const [sp] = useSearchParams();
  const buyNowId = sp.get('buyNow');
  const buyNowQty = Number(sp.get('qty') || 1);
  const { cart, refresh } = useCart();
  const { push } = useToast();
  const nav = useNavigate();

  const [step, setStep] = useState(buyNowId ? 1 : 0);
  const [name, setName] = useState(DEMO_USER_NAME);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pin, setPin] = useState('');
  const [placing, setPlacing] = useState(false);
  const [order, setOrder] = useState<OrderView | null>(null);
  const [bnProduct, setBnProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (buyNowId) getProduct(Number(buyNowId)).then(setBnProduct).catch(() => {});
  }, [buyNowId]);

  const bnLine = bnProduct ? bnProduct.price * buyNowQty : 0;
  const total = buyNowId ? bnLine : (cart?.total ?? 0);

  const placeOrder = async () => {
    setPlacing(true);
    const fullAddr = `${address}, ${city} ${pin}`.trim();
    try {
      const o = buyNowId
        ? await buyNow(Number(buyNowId), buyNowQty, name, fullAddr)
        : await checkout(name, fullAddr);
      setOrder(o);
      setStep(4);
      if (!buyNowId) await refresh();
      // Success / failure toast is also driven from the backend /topic/notifications,
      // but reflect the immediate result too.
      if (o.status === 'FAILED') push('error', `Order ${o.ref} could not be fulfilled`);
      else push('success', `Order ${o.ref} placed`);
    } catch (e: any) {
      push('error', e?.response?.data?.message || 'Checkout failed — please try again');
    } finally {
      setPlacing(false);
    }
  };

  const empty = !buyNowId && (!cart || cart.items.length === 0);

  return (
    <div className="container page">
      <div className="section-head"><h2>Checkout</h2></div>

      <div className="steps">
        {STEPS.map((s, i) => (
          <div key={s} className={`step ${i === step ? 'active' : i < step ? 'done' : ''}`}>
            <span className="n">{i < step ? '✓' : i + 1}</span>{s}
          </div>
        ))}
      </div>

      {empty && step < 4 ? (
        <div className="empty"><div className="big">▤</div>Nothing to check out.
          <div style={{ marginTop: 16 }}><Link to="/products" className="btn btn-nova">Browse products</Link></div>
        </div>
      ) : (
        <div className="two-col">
          <div className="card" style={{ padding: 24 }}>
            {/* STEP 0 — cart review */}
            {step === 0 && cart && (
              <>
                <h3 style={{ marginBottom: 14 }}>Review your items</h3>
                {cart.items.map(l => (
                  <div key={l.productId} className="sum-row">
                    <span>{l.quantity} × {l.name}</span><span>{money(l.lineTotal)}</span>
                  </div>
                ))}
                <button className="btn btn-nova btn-block" style={{ marginTop: 18 }} onClick={() => setStep(1)}>
                  Continue to address
                </button>
              </>
            )}

            {/* buy-now item review shown inside address step context */}
            {step === 1 && (
              <>
                <h3 style={{ marginBottom: 14 }}>Delivery address</h3>
                <div className="field"><label>Full name</label>
                  <input value={name} onChange={e => setName(e.target.value)} /></div>
                <div className="field"><label>Street address</label>
                  <textarea rows={2} value={address} onChange={e => setAddress(e.target.value)}
                            placeholder="Flat / house no, street, area" /></div>
                <div style={{ display: 'flex', gap: 14 }}>
                  <div className="field" style={{ flex: 1 }}><label>City</label>
                    <input value={city} onChange={e => setCity(e.target.value)} /></div>
                  <div className="field" style={{ width: 130 }}><label>PIN code</label>
                    <input value={pin} onChange={e => setPin(e.target.value)} /></div>
                </div>
                <button className="btn btn-nova btn-block"
                        disabled={!name || !address || !city}
                        onClick={() => setStep(2)}>Continue to summary</button>
              </>
            )}

            {/* STEP 2 — summary */}
            {step === 2 && (
              <>
                <h3 style={{ marginBottom: 14 }}>Order summary</h3>
                <div className="sum-row"><span>Ship to</span><span style={{ textAlign: 'right' }}>{name}<br />{address}, {city} {pin}</span></div>
                {buyNowId && bnProduct && (
                  <div className="sum-row"><span>{buyNowQty} × {bnProduct.name}</span><span>{money(bnLine)}</span></div>
                )}
                {!buyNowId && cart?.items.map(l => (
                  <div key={l.productId} className="sum-row"><span>{l.quantity} × {l.name}</span><span>{money(l.lineTotal)}</span></div>
                ))}
                <button className="btn btn-nova btn-block" style={{ marginTop: 16 }} onClick={() => setStep(3)}>
                  Continue to payment
                </button>
              </>
            )}

            {/* STEP 3 — payment simulation */}
            {step === 3 && (
              <>
                <h3 style={{ marginBottom: 14 }}>Payment</h3>
                <div className="pay-card" style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: '0.72rem', opacity: 0.7, letterSpacing: '0.1em' }}>CODENOVA · SIMULATED</div>
                  <div style={{ fontSize: '1.3rem', letterSpacing: '3px', margin: '18px 0' }}>4242 4242 4242 4242</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span>{name.toUpperCase()}</span><span>12/28</span>
                  </div>
                </div>
                <p className="muted" style={{ fontSize: '0.82rem', marginBottom: 16 }}>
                  No real payment is processed. Clicking below sends the order to Spring Boot,
                  where it is queued to the thread pool and validated against MySQL inventory.
                </p>
                <button className="btn btn-nova btn-block" onClick={placeOrder} disabled={placing}>
                  {placing ? 'Placing order…' : `Pay ${money(total)} & place order`}
                </button>
              </>
            )}

            {/* STEP 4 — confirmation */}
            {step === 4 && order && (
              <div className="confirm">
                <div className="check" style={{ background: order.status === 'FAILED' ? 'var(--coral)' : 'var(--mint)' }}>
                  {order.status === 'FAILED' ? '✕' : '✓'}
                </div>
                <h2 style={{ marginBottom: 8 }}>
                  {order.status === 'FAILED' ? 'Order could not be fulfilled' : 'Order confirmed'}
                </h2>
                <p className="muted" style={{ marginBottom: 6 }}>Reference</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.2rem' }}>{order.ref}</p>
                {order.failureReason && (
                  <p style={{ color: 'var(--coral)', marginTop: 10 }}>{order.failureReason}</p>
                )}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
                  <Link to="/orders" className="btn btn-nova">Track my orders</Link>
                  <Link to="/products" className="btn btn-ghost">Keep shopping</Link>
                </div>
              </div>
            )}
          </div>

          {step < 4 && (
            <aside className="card summary">
              <h3>Total</h3>
              <div className="sum-row total" style={{ borderTop: 0, paddingTop: 0 }}>
                <span>Payable</span><span>{money(total)}</span>
              </div>
              <p className="muted" style={{ fontSize: '0.78rem', marginTop: 12 }}>
                Final inventory check happens on the backend. If the last unit sells
                first, this order returns OUT&nbsp;OF&nbsp;STOCK — no overselling.
              </p>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}
