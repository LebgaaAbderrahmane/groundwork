CREATE INDEX IF NOT EXISTS idx_orders_shop_created ON orders (shop_id, created_at);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_orders_shop_status_created ON orders (shop_id, status, created_at);
