# CodeNova — Real-Time E-Commerce & Concurrent Order Processing Platform

A real e-commerce marketplace **and** a live concurrent order-processing engine on one Spring Boot backend + one MySQL database. Customers shop a normal storefront; judges watch the thread pool, row locks, retries and dead-letter queue in a separate Operations Center — both driven by the *same* backend events over WebSocket.

No fake data. No frontend-only animations. Concurrency is a real `ThreadPoolExecutor`; inventory safety is real MySQL `SELECT ... FOR UPDATE` pessimistic locking.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + TypeScript + React Router + Axios + STOMP/SockJS |
| Backend | Java 17 + Spring Boot 3.2 (Web, Data JPA, WebSocket/STOMP, Validation, Tx) + `ThreadPoolExecutor` |
| Database | **MySQL only** |

---

## Prerequisites

- JDK 17+
- Maven 3.9+
- Node 18+
- MySQL 8+ running on `localhost:3306` (user `root`, password `root` by default). Set `MYSQL_PASSWORD` when your local password differs.

The DB `codenova` is auto-created (`createDatabaseIfNotExist=true`); `schema.sql` + `data.sql` seed tables and the catalog on startup.

---

## Run

**1. Backend** (`:8080`)
```bash
cd backend
mvn spring-boot:run
```

**2. Frontend** (`:5173`)
```bash
cd frontend
npm install
npm run dev
```
Vite proxies `/api` and `/ws` to `:8080`, so no CORS/config needed in dev.

- Storefront → http://localhost:5173/
- Operations Center → http://localhost:5173/operations

**3. Concurrency proof (no MySQL needed — runs on in-memory H2 in MySQL mode)**
```bash
cd backend
mvn test
```
`ConcurrencyTest` fires **100 concurrent orders against 20 units** and asserts: successful qty == 20, out-of-stock == 80, final inventory == 0 (never negative). Also covers variable-quantity no-oversell and permanent-failure → DLQ.

---

## Demo script (spec §40)

Open the storefront and the Operations Center side by side.

1. **Storefront** → open the hero product **Nova Book Pro 14** (₹74,999, starts at **20 units**).
2. **Operations Center → Concurrent Test.** Set: product = hero, inventory = `20`, orders = `50`, qty/order = `1`, workers = `5`. **Start.**
3. Watch **Dashboard** (12 live metrics), **Workers** (WORKER-01..05 flip ACTIVE/IDLE with current order), **Event Stream** (lock requested → acquired → stock checked → inventory 20→19→…→0 → released → success).
4. Inventory drains to **0**; the remaining 30 orders return **OUT_OF_STOCK** (business failure — **not** retried).
5. **Back on the storefront product page** the stock counter drops live to **OUT OF STOCK** with no refresh (WebSocket `/topic/inventory`).
6. **Ops → Orders**, click any order → full timestamped timeline + lock visualization (🔒🔐✓📉🔓).
7. **Retry test** button → transient failures → RETRY 1/3 → 2/3 → **SUCCESS** (streamed live).
8. **Permanent-failure test** button → RETRY 1/3 → 2/3 → 3/3 → **DEAD LETTER QUEUE**; row appears in the **DLQ** view.

Result grid reports submitted / successful / out-of-stock / technical failures / retries / DLQ, initial vs final inventory, **Negative Inventory: NO ✓**, peak active workers, avg processing time — all from real backend counters.

---

## Architecture

```
Customer React App ──REST+WS──┐
Operations Center ──────WS─────┤
                               ▼
                         Spring Boot
   Product · Cart · Order · Inventory · Processing Engine
   Retry · DLQ · Notifications · WebSocket Event Publisher
                               │
                    ThreadPoolExecutor (WORKER-01..N)
                               │
                             MySQL
```

**How the guarantees hold**
- **Concurrency:** `OrderProcessingEngine` runs a real resizable `ThreadPoolExecutor`; each thread is a named worker. Orders are submitted as tasks and processed in parallel.
- **No overselling:** `InventoryService.reserve()` takes `PESSIMISTIC_WRITE` row locks (`SELECT ... FOR UPDATE`) ordered by product id, all-or-nothing, inside a transaction; MySQL `CHECK (quantity >= 0)` is the backstop.
- **Retry vs business failure:** only `TechnicalProcessingException` is retried (bounded, 3 attempts, backoff). Out-of-stock is a business outcome and is never retried.
- **DLQ:** exhausted retries move the order to `dead_letter_queue` with reason, retry count, worker.
- **Real-time:** every meaningful step persists an `order_events` row **and** broadcasts over STOMP (`/topic/orders|inventory|workers|events|metrics|sales|notifications`). Customer and Operations views react to the *same* event.

**Tables:** `users, categories, products, inventory (version + CHECK≥0), cart_items, orders, order_items, order_events, dead_letter_queue, reviews`.

---

## Notes

- Original brand/identity (electric-violet **Nova** accent; storefront light, Operations Center dark). Not an Amazon copy.
- Payment is simulated (hackathon scope). Shipping stages are modeled as workflow events, not real logistics.
- Every displayed number originates from Spring Boot / thread pool / MySQL / WebSocket — nothing is faked.
