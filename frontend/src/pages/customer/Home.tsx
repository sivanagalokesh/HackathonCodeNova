import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getHome, getProduct, money, HERO_PRODUCT_ID } from '../../api/client';
import { useTopic } from '../../ws/useStomp';
import ProductCard from '../../components/ProductCard';
import type { HomeData, Product, InventoryUpdate } from '../../types';

function Row({ title, link, items, flag }:
  { title: string; link?: string; items: Product[]; flag?: (p: Product) => string | undefined }) {
  if (!items?.length) return null;
  return (
    <section className="block">
      <div className="section-head">
        <h2>{title}</h2>
        {link && <Link to={link}>View all →</Link>}
      </div>
      <div className="grid-products">
        {items.map(p => <ProductCard key={p.id} product={p} flag={flag?.(p)} />)}
      </div>
    </section>
  );
}

export default function Home() {
  const [data, setData] = useState<HomeData | null>(null);
  const [hero, setHero] = useState<Product | null>(null);
  const [heroStock, setHeroStock] = useState<number>(0);
  const [recent, setRecent] = useState<Product[]>([]);
  const [loadError, setLoadError] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    getHome().then(setData).catch(() => setLoadError(true));
    getProduct(HERO_PRODUCT_ID).then(p => { setHero(p); setHeroStock(p.stock); }).catch(() => setLoadError(true));

    // recently viewed from localStorage
    try {
      const ids: number[] = JSON.parse(localStorage.getItem('cn_recent') || '[]');
      Promise.all(ids.slice(0, 5).map(id => getProduct(id).catch(() => null)))
        .then(ps => setRecent(ps.filter(Boolean) as Product[]));
    } catch { /* ignore */ }
  }, []);

  useTopic<InventoryUpdate>('/topic/inventory', (u) => {
    if (u.productId === HERO_PRODUCT_ID) setHeroStock(u.quantity);
  });

  if (loadError) return <div className="container page"><div className="empty"><div className="big">⌁</div><h2>Catalog is offline</h2><p>Start the CodeNova backend on port 8080, then refresh this page.</p><button className="btn btn-primary" onClick={() => window.location.reload()}>Retry connection</button></div></div>;
  if (!data || !hero) return <div className="loader"><div className="spin" /></div>;

  const heroWas = hero.discountPct > 0 ? hero.price / (1 - hero.discountPct / 100) : 0;

  return (
    <div className="container page">
      {/* HERO */}
      <section className="hero">
        <div className="hero-copy">
          <span className="pill">◎ Real-time concurrent commerce</span>
          <h1 style={{ marginTop: 16 }}>Technology that keeps up with the crowd.</h1>
          <p>
            CodeNova sells premium hardware on a backend built for the rush —
            thousands of shoppers, one honest stock count, zero overselling.
            Watch it happen live in the Operations Center.
          </p>
          <div className="hero-cta">
            <Link to={`/products/${hero.id}`} className="btn btn-nova">Shop the flagship</Link>
            <Link to="/operations" className="btn btn-ghost">Open Operations Center</Link>
          </div>
          <div className="hero-stats">
            <div><div className="k">{data.categories.length}</div><div className="l">Categories</div></div>
            <div><div className="k">{[...data.featured, ...data.trending].length}+</div><div className="l">Products live</div></div>
            <div><div className="k">0</div><div className="l">Units oversold</div></div>
          </div>
        </div>

        <div className="hero-visual" id="flash">
          <img src={hero.imageUrl} alt={hero.name} />
          <div className="hero-flash">
            <div>
              <div className="live"><span className="dot" />FLASH SALE · LIVE</div>
              <div style={{ fontWeight: 700, marginTop: 4 }}>{hero.name}</div>
              <div className="left">
                {heroStock > 0 ? `Only ${heroStock} units at this price` : 'SOLD OUT'}
              </div>
            </div>
            <div className="price">{money(hero.price)}</div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="block">
        <div className="section-head"><h2>Shop by category</h2></div>
        <div className="category-strip">
          {data.categories.map(c => (
            <button key={c.id} className="category-chip" onClick={() => nav(`/category/${c.id}`)}>
              <span className="ico">{c.icon}</span>
              <span className="nm">{c.name}</span>
            </button>
          ))}
        </div>
      </section>

      <Row title="Featured" link="/products" items={data.featured} flag={p => p.featured ? 'FEATURED' : undefined} />
      <Row title="Trending now" link="/products" items={data.trending} flag={() => 'TRENDING'} />
      <Row title="Limited inventory" items={data.lowStock} flag={p => `ONLY ${p.stock} LEFT`} />
      <Row title="Best sellers" link="/products" items={data.bestSellers} flag={() => 'BEST SELLER'} />
      <Row title="Deals for you" link="/deals"
           items={[...data.featured, ...data.trending].filter(p => p.discountPct > 0).slice(0, 5)}
           flag={p => `${p.discountPct}% OFF`} />
      {recent.length > 0 && <Row title="Recently viewed" items={recent} />}
      <Row title="Recommended for you" items={data.bestSellers.slice().reverse()} />
    </div>
  );
}
