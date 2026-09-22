// Mirrors the JSON returned by the Spring Boot backend.

export interface Product {
  id: number;
  name: string;
  brand: string;
  description: string;
  specs: string;
  price: number;
  discountPct: number;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  categoryId: number;
  featured: boolean;
  trending: boolean;
  bestSeller: boolean;
  stock: number;
  reviews?: Review[];
}

export interface Review {
  id: number;
  productId: number;
  author: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
}

export interface HomeData {
  featured: Product[];
  trending: Product[];
  bestSellers: Product[];
  lowStock: Product[];
  categories: Category[];
}

export interface CartLine {
  productId: number;
  name: string;
  imageUrl: string;
  price: number;
  discountPct: number;
  quantity: number;
  stock: number;
  lineTotal: number;
}

export interface CartView {
  items: CartLine[];
  subtotal: number;
  discount: number;
  total: number;
}

export interface OrderView {
  id: number;
  ref: string;
  customerName: string;
  status: string;
  processing: string;
  worker: string | null;
  retryCount: number;
  failureReason: string | null;
  total: number;
  source: string;
  createdAt: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
}

export interface OrderEvent {
  id: number;
  orderId: number;
  orderRef: string;
  type: string;
  eventType?: string;
  message: string;
  worker: string | null;
  createdAt: string;
}

export interface OrderDetail {
  order: OrderView;
  items: OrderItem[];
  timeline: OrderEvent[];
}

export interface SalesView { productId: number; productName: string; unitsSold: number; revenue: number; }

// ---- websocket payloads ----
export interface MetricsView {
  totalOrders: number;
  processing: number;
  queued: number;
  successful: number;
  failed: number;
  retrying: number;
  deadLetter: number;
  activeWorkers: number;
  totalWorkers: number;
  currentInventoryHero: number;
  ordersPerSecond: number;
  avgProcessingMs: number;
  peakActiveWorkers: number;
}

export interface WorkerView {
  name: string;
  state: 'IDLE' | 'ACTIVE';
  currentOrder: string | null;
  processed: number;
}

export interface EventMessage {
  orderId: number | null;
  orderRef: string | null;
  type: string;
  message: string;
  worker: string | null;
  timestamp: string;
}

export interface InventoryUpdate {
  productId: number;
  quantity: number;
  outOfStock: boolean;
}

export interface NotificationMessage {
  level: 'info' | 'success' | 'warn' | 'error';
  text: string;
  orderId: number | null;
  timestamp: string;
}

export interface DeadLetter {
  id: number;
  orderId: number;
  orderRef: string;
  failureReason: string;
  retryCount: number;
  worker: string;
  createdAt: string;
}

export interface LoadTestResult {
  submitted: number;
  successful: number;
  outOfStock: number;
  technicalFailures: number;
  retries: number;
  deadLetter: number;
  initialInventory: number;
  finalInventory: number;
  negativeInventory: boolean;
  peakActiveWorkers: number;
  avgProcessingMs: number;
  wallClockMs: number;
}
