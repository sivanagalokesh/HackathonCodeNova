import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useTopic } from '../ws/useStomp';
import { money } from '../api/client';
import Stars from './Stars';
import type { Product, InventoryUpdate } from '../types';

export function StockLine({ stock }: { stock: number }) {
  if (stock <= 0) return <div className="stock-line out">● Out of stock</div>;
  if (stock <= 20) return <div className="stock-line low">Only {stock} left in stock</div>;
  return <div className="stock-line in">● In stock</div>;
}

export default function ProductCard({ product, flag }: { product: Product; flag?: string }) {
  const { add } = useCart();
  const { push } = useToast();
  const nav = useNavigate();
  const [stock, setStock] = useState(product.stock);

  // Real-time inventory: react to any successful purchase of this product.
  useTopic<InventoryUpdate>('/topic/inventory', (u) => {
    if (u.productId === product.id) setStock(u.quantity);
  });

  const disc = product.discountPct ?? 0;
  const was = disc > 0 ? product.price / (1 - disc / 100) : 0;

  const onAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (stock <= 0) return;
    await add(product.id, 1);
    push('success', `${product.name} added to cart`);
  };
  const onBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    nav(`/products/${product.id}?buy=1`);
  };

  return (
    <article className="product-card" onClick={() => nav(`/products/${product.id}`)}>
      <div className="pc-media">
        <img src={product.imageUrl} alt={product.name} loading="lazy" />
        {flag && <span className={`pc-flag ${flag === 'DEAL' ? 'deal' : ''}`}>{flag}</span>}
      </div>
      <div className="pc-body">
        <span className="pc-brand">{product.brand}</span>
        <h3 className="pc-name">{product.name}</h3>
        <div className="pc-rate">
          <Stars rating={product.rating} />
          <span>{product.rating.toFixed(1)}</span>
          <span className="muted">({product.reviewCount})</span>
        </div>
        <div className="pc-price">
          <span className="now">{money(product.price)}</span>
          {disc > 0 && <span className="was">{money(was)}</span>}
          {disc > 0 && <span className="off">{disc}% off</span>}
        </div>
        <div className="deliver">Free delivery · dispatched in 24h</div>
        <StockLine stock={stock} />
        <div className="pc-actions">
          <button className="btn btn-ghost btn-sm" onClick={onAdd} disabled={stock <= 0}>
            Add to cart
          </button>
          <button className="btn btn-nova btn-sm" onClick={onBuy} disabled={stock <= 0}>
            Buy now
          </button>
        </div>
      </div>
    </article>
  );
}
