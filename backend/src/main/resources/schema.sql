-- ============================================================
-- CodeNova schema (MySQL). Idempotent for repeated startups.
-- Engine=InnoDB is required for row-level locking (SELECT ... FOR UPDATE).
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(120) NOT NULL,
    email        VARCHAR(160) NOT NULL UNIQUE,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS categories (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(80) NOT NULL UNIQUE,
    slug         VARCHAR(80) NOT NULL UNIQUE,
    icon         VARCHAR(40)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS products (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    name           VARCHAR(200) NOT NULL,
    brand          VARCHAR(80),
    description    TEXT,
    specs          TEXT,
    price          DECIMAL(12,2) NOT NULL,
    discount_pct   INT DEFAULT 0,
    rating         DECIMAL(2,1) DEFAULT 0,
    review_count   INT DEFAULT 0,
    image_url      VARCHAR(500),
    category_id    BIGINT,
    featured       BOOLEAN DEFAULT FALSE,
    trending       BOOLEAN DEFAULT FALSE,
    best_seller    BOOLEAN DEFAULT FALSE,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_product_category FOREIGN KEY (category_id) REFERENCES categories(id)
) ENGINE=InnoDB;

-- Inventory is split from products so the hot row that gets locked is small.
CREATE TABLE IF NOT EXISTS inventory (
    product_id   BIGINT PRIMARY KEY,
    quantity     INT NOT NULL,
    version      BIGINT DEFAULT 0,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_inventory_product FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT chk_qty_non_negative CHECK (quantity >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cart_items (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id      BIGINT NOT NULL,
    product_id   BIGINT NOT NULL,
    quantity     INT NOT NULL,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_cart_product FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT uq_cart UNIQUE (user_id, product_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS orders (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    public_ref     VARCHAR(40) NOT NULL UNIQUE,
    user_id        BIGINT,
    customer_name  VARCHAR(120),
    address        VARCHAR(400),
    total_amount   DECIMAL(12,2) DEFAULT 0,
    status         VARCHAR(24) NOT NULL,      -- fulfilment status (ORDER_PLACED..DELIVERED/FAILED)
    processing     VARCHAR(24) NOT NULL,      -- technical status (PENDING..SUCCESS/DEAD_LETTER)
    worker         VARCHAR(24),
    retry_count    INT DEFAULT 0,
    failure_reason VARCHAR(200),
    source         VARCHAR(24) DEFAULT 'CUSTOMER', -- CUSTOMER | LOAD_TEST
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_orders_processing (processing),
    INDEX idx_orders_created (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_items (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id     BIGINT NOT NULL,
    product_id   BIGINT NOT NULL,
    product_name VARCHAR(200),
    quantity     INT NOT NULL,
    unit_price   DECIMAL(12,2) NOT NULL,
    CONSTRAINT fk_oi_order FOREIGN KEY (order_id) REFERENCES orders(id),
    CONSTRAINT fk_oi_product FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_events (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id     BIGINT NOT NULL,
    order_ref    VARCHAR(40),
    event_type   VARCHAR(40) NOT NULL,
    message      VARCHAR(300),
    worker       VARCHAR(24),
    created_at   TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
    INDEX idx_events_order (order_id),
    INDEX idx_events_created (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS dead_letter_queue (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id       BIGINT NOT NULL,
    order_ref      VARCHAR(40),
    failure_reason VARCHAR(200),
    retry_count    INT,
    worker         VARCHAR(24),
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_dlq_order FOREIGN KEY (order_id) REFERENCES orders(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reviews (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id   BIGINT NOT NULL,
    author       VARCHAR(120),
    rating       INT NOT NULL,
    comment      VARCHAR(600),
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_review_product FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;
