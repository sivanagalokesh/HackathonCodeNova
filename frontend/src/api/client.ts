import axios from 'axios';
import type {
  HomeData, Product, Category, CartView, OrderView, OrderDetail,
  MetricsView, WorkerView, DeadLetter, LoadTestResult, OrderEvent,
  SalesView,
} from '../types';

// One axios instance. In dev, Vite proxies /api -> localhost:8080.
export const api = axios.create({ baseURL: '/api' });

// Fixed demo identities seeded in data.sql
export const DEMO_USER_ID = 1;
export const DEMO_USER_NAME = 'Demo Customer';
export const HERO_PRODUCT_ID = 1;

// ---------- catalog ----------
export const getHome = () => api.get<HomeData>('/home').then(r => r.data);
export const getProducts = (q?: string) =>
  api.get<Product[]>('/products', { params: q ? { q } : {} }).then(r => r.data);
export const getProduct = (id: number) => api.get<Product>(`/products/${id}`).then(r => r.data);
export const getByCategory = (id: number) =>
  api.get<Product[]>(`/products/category/${id}`).then(r => r.data);
export const getCategories = () => api.get<Category[]>('/categories').then(r => r.data);

// ---------- cart ----------
export const getCart = (userId = DEMO_USER_ID) =>
  api.get<CartView>(`/cart/${userId}`).then(r => r.data);
export const addToCart = (productId: number, quantity = 1, userId = DEMO_USER_ID) =>
  api.post<CartView>('/cart/add', { userId, productId, quantity }).then(r => r.data);
export const updateCart = (productId: number, quantity: number, userId = DEMO_USER_ID) =>
  api.post<CartView>('/cart/update', { userId, productId, quantity }).then(r => r.data);
export const removeFromCart = (productId: number, userId = DEMO_USER_ID) =>
  api.post<CartView>('/cart/remove', { userId, productId, quantity: 1 }).then(r => r.data);
export const clearCart = (userId = DEMO_USER_ID) => api.delete(`/cart/${userId}`);

// ---------- orders ----------
export const checkout = (customerName: string, address: string, userId = DEMO_USER_ID) =>
  api.post<OrderView>('/orders/checkout', { userId, customerName, address }).then(r => r.data);
export const buyNow = (productId: number, quantity: number, customerName: string, address: string, userId = DEMO_USER_ID) =>
  api.post<OrderView>('/orders/buy-now', { userId, productId, quantity, customerName, address }).then(r => r.data);
export const myOrders = (userId = DEMO_USER_ID) =>
  api.get<OrderView[]>(`/orders/user/${userId}`).then(r => r.data);
export const getOrder = (id: number) => api.get<OrderDetail>(`/orders/${id}`).then(r => r.data);

// ---------- operations ----------
export const opsMetrics = () => api.get<MetricsView>('/operations/metrics').then(r => r.data);
export const opsWorkers = () => api.get<WorkerView[]>('/operations/workers').then(r => r.data);
export const opsEvents = () => api.get<OrderEvent[]>('/operations/events').then(r => r.data);
export const opsDlq = () => api.get<DeadLetter[]>('/operations/dlq').then(r => r.data);
export const opsOrders = () => api.get<OrderView[]>('/operations/orders').then(r => r.data);
export const opsSales = () => api.get<SalesView[]>('/operations/sales').then(r => r.data);
export const opsOrder = (id: number) => api.get<OrderDetail>(`/operations/orders/${id}`).then(r => r.data);
export const runLoadTest = (body: {
  productId: number; orders: number; quantityPerOrder: number; workers: number; resetInventoryTo?: number;
}) => api.post<LoadTestResult>('/operations/load-test', body).then(r => r.data);
export const runRetryTest = (productId = HERO_PRODUCT_ID) =>
  api.post<string>('/operations/test/retry', null, { params: { productId } }).then(r => r.data);
export const runPermanentFailure = (productId = HERO_PRODUCT_ID) =>
  api.post<string>('/operations/test/permanent-failure', null, { params: { productId } }).then(r => r.data);
export const resetInventory = (productId: number, quantity: number) =>
  api.post<string>('/operations/inventory/reset', null, { params: { productId, quantity } }).then(r => r.data);
export const resizeWorkers = (workers: number) =>
  api.post<string>('/operations/workers/resize', null, { params: { workers } }).then(r => r.data);

export const money = (n: number) =>
  '₹' + Number(n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
