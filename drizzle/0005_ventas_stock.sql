-- Utilidad por venta, historial de stock de productos y ventas manuales (WhatsApp, redes, tienda, B2B…).
ALTER TABLE order_items ADD COLUMN unit_cost real;
CREATE TABLE `stock_movements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_slug` text NOT NULL REFERENCES products(slug) ON DELETE CASCADE,
	`type` text NOT NULL,
	`qty` integer NOT NULL,
	`ref` text,
	`note` text,
	`created_by` text,
	`created_at` integer NOT NULL
);
CREATE INDEX `stock_movements_product_idx` ON `stock_movements` (`product_slug`, `created_at`);
CREATE TABLE `sales` (
	`id` text PRIMARY KEY NOT NULL,
	`channel` text NOT NULL,
	`channel_note` text,
	`customer_name` text NOT NULL,
	`customer_phone` text,
	`customer_email` text,
	`customer_doc` text,
	`customer_company` text,
	`payment` text NOT NULL,
	`paid` integer DEFAULT true NOT NULL,
	`paid_at` integer,
	`status` text DEFAULT 'completed' NOT NULL,
	`subtotal` real NOT NULL,
	`discount` real DEFAULT 0 NOT NULL,
	`shipping` real DEFAULT 0 NOT NULL,
	`total` real NOT NULL,
	`cost_total` real DEFAULT 0 NOT NULL,
	`cost_complete` integer DEFAULT true NOT NULL,
	`fee` real DEFAULT 0 NOT NULL,
	`profit` real DEFAULT 0 NOT NULL,
	`notes` text,
	`sold_at` integer NOT NULL,
	`created_by` text,
	`created_at` integer NOT NULL,
	`cancelled_at` integer
);
CREATE INDEX `sales_sold_idx` ON `sales` (`sold_at`);
CREATE TABLE `sale_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sale_id` text NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
	`product_slug` text NOT NULL,
	`name` text NOT NULL,
	`qty` integer NOT NULL,
	`price` real NOT NULL,
	`unit_cost` real
);
CREATE INDEX `sale_items_sale_idx` ON `sale_items` (`sale_id`);
