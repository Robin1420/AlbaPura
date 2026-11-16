CREATE TABLE `badges` (
	`slug` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`tone` text DEFAULT 'ink' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`slug` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`image` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `contact_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`subject` text,
	`message` text NOT NULL,
	`read_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `favorites` (
	`user_id` text NOT NULL,
	`slug` text NOT NULL,
	PRIMARY KEY(`user_id`, `slug`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `media` (
	`name` text PRIMARY KEY NOT NULL,
	`original_name` text NOT NULL,
	`mime` text NOT NULL,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`bytes` integer NOT NULL,
	`alt` text DEFAULT '' NOT NULL,
	`uploaded_by` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `order_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` text NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` text NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`meta` text NOT NULL,
	`qty` integer NOT NULL,
	`price` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`public_token` text NOT NULL,
	`user_id` text,
	`email` text NOT NULL,
	`status` text NOT NULL,
	`shipping_method` text NOT NULL,
	`payment` text NOT NULL,
	`subtotal` integer NOT NULL,
	`shipping` integer NOT NULL,
	`gift` integer DEFAULT 0 NOT NULL,
	`total` integer NOT NULL,
	`address` text NOT NULL,
	`webpay_token` text,
	`webpay_auth_code` text,
	`created_at` integer NOT NULL,
	`paid_at` integer,
	`tracking_code` text,
	`shipped_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `products` (
	`slug` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category_slug` text DEFAULT 'infusiones' NOT NULL,
	`meta` text NOT NULL,
	`latin` text,
	`description` text DEFAULT '' NOT NULL,
	`price` integer NOT NULL,
	`old_price` integer,
	`stock` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`coming_soon` integer DEFAULT false NOT NULL,
	`badge` text,
	`images` text DEFAULT '[]' NOT NULL,
	`notes` text DEFAULT '[]' NOT NULL,
	`provenance` text DEFAULT '[]' NOT NULL,
	`rating` real DEFAULT 0 NOT NULL,
	`reviews` integer DEFAULT 0 NOT NULL,
	`art` text,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `subscribers` (
	`email` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'customer' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);