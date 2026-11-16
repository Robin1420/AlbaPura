-- Costos y producción: insumos, recetas, lotes de producción y ajustes de costeo.
CREATE TABLE `supplies` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`kind` text DEFAULT 'materia' NOT NULL,
	`unit` text NOT NULL,
	`stock` real DEFAULT 0 NOT NULL,
	`min_stock` real DEFAULT 0 NOT NULL,
	`unit_cost` real DEFAULT 0 NOT NULL,
	`supplier` text,
	`notes` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL
);
CREATE TABLE `supply_movements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`supply_id` text NOT NULL REFERENCES supplies(id) ON DELETE CASCADE,
	`type` text NOT NULL,
	`qty` real NOT NULL,
	`unit_cost` real NOT NULL DEFAULT 0,
	`total_cost` real NOT NULL DEFAULT 0,
	`ref` text,
	`note` text,
	`created_by` text,
	`created_at` integer NOT NULL
);
CREATE INDEX `supply_movements_supply_idx` ON `supply_movements` (`supply_id`);
CREATE TABLE `recipes` (
	`product_slug` text PRIMARY KEY NOT NULL REFERENCES products(slug) ON DELETE CASCADE,
	`yield_units` integer DEFAULT 1 NOT NULL,
	`labor_hours` real DEFAULT 0 NOT NULL,
	`labor_rate` real,
	`overhead_pct` real,
	`waste_pct` real DEFAULT 0 NOT NULL,
	`target_margin` real DEFAULT 50 NOT NULL,
	`notes` text,
	`updated_at` integer NOT NULL
);
CREATE TABLE `recipe_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_slug` text NOT NULL REFERENCES recipes(product_slug) ON DELETE CASCADE,
	`supply_id` text NOT NULL REFERENCES supplies(id),
	`qty` real NOT NULL
);
CREATE INDEX `recipe_items_product_idx` ON `recipe_items` (`product_slug`);
CREATE TABLE `production_batches` (
	`id` text PRIMARY KEY NOT NULL,
	`product_slug` text NOT NULL REFERENCES products(slug),
	`qty` integer NOT NULL,
	`status` text DEFAULT 'planned' NOT NULL,
	`notes` text,
	`expires_at` integer,
	`cost_total` real,
	`cost_unit` real,
	`created_by` text,
	`created_at` integer NOT NULL,
	`finished_at` integer
);
CREATE TABLE `production_batch_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`batch_id` text NOT NULL REFERENCES production_batches(id) ON DELETE CASCADE,
	`supply_id` text NOT NULL REFERENCES supplies(id),
	`qty` real NOT NULL,
	`unit_cost` real NOT NULL
);
CREATE INDEX `production_batch_items_batch_idx` ON `production_batch_items` (`batch_id`);
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
