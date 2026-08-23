-- Creva Webzz PostgreSQL Database Schema & Seeder Script
-- Highly optimized for Render.com PostgreSQL & Laravel REST API

-- Clean up existing tables
DROP TABLE IF EXISTS "order_items" CASCADE;
DROP TABLE IF EXISTS "orders" CASCADE;
DROP TABLE IF EXISTS "products" CASCADE;
DROP TABLE IF EXISTS "stores" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

-- 1. Table `users`
CREATE TABLE "users" (
  "id" VARCHAR(255) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255) NOT NULL,
  "password" VARCHAR(255) NOT NULL,
  "role" VARCHAR(50) DEFAULT 'merchant',
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  CONSTRAINT "users_email_unique" UNIQUE ("email")
);

-- 2. Table `stores`
CREATE TABLE "stores" (
  "id" VARCHAR(255) NOT NULL,
  "owner_id" VARCHAR(255) NOT NULL,
  "store_name" VARCHAR(255) NOT NULL,
  "subdomain" VARCHAR(255) NOT NULL,
  "custom_domain" VARCHAR(255) DEFAULT NULL,
  "logo_url" TEXT DEFAULT NULL,
  "primary_color" VARCHAR(50) DEFAULT '#3C77C3',
  "currency" VARCHAR(10) DEFAULT 'INR',
  "contact_phone" VARCHAR(50) DEFAULT NULL,
  "contact_email" VARCHAR(255) DEFAULT NULL,
  "description" TEXT DEFAULT NULL,
  "billing_plan" VARCHAR(50) DEFAULT NULL,
  "billing_price" VARCHAR(50) DEFAULT NULL,
  "plan_starts_at" TIMESTAMP DEFAULT NULL,
  "plan_ends_at" TIMESTAMP DEFAULT NULL,
  "status" VARCHAR(50) DEFAULT 'active',
  "is_paused" BOOLEAN DEFAULT TRUE,
  "custom_domain_enabled" BOOLEAN DEFAULT FALSE,
  "subscription_expires_at" TIMESTAMP DEFAULT NULL,
  "marketing_hub_enabled" BOOLEAN DEFAULT TRUE,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  CONSTRAINT "stores_subdomain_unique" UNIQUE ("subdomain"),
  CONSTRAINT "stores_custom_domain_unique" UNIQUE ("custom_domain"),
  CONSTRAINT "fk_stores_owner" FOREIGN KEY ("owner_id") REFERENCES "users" ("id") ON DELETE CASCADE
);

-- 3. Table `products`
CREATE TABLE "products" (
  "id" VARCHAR(255) NOT NULL,
  "store_id" VARCHAR(255) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "price" NUMERIC(10,2) NOT NULL,
  "sku" VARCHAR(255) DEFAULT NULL,
  "description" TEXT DEFAULT NULL,
  "is_active" BOOLEAN DEFAULT TRUE,
  "inventory_quantity" INTEGER DEFAULT 10,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_products_store" FOREIGN KEY ("store_id") REFERENCES "stores" ("id") ON DELETE CASCADE
);

-- 4. Table `orders`
CREATE TABLE "orders" (
  "id" VARCHAR(255) NOT NULL,
  "store_id" VARCHAR(255) NOT NULL,
  "customer_name" VARCHAR(255) NOT NULL,
  "customer_email" VARCHAR(255) DEFAULT NULL,
  "customer_phone" VARCHAR(50) NOT NULL,
  "shipping_address" TEXT NOT NULL,
  "total_amount" NUMERIC(10,2) NOT NULL,
  "status" VARCHAR(50) DEFAULT 'pending',
  "payment_method" VARCHAR(255) DEFAULT 'WhatsApp Cash',
  "payment_status" VARCHAR(255) DEFAULT 'unpaid',
  "tracking_number" VARCHAR(255) DEFAULT NULL,
  "delivery_date" VARCHAR(255) DEFAULT NULL,
  "payment_screenshot_url" TEXT DEFAULT NULL,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_orders_store" FOREIGN KEY ("store_id") REFERENCES "stores" ("id") ON DELETE CASCADE
);

-- 5. Table `order_items`
CREATE TABLE "order_items" (
  "id" BIGSERIAL PRIMARY KEY,
  "order_id" VARCHAR(255) NOT NULL,
  "product_id" VARCHAR(255) NOT NULL,
  "quantity" INTEGER NOT NULL,
  "price_at_purchase" NUMERIC(10,2) NOT NULL,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fk_items_order" FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON DELETE CASCADE,
  CONSTRAINT "fk_items_product" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE
);

-- Seed Default Admin & Store for Demonstration
INSERT INTO "users" ("id", "name", "email", "password", "role") VALUES 
('usr_superadmin', 'Creva SuperAdmin', 'admin@crevawebzz.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'superadmin');

INSERT INTO "users" ("id", "name", "email", "password", "role") VALUES 
('usr_merchant_demo', 'Demo Merchant', 'merchant@crevawebzz.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'merchant');

INSERT INTO "stores" ("id", "owner_id", "store_name", "subdomain", "primary_color", "currency", "contact_phone", "contact_email", "status") VALUES 
('store_demo_123', 'usr_merchant_demo', 'Elite Lifestyle Store', 'elite', '#3C77C3', 'INR', '919876543210', 'merchant@crevawebzz.com', 'active');
