-- =============================================================================
-- Creva Webzz — Database Migration v2
-- Run this AFTER the base database.sql has been applied.
-- Safe to run multiple times (uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).
-- =============================================================================

-- ─── 1. Formal password_resets table ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "password_resets" (
  "email"      VARCHAR(255) PRIMARY KEY,
  "token"      VARCHAR(255) NOT NULL,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── 2. Rate limiting table ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "rate_limits" (
  "key_hash"     VARCHAR(64) PRIMARY KEY,
  "attempts"     INTEGER DEFAULT 0,
  "window_start" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── 3. Platform Settings (replaces fake __creva_saas_global_settings__ store) ──

CREATE TABLE IF NOT EXISTS "platform_settings" (
  "id"         BIGSERIAL PRIMARY KEY,
  "key"        VARCHAR(255) NOT NULL UNIQUE,
  "value"      TEXT,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Migrate existing global settings from the sentinel store record
-- (Run only once — skips if settings already migrated)
DO $$
DECLARE
  v_description TEXT;
BEGIN
  SELECT description INTO v_description
  FROM stores
  WHERE subdomain = '__creva_saas_global_settings__'
  LIMIT 1;

  IF FOUND AND v_description IS NOT NULL THEN
    INSERT INTO platform_settings (key, value)
    VALUES ('global_json', v_description)
    ON CONFLICT (key) DO NOTHING;
  END IF;
END $$;

-- Remove the sentinel fake store record (safe after migration above)
DELETE FROM stores WHERE subdomain = '__creva_saas_global_settings__';

-- ─── 4. Structured columns on stores (replace JSON blob in description) ───────

ALTER TABLE stores ADD COLUMN IF NOT EXISTS "appearance_settings"  JSONB DEFAULT '{}';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS "business_settings"    JSONB DEFAULT '{}';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS "selected_template"    VARCHAR(50) DEFAULT 'minimal';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS "whatsapp_number"      VARCHAR(50);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS "whatsapp_enabled"     BOOLEAN DEFAULT TRUE;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS "whatsapp_welcome"     TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS "payment_upi_id"       VARCHAR(255);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS "cod_enabled"          BOOLEAN DEFAULT TRUE;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS "online_payment_enabled" BOOLEAN DEFAULT TRUE;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS "address"              TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS "social_links"         JSONB DEFAULT '{}';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS "checkout_mode"        VARCHAR(50) DEFAULT 'whatsapp';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS "delivery_settings"    JSONB DEFAULT '{}';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS "announcement"         TEXT;

-- ─── 5. Categories ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "categories" (
  "id"          VARCHAR(255) NOT NULL,
  "store_id"    VARCHAR(255) NOT NULL,
  "name"        VARCHAR(255) NOT NULL,
  "slug"        VARCHAR(255) NOT NULL,
  "image_url"   TEXT DEFAULT NULL,
  "sort_order"  INTEGER DEFAULT 0,
  "is_active"   BOOLEAN DEFAULT TRUE,
  "created_at"  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at"  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_categories_store" FOREIGN KEY ("store_id") REFERENCES "stores" ("id") ON DELETE CASCADE,
  CONSTRAINT "categories_store_slug_unique" UNIQUE ("store_id", "slug")
);

-- Add category_id to products (optional foreign key, nullable for backward compat)
ALTER TABLE products ADD COLUMN IF NOT EXISTS "category_id" VARCHAR(255) DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "image_url"   TEXT DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "sizes"       TEXT DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "colors"      TEXT DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "compare_price" NUMERIC(10,2) DEFAULT NULL;

-- ─── 6. Discounts / Coupons ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "discounts" (
  "id"            VARCHAR(255) NOT NULL,
  "store_id"      VARCHAR(255) NOT NULL,
  "code"          VARCHAR(100) NOT NULL,
  "type"          VARCHAR(50) DEFAULT 'percentage',
  "value"         NUMERIC(10,2) NOT NULL,
  "minimum_order" NUMERIC(10,2) DEFAULT 0,
  "max_uses"      INTEGER DEFAULT NULL,
  "uses_count"    INTEGER DEFAULT 0,
  "is_active"     BOOLEAN DEFAULT TRUE,
  "expires_at"    TIMESTAMP DEFAULT NULL,
  "created_at"    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at"    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_discounts_store" FOREIGN KEY ("store_id") REFERENCES "stores" ("id") ON DELETE CASCADE,
  CONSTRAINT "discounts_store_code_unique" UNIQUE ("store_id", "code")
);

-- ─── 7. Blog Posts ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "blog_posts" (
  "id"           VARCHAR(255) NOT NULL,
  "store_id"     VARCHAR(255) NOT NULL,
  "title"        VARCHAR(500) NOT NULL,
  "slug"         VARCHAR(500) NOT NULL,
  "content"      TEXT,
  "excerpt"      TEXT,
  "cover_image"  TEXT,
  "status"       VARCHAR(50) DEFAULT 'draft',
  "published_at" TIMESTAMP DEFAULT NULL,
  "created_at"   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at"   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_blog_store" FOREIGN KEY ("store_id") REFERENCES "stores" ("id") ON DELETE CASCADE,
  CONSTRAINT "blog_store_slug_unique" UNIQUE ("store_id", "slug")
);

-- ─── 8. Custom Pages ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "pages" (
  "id"          VARCHAR(255) NOT NULL,
  "store_id"    VARCHAR(255) NOT NULL,
  "title"       VARCHAR(500) NOT NULL,
  "slug"        VARCHAR(500) NOT NULL,
  "content"     TEXT,
  "is_active"   BOOLEAN DEFAULT TRUE,
  "sort_order"  INTEGER DEFAULT 0,
  "created_at"  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at"  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_pages_store" FOREIGN KEY ("store_id") REFERENCES "stores" ("id") ON DELETE CASCADE,
  CONSTRAINT "pages_store_slug_unique" UNIQUE ("store_id", "slug")
);

-- ─── 9. Video Commerce Sessions ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "video_sessions" (
  "id"           VARCHAR(255) NOT NULL,
  "store_id"     VARCHAR(255) NOT NULL,
  "title"        VARCHAR(500) NOT NULL,
  "youtube_url"  VARCHAR(1000),
  "product_ids"  JSONB DEFAULT '[]',
  "status"       VARCHAR(50) DEFAULT 'scheduled',
  "scheduled_at" TIMESTAMP DEFAULT NULL,
  "description"  TEXT,
  "created_at"   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at"   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_video_store" FOREIGN KEY ("store_id") REFERENCES "stores" ("id") ON DELETE CASCADE
);

-- ─── 10. Integrations ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "integrations" (
  "id"         BIGSERIAL PRIMARY KEY,
  "store_id"   VARCHAR(255) NOT NULL,
  "type"       VARCHAR(100) NOT NULL,
  "config"     JSONB DEFAULT '{}',
  "is_active"  BOOLEAN DEFAULT TRUE,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fk_integrations_store" FOREIGN KEY ("store_id") REFERENCES "stores" ("id") ON DELETE CASCADE,
  CONSTRAINT "integrations_store_type_unique" UNIQUE ("store_id", "type")
);

-- ─── 11. Remove redundant subscription_expires_at (keep plan_ends_at) ─────────
-- Commented out by default — uncomment after verifying no code references it:
-- ALTER TABLE stores DROP COLUMN IF EXISTS subscription_expires_at;

-- ─── 12. Performance Indexes ───────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS "idx_products_store_id"         ON products(store_id);
CREATE INDEX IF NOT EXISTS "idx_products_is_active"        ON products(is_active);
CREATE INDEX IF NOT EXISTS "idx_products_category_id"      ON products(category_id);
CREATE INDEX IF NOT EXISTS "idx_orders_store_id"           ON orders(store_id);
CREATE INDEX IF NOT EXISTS "idx_orders_status"             ON orders(status);
CREATE INDEX IF NOT EXISTS "idx_orders_payment_status"     ON orders(payment_status);
CREATE INDEX IF NOT EXISTS "idx_orders_created_at"         ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS "idx_order_items_order_id"      ON order_items(order_id);
CREATE INDEX IF NOT EXISTS "idx_order_items_product_id"    ON order_items(product_id);
CREATE INDEX IF NOT EXISTS "idx_stores_owner_id"           ON stores(owner_id);
CREATE INDEX IF NOT EXISTS "idx_stores_status"             ON stores(status);
CREATE INDEX IF NOT EXISTS "idx_stores_is_paused"          ON stores(is_paused);
CREATE INDEX IF NOT EXISTS "idx_categories_store_id"       ON categories(store_id);
CREATE INDEX IF NOT EXISTS "idx_discounts_store_id"        ON discounts(store_id);
CREATE INDEX IF NOT EXISTS "idx_discounts_code"            ON discounts(store_id, code);
CREATE INDEX IF NOT EXISTS "idx_blog_posts_store_id"       ON blog_posts(store_id);
CREATE INDEX IF NOT EXISTS "idx_blog_posts_status"         ON blog_posts(status);
CREATE INDEX IF NOT EXISTS "idx_pages_store_id"            ON pages(store_id);
CREATE INDEX IF NOT EXISTS "idx_video_sessions_store_id"   ON video_sessions(store_id);
CREATE INDEX IF NOT EXISTS "idx_integrations_store_id"     ON integrations(store_id);
CREATE INDEX IF NOT EXISTS "idx_platform_settings_key"     ON platform_settings(key);
CREATE INDEX IF NOT EXISTS "idx_users_email"               ON users(email);

-- =============================================================================
-- Migration complete. Verify by running:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- =============================================================================
