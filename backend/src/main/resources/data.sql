-- ============================================================
-- Seed data. Uses INSERT IGNORE so repeated startups are safe.
-- ============================================================

INSERT IGNORE INTO users (id, name, email) VALUES
 (1, 'Demo Customer', 'demo@codenova.dev'),
 (2, 'Operations',    'ops@codenova.dev');

INSERT IGNORE INTO categories (id, name, slug, icon) VALUES
 (1, 'Laptops',      'laptops',      'laptop'),
 (2, 'Phones',       'phones',       'phone'),
 (3, 'Audio',        'audio',        'headphones'),
 (4, 'Wearables',    'wearables',    'watch'),
 (5, 'Accessories',  'accessories',  'mouse'),
 (6, 'Gaming',       'gaming',       'gamepad');

-- Product photography is stable and category-specific; refresh image URLs on repeat starts.
INSERT INTO products
 (id, name, brand, description, specs, price, discount_pct, rating, review_count, image_url, category_id, featured, trending, best_seller) VALUES
 (1, 'Nova Book Pro 14', 'Nova', 'A featherweight 14-inch workstation with an all-day battery and a colour-accurate display.', 'CPU: 10-core Nova M-series|RAM: 16GB|Storage: 512GB SSD|Display: 14.2" 120Hz|Weight: 1.24kg', 74999.00, 8, 4.6, 124, 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=85', 1, TRUE, TRUE, TRUE),
 (2, 'Nova Book Air 13', 'Nova', 'The thinnest laptop we make. Silent, fanless, and built for travel.', 'CPU: 8-core Nova M-series|RAM: 8GB|Storage: 256GB SSD|Display: 13.3" 60Hz|Weight: 0.99kg', 54999.00, 5, 4.4, 88, 'https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=800&q=85', 1, TRUE, FALSE, FALSE),
 (3, 'Pulse X5 Phone', 'Pulse', 'Flagship camera system and a display that hits 2000 nits outdoors.', 'Display: 6.7" LTPO|Camera: 50MP triple|Battery: 5000mAh|Chip: Pulse G4', 64999.00, 12, 4.7, 342, 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=85', 2, TRUE, TRUE, TRUE),
 (4, 'Pulse A3 Phone', 'Pulse', 'Mid-range value pick with a clean OS and a big battery.', 'Display: 6.4" AMOLED|Camera: 48MP dual|Battery: 5500mAh|Chip: Pulse G2', 21999.00, 15, 4.3, 511, 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=85', 2, FALSE, TRUE, TRUE),
 (5, 'Echo Buds 2', 'Echo', 'Active noise cancelling earbuds with 30-hour total playback.', 'ANC: Yes|Battery: 8h + 22h case|Bluetooth: 5.3|Water: IPX4', 8999.00, 20, 4.5, 205, 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=800&q=85', 3, TRUE, FALSE, TRUE),
 (6, 'Echo Studio Over-Ear', 'Echo', 'Reference-grade over-ear headphones for long listening sessions.', 'Driver: 40mm|Battery: 40h|ANC: Adaptive|Weight: 250g', 17999.00, 10, 4.6, 96, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=85', 3, FALSE, TRUE, FALSE),
 (7, 'Chrono Fit Watch', 'Chrono', 'GPS smartwatch with a 7-day battery and full health tracking.', 'Display: 1.4" AMOLED|Battery: 7 days|GPS: Dual-band|Water: 5ATM', 14999.00, 0, 4.2, 143, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=85', 4, FALSE, FALSE, FALSE),
 (8, 'Chrono Ring', 'Chrono', 'Sleep and recovery tracking in a titanium ring.', 'Battery: 6 days|Sensors: HR, SpO2, temp|Material: Titanium', 24999.00, 5, 4.1, 61, 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=85', 4, TRUE, FALSE, FALSE),
 (9, 'Glide Wireless Mouse', 'Glide', 'Low-latency wireless mouse tuned for precision work.', 'DPI: 100-26000|Battery: 70h|Weight: 61g|Connection: 2.4GHz + BT', 4999.00, 25, 4.5, 389, 'https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=800&q=85', 5, FALSE, TRUE, TRUE),
 (10, 'Glide Mech Keyboard', 'Glide', 'Hot-swappable mechanical keyboard with a machined aluminium frame.', 'Switches: Hot-swap|Layout: 75%|Backlight: RGB|Connection: USB-C + BT', 9999.00, 10, 4.7, 172, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=85', 5, TRUE, FALSE, FALSE),
 (11, 'Vortex Console X', 'Vortex', 'Next-gen console with 4K/120 output and a 1TB NVMe drive.', 'Storage: 1TB NVMe|Output: 4K 120Hz|RAM: 16GB|Ray tracing: Yes', 44999.00, 0, 4.8, 620, 'https://images.unsplash.com/photo-1605901309584-818e25960a8f?auto=format&fit=crop&w=800&q=85', 6, TRUE, TRUE, TRUE),
 (12, 'Vortex Pro Controller', 'Vortex', 'Tournament controller with mappable back paddles.', 'Paddles: 4|Battery: 25h|Connection: BT + USB-C|Weight: 280g', 6499.00, 15, 4.4, 233, 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=800&q=85', 6, FALSE, FALSE, TRUE)
ON DUPLICATE KEY UPDATE image_url = VALUES(image_url);

-- Inventory. Product 1 (Nova Book Pro) is the flash-sale hero: seeded at 20.
INSERT IGNORE INTO inventory (product_id, quantity) VALUES
 (1, 20), (2, 40), (3, 30), (4, 120), (5, 80),
 (6, 25), (7, 60), (8, 15), (9, 200), (10, 45),
 (11, 12), (12, 90);

INSERT IGNORE INTO reviews (product_id, author, rating, comment) VALUES
 (1, 'Aditya', 5, 'Fast, light, and the screen is gorgeous. Best laptop I have owned.'),
 (1, 'Meera',  4, 'Great machine, wish it had one more USB-C port.'),
 (3, 'Rahul',  5, 'The camera is unreal in low light.'),
 (3, 'Sana',   4, 'Battery easily lasts a full day of heavy use.'),
 (5, 'Karthik',5, 'ANC is excellent for the price.'),
 (11,'Priya',  5, 'Load times are basically gone. Huge upgrade.');
