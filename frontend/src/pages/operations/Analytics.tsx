import { useEffect, useMemo, useState } from 'react';
import { opsOrders, opsSales, getProducts, money } from '../../api/client';
import { useTopic } from '../../ws/useStomp';
import type { InventoryUpdate, OrderView, Product, SalesView } from '../../types';

export default function Analytics() {
  const [orders, setOrders] = useState<OrderView[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<SalesView[]>([]);
  useEffect(() => { Promise.all([opsOrders(), opsSales(), getProducts()]).then(([nextOrders, nextSales, nextProducts]) => { setOrders(nextOrders); setSales(nextSales); setProducts(nextProducts); }).catch(() => {}); }, []);
  useTopic<OrderView>('/topic/orders', order => { setOrders(current => [order, ...current.filter(item => item.id !== order.id)].slice(0, 100)); opsSales().then(setSales).catch(() => {}); });
  useTopic<InventoryUpdate>('/topic/inventory', update => setProducts(current => current.map(product => product.id === update.productId ? { ...product, stock: update.quantity } : product)));

  const sold = useMemo(() => sales.map(item => ({ ...item, product: products.find(product => product.id === item.productId) })), [sales, products]);
  const successful = orders.filter(order => order.processing === 'SUCCESS' || order.status === 'DELIVERED').length;
  const revenue = orders.filter(order => order.processing === 'SUCCESS').reduce((sum, order) => sum + Number(order.total || 0), 0);
  const maxUnits = sold[0]?.unitsSold || 1;

  return <>
    <div className="ops-h"><div><h1>Commerce analysis</h1><p>Sales signals update as orders move through the processing engine.</p></div><span className="live-label"><i /> LIVE DATA</span></div>
    <div className="metric-grid analysis-metrics"><div className="metric accent-v"><div className="cap">Gross revenue</div><div className="val">{money(revenue)}</div><div className="sub">from successful orders</div></div><div className="metric accent-ok"><div className="cap">Completed orders</div><div className="val">{successful}</div><div className="sub">of {orders.length} observed</div></div><div className="metric accent-info"><div className="cap">Catalog SKUs</div><div className="val">{products.length}</div><div className="sub">tracked in inventory</div></div></div>
    <div className="ops-cols analysis-layout">
      <section className="panel"><div className="panel-h"><h2>Best-selling products</h2><span className="hint">units sold</span></div><div className="bar-list">{sold.slice(0, 6).map(item => <div className="bar-row" key={item.productId}><div className="bar-name"><span>{item.productName}</span><strong>{item.unitsSold}</strong></div><div className="bar-track"><i style={{ width: `${(item.unitsSold / maxUnits) * 100}%` }} /></div></div>)}</div></section>
      <section className="panel"><div className="panel-h"><h2>Inventory watch</h2><span className="hint">live stock</span></div><div className="inventory-list">{products.slice(0, 6).map(product => <div className="inventory-row" key={product.id}><img src={product.imageUrl} alt="" /><span>{product.name}</span><b className={product.stock < 10 ? 'low' : ''}>{product.stock} left</b></div>)}</div></section>
    </div>
  </>;
}