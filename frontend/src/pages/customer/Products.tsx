import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { getProducts, getByCategory, getCategories } from '../../api/client';
import ProductCard from '../../components/ProductCard';
import type { Product, Category } from '../../types';

export default function Products({ deals }: { deals?: boolean }) {
  const { id } = useParams();
  const [sp] = useSearchParams();
  const q = sp.get('q') ?? '';

  const [items, setItems] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [cat, setCat] = useState('all');
  const [maxPrice, setMaxPrice] = useState(0);
  const [minRating, setMinRating] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState('relevance');

  useEffect(() => { getCategories().then(setCats).catch(() => {}); }, []);

  useEffect(() => {
    setLoading(true);
    const load = id ? getByCategory(Number(id)) : getProducts(q || undefined);
    load.then(setItems).catch(() => setItems([])).finally(() => setLoading(false));
    setCat(id ? String(id) : 'all');
  }, [id, q]);

  const ceiling = useMemo(
    () => items.reduce((m, p) => Math.max(m, p.price), 0), [items]);

  const view = useMemo(() => {
    let v = items.slice();
    if (deals) v = v.filter(p => p.discountPct > 0);
    if (cat !== 'all') v = v.filter(p => String(p.categoryId) === cat);
    if (maxPrice > 0) v = v.filter(p => p.price <= maxPrice);
    if (minRating > 0) v = v.filter(p => p.rating >= minRating);
    if (inStockOnly) v = v.filter(p => p.stock > 0);
    if (sort === 'price-asc') v.sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') v.sort((a, b) => b.price - a.price);
    if (sort === 'rating') v.sort((a, b) => b.rating - a.rating);
    if (sort === 'discount') v.sort((a, b) => b.discountPct - a.discountPct);
    return v;
  }, [items, cat, maxPrice, minRating, inStockOnly, sort, deals]);

  const title = deals ? 'Deals' : id
    ? (cats.find(c => String(c.id) === id)?.name ?? 'Category')
    : q ? `Results for “${q}”` : 'All products';

  return (
    <div className="container page">
      <div className="section-head">
        <h2>{title}</h2>
        <span className="muted">{view.length} products</span>
      </div>

      <div className="filters card">
        {!id && (
          <select value={cat} onChange={e => setCat(e.target.value)} aria-label="Category">
            <option value="all">All categories</option>
            {cats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        )}
        <select value={sort} onChange={e => setSort(e.target.value)} aria-label="Sort">
          <option value="relevance">Sort: Relevance</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="rating">Highest rated</option>
          <option value="discount">Biggest discount</option>
        </select>
        <select value={minRating} onChange={e => setMinRating(Number(e.target.value))} aria-label="Rating">
          <option value={0}>Any rating</option>
          <option value={4}>4★ & up</option>
          <option value={4.5}>4.5★ & up</option>
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem' }}>
          Max ₹
          <input type="range" min={0} max={ceiling} step={1000}
                 value={maxPrice || ceiling}
                 onChange={e => setMaxPrice(Number(e.target.value))} />
          <span style={{ fontFamily: 'var(--font-mono)', minWidth: 64 }}>
            {(maxPrice || ceiling).toLocaleString('en-IN')}
          </span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.88rem' }}>
          <input type="checkbox" checked={inStockOnly}
                 onChange={e => setInStockOnly(e.target.checked)} />
          In stock only
        </label>
      </div>

      {loading ? (
        <div className="loader"><div className="spin" /></div>
      ) : view.length === 0 ? (
        <div className="empty"><div className="big">◍</div>No products match these filters.</div>
      ) : (
        <div className="grid-products">
          {view.map(p => (
            <ProductCard key={p.id} product={p}
              flag={p.discountPct > 0 ? `${p.discountPct}% OFF` : undefined} />
          ))}
        </div>
      )}
    </div>
  );
}
