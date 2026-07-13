CREATE TABLE `address_book` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer NOT NULL,
	`label` text NOT NULL,
	`street` text NOT NULL,
	`city` text NOT NULL,
	`state` text,
	`country` text NOT NULL,
	`postal_code` text,
	`lat` real,
	`lng` real,
	`is_default` integer DEFAULT false,
	`created_at` text DEFAULT datetime('now'),
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `assignments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`driver_id` integer,
	`vehicle_id` integer,
	`type` text DEFAULT 'auto',
	`status` text DEFAULT 'pending',
	`scheduled_at` text,
	`accepted_at` text,
	`rejected_at` text,
	`rejection_reason` text,
	`expires_at` text,
	`notes` text,
	`created_at` text DEFAULT datetime('now'),
	`updated_at` text DEFAULT datetime('now'),
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`driver_id`) REFERENCES `drivers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `conversation_ratings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`conversation_id` integer NOT NULL,
	`rating` integer NOT NULL,
	`comment` text,
	`resolved` integer DEFAULT false,
	`first_response_time_ms` integer,
	`created_at` text DEFAULT datetime('now'),
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_identifier` text NOT NULL,
	`user_name` text,
	`user_email` text,
	`user_phone` text,
	`user_country` text,
	`country_code` text,
	`status` text DEFAULT 'ai_active',
	`channel` text DEFAULT 'web',
	`whatsapp_instance` text,
	`whatsapp_message_id` text,
	`booking_reference` text,
	`assigned_agent_id` integer,
	`ai_confidence` real,
	`last_message_at` text,
	`flagged` integer DEFAULT false,
	`flag_reason` text,
	`first_agent_response_at` text,
	`created_at` text DEFAULT datetime('now'),
	`updated_at` text DEFAULT datetime('now'),
	FOREIGN KEY (`assigned_agent_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`clerk_id` text,
	`email` text,
	`phone` text,
	`first_name` text,
	`last_name` text,
	`preferred_language` text DEFAULT 'en',
	`timezone` text,
	`status` text DEFAULT 'active',
	`source` text DEFAULT 'organic',
	`referral_code` text,
	`preferences` text,
	`created_at` text DEFAULT datetime('now'),
	`updated_at` text DEFAULT datetime('now'),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `dispatch_zones` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`center_lat` real NOT NULL,
	`center_lng` real NOT NULL,
	`radius_km` real NOT NULL,
	`is_active` integer DEFAULT true,
	`priority` integer DEFAULT 0,
	`created_at` text DEFAULT datetime('now'),
	`updated_at` text DEFAULT datetime('now')
);
--> statement-breakpoint
CREATE TABLE `driver_documents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`driver_id` integer NOT NULL,
	`type` text NOT NULL,
	`file_url` text NOT NULL,
	`expires_at` text,
	`created_at` text DEFAULT datetime('now'),
	FOREIGN KEY (`driver_id`) REFERENCES `drivers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `driver_performance` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`driver_id` integer NOT NULL,
	`period` text NOT NULL,
	`completed_trips` integer DEFAULT 0,
	`cancelled_trips` integer DEFAULT 0,
	`total_distance_km` real DEFAULT 0,
	`total_duration_min` integer DEFAULT 0,
	`average_rating` real DEFAULT 0,
	`on_time_rate` real DEFAULT 0,
	`revenue_cents` integer DEFAULT 0,
	`created_at` text DEFAULT datetime('now'),
	`updated_at` text DEFAULT datetime('now'),
	FOREIGN KEY (`driver_id`) REFERENCES `drivers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `drivers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`clerk_id` text,
	`user_id` integer,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`email` text,
	`phone` text,
	`license_number` text,
	`license_type` text,
	`license_expiry` text,
	`status` text DEFAULT 'pending_verification',
	`vehicle_id` integer,
	`rating` real DEFAULT 0,
	`total_trips` integer DEFAULT 0,
	`current_lat` real,
	`current_lng` real,
	`is_online` integer DEFAULT false,
	`preferred_zones` text,
	`created_at` text DEFAULT datetime('now'),
	`updated_at` text DEFAULT datetime('now'),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `employee_activity` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`activity_type` text NOT NULL,
	`description` text,
	`created_at` text DEFAULT datetime('now'),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `experience_bookings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer,
	`experience_id` text NOT NULL,
	`date` text NOT NULL,
	`time` text NOT NULL,
	`participants` integer NOT NULL,
	`price` integer NOT NULL,
	`hotel_id` integer,
	`special_requests` text,
	`status` text DEFAULT 'pending',
	`created_at` text DEFAULT datetime('now'),
	`updated_at` text DEFAULT datetime('now'),
	FOREIGN KEY (`customer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`experience_id`) REFERENCES `experiences`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`hotel_id`) REFERENCES `hotels`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `experiences` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`duration_minutes` integer NOT NULL,
	`base_price` integer NOT NULL,
	`max_participants` integer NOT NULL,
	`includes` text,
	`excludes` text,
	`requirements` text,
	`images` text,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT datetime('now'),
	`updated_at` text DEFAULT datetime('now')
);
--> statement-breakpoint
CREATE TABLE `hotels` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`address` text,
	`lat` real,
	`lng` real,
	`phone` text,
	`email` text,
	`website` text,
	`photos` text,
	`stars` integer,
	`status` text DEFAULT 'active',
	`commission_rate` real DEFAULT 0.1,
	`created_at` text DEFAULT datetime('now'),
	`updated_at` text DEFAULT datetime('now')
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`conversation_id` integer NOT NULL,
	`sender_type` text NOT NULL,
	`sender_id` integer,
	`content` text NOT NULL,
	`message_type` text DEFAULT 'text',
	`metadata` text,
	`created_at` text DEFAULT datetime('now'),
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `modules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`icon` text,
	`sort_order` integer DEFAULT 0,
	`created_at` text DEFAULT datetime('now')
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`channel` text NOT NULL,
	`type` text NOT NULL,
	`priority` text DEFAULT 'normal',
	`title` text NOT NULL,
	`body` text NOT NULL,
	`data` text,
	`scheduled_at` text,
	`sent_at` text,
	`delivered_at` text,
	`read_at` text,
	`dedup_key` text,
	`created_at` text DEFAULT datetime('now'),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `order_status_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`old_status` text,
	`new_status` text NOT NULL,
	`changed_by` integer,
	`notes` text,
	`created_at` text DEFAULT datetime('now'),
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`changed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`booking_reference` text NOT NULL,
	`status` text DEFAULT 'new',
	`dispatch_status` text,
	`priority` text DEFAULT 'normal',
	`type` text DEFAULT 'airport_transfer',
	`package_name` text,
	`experience_type` text,
	`passenger_count` integer DEFAULT 1,
	`luggage_count` integer DEFAULT 0,
	`arrival_date` text,
	`arrival_time` text,
	`flight_number` text,
	`airline` text,
	`flight_origin` text,
	`flight_terminal` text,
	`origin_address` text,
	`origin_lat` real,
	`origin_lng` real,
	`destination_address` text,
	`destination_lat` real,
	`destination_lng` real,
	`return_trip` integer DEFAULT false,
	`return_date` text,
	`return_time` text,
	`special_requests` text,
	`promo_code` text,
	`package_price` integer DEFAULT 0,
	`return_trip_charge` integer DEFAULT 0,
	`service_fee` integer DEFAULT 0,
	`tax_amount` integer DEFAULT 0,
	`discount_amount` integer DEFAULT 0,
	`total_amount` integer DEFAULT 0,
	`currency` text DEFAULT 'USD',
	`payment_status` text DEFAULT 'pending',
	`contact_email` text,
	`contact_phone` text,
	`contact_name` text,
	`assigned_to` integer,
	`assigned_at` text,
	`assigned_by` integer,
	`driver_id` integer,
	`vehicle_id` integer,
	`hotel_id` integer,
	`actual_pickup_at` text,
	`actual_dropoff_at` text,
	`cancelled_at` text,
	`cancellation_reason` text,
	`cancelled_by` text,
	`created_at` text DEFAULT datetime('now'),
	`updated_at` text DEFAULT datetime('now')
);
--> statement-breakpoint
CREATE TABLE `outgoing_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`channel` text NOT NULL,
	`recipient` text NOT NULL,
	`content` text NOT NULL,
	`content_type` text DEFAULT 'text',
	`metadata` text,
	`max_attempts` integer DEFAULT 3,
	`status` text DEFAULT 'pending',
	`attempts` integer DEFAULT 0,
	`last_error` text,
	`scheduled_at` text,
	`sent_at` text,
	`created_at` text DEFAULT datetime('now'),
	`updated_at` text DEFAULT datetime('now')
);
--> statement-breakpoint
CREATE TABLE `passengers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`email` text,
	`phone` text,
	`is_primary` integer DEFAULT false,
	`created_at` text DEFAULT datetime('now'),
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`amount` integer NOT NULL,
	`currency` text DEFAULT 'USD',
	`provider` text NOT NULL,
	`type` text DEFAULT 'booking',
	`status` text DEFAULT 'pending',
	`provider_payment_id` text,
	`provider_data` text,
	`description` text,
	`customer_email` text,
	`customer_name` text,
	`split_status` text,
	`created_at` text DEFAULT datetime('now'),
	`updated_at` text DEFAULT datetime('now'),
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `promotions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`hotel_id` integer,
	`type` text NOT NULL,
	`code` text NOT NULL,
	`discount_amount` integer NOT NULL,
	`is_active` integer DEFAULT true,
	`usage_limit` integer,
	`used_count` integer DEFAULT 0,
	`starts_at` text,
	`ends_at` text,
	`applicable_packages` text,
	`applicable_experiences` text,
	`created_at` text DEFAULT datetime('now'),
	`updated_at` text DEFAULT datetime('now'),
	FOREIGN KEY (`hotel_id`) REFERENCES `hotels`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `ratings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`conversation_id` integer NOT NULL,
	`customer_name` text,
	`customer_country` text,
	`rating` integer NOT NULL,
	`comment` text,
	`resolved` integer DEFAULT false,
	`first_response_time_ms` integer,
	`created_at` text DEFAULT datetime('now'),
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `role_permissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`role_id` integer NOT NULL,
	`module_id` integer NOT NULL,
	`can_view` integer DEFAULT false,
	`can_create` integer DEFAULT false,
	`can_update` integer DEFAULT false,
	`can_delete` integer DEFAULT false,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`module_id`) REFERENCES `modules`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` text DEFAULT datetime('now')
);
--> statement-breakpoint
CREATE TABLE `room_bookings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`room_id` integer NOT NULL,
	`hotel_id` integer NOT NULL,
	`guest_name` text NOT NULL,
	`guest_email` text,
	`check_in` text NOT NULL,
	`check_out` text NOT NULL,
	`total_price` integer NOT NULL,
	`status` text DEFAULT 'pending',
	`created_at` text DEFAULT datetime('now'),
	`updated_at` text DEFAULT datetime('now'),
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`hotel_id`) REFERENCES `hotels`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`hotel_id` integer NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`capacity` integer NOT NULL,
	`price_per_night` integer NOT NULL,
	`amenities` text,
	`photos` text,
	`status` text DEFAULT 'available',
	`created_at` text DEFAULT datetime('now'),
	`updated_at` text DEFAULT datetime('now'),
	FOREIGN KEY (`hotel_id`) REFERENCES `hotels`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text,
	`updated_at` text DEFAULT datetime('now')
);
--> statement-breakpoint
CREATE TABLE `support_agents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text,
	`status` text DEFAULT 'offline',
	`max_conversations` integer DEFAULT 5,
	`current_conversations` integer DEFAULT 0,
	`specializations` text,
	`created_at` text DEFAULT datetime('now'),
	`updated_at` text DEFAULT datetime('now'),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_roles` (
	`user_id` integer NOT NULL,
	`role_id` integer NOT NULL,
	`created_at` text DEFAULT datetime('now'),
	PRIMARY KEY(`user_id`, `role_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`clerk_id` text NOT NULL,
	`name` text,
	`email` text NOT NULL,
	`password_hash` text,
	`role_id` integer,
	`hotel_id` integer,
	`status` text DEFAULT 'active',
	`created_at` text DEFAULT datetime('now'),
	`updated_at` text DEFAULT datetime('now'),
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `vehicles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`plate` text NOT NULL,
	`brand` text NOT NULL,
	`model` text NOT NULL,
	`year` integer NOT NULL,
	`color` text NOT NULL,
	`type` text NOT NULL,
	`fuel_type` text NOT NULL,
	`capacity` integer NOT NULL,
	`vin` text,
	`registration_expiry` text NOT NULL,
	`insurance_expiry` text NOT NULL,
	`soat_expiry` text NOT NULL,
	`tech_review_expiry` text,
	`gps_device_id` text,
	`assigned_driver_id` integer,
	`status` text DEFAULT 'active',
	`created_at` text DEFAULT datetime('now'),
	`updated_at` text DEFAULT datetime('now'),
	`metadata` text,
	FOREIGN KEY (`assigned_driver_id`) REFERENCES `drivers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `whatsapp_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_type` text NOT NULL,
	`instance_name` text,
	`remote_jid` text,
	`message_id` text,
	`from_me` integer,
	`content` text,
	`message_type` text,
	`participant` text,
	`status` text,
	`conversation_id` integer,
	`raw_payload` text,
	`created_at` text DEFAULT datetime('now')
);
--> statement-breakpoint
CREATE INDEX `assignments_order_id_idx` ON `assignments` (`order_id`);--> statement-breakpoint
CREATE INDEX `assignments_driver_id_idx` ON `assignments` (`driver_id`);--> statement-breakpoint
CREATE INDEX `assignments_status_idx` ON `assignments` (`status`);--> statement-breakpoint
CREATE INDEX `conversations_status_idx` ON `conversations` (`status`);--> statement-breakpoint
CREATE INDEX `conversations_user_identifier_idx` ON `conversations` (`user_identifier`);--> statement-breakpoint
CREATE INDEX `conversations_booking_ref_idx` ON `conversations` (`booking_reference`);--> statement-breakpoint
CREATE INDEX `conversations_assigned_agent_idx` ON `conversations` (`assigned_agent_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `customers_clerk_id_unique` ON `customers` (`clerk_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `drivers_clerk_id_unique` ON `drivers` (`clerk_id`);--> statement-breakpoint
CREATE INDEX `drivers_status_idx` ON `drivers` (`status`);--> statement-breakpoint
CREATE INDEX `drivers_user_id_idx` ON `drivers` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `hotels_slug_unique` ON `hotels` (`slug`);--> statement-breakpoint
CREATE INDEX `hotels_slug_idx` ON `hotels` (`slug`);--> statement-breakpoint
CREATE INDEX `hotels_status_idx` ON `hotels` (`status`);--> statement-breakpoint
CREATE INDEX `messages_conversation_id_idx` ON `messages` (`conversation_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `modules_slug_unique` ON `modules` (`slug`);--> statement-breakpoint
CREATE INDEX `notifications_user_id_idx` ON `notifications` (`user_id`);--> statement-breakpoint
CREATE INDEX `notifications_type_idx` ON `notifications` (`type`);--> statement-breakpoint
CREATE INDEX `notifications_read_idx` ON `notifications` (`read_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `orders_booking_reference_unique` ON `orders` (`booking_reference`);--> statement-breakpoint
CREATE INDEX `orders_booking_ref_idx` ON `orders` (`booking_reference`);--> statement-breakpoint
CREATE INDEX `orders_status_idx` ON `orders` (`status`);--> statement-breakpoint
CREATE INDEX `orders_dispatch_status_idx` ON `orders` (`dispatch_status`);--> statement-breakpoint
CREATE INDEX `orders_assigned_to_idx` ON `orders` (`assigned_to`);--> statement-breakpoint
CREATE INDEX `orders_driver_id_idx` ON `orders` (`driver_id`);--> statement-breakpoint
CREATE INDEX `orders_arrival_date_idx` ON `orders` (`arrival_date`);--> statement-breakpoint
CREATE INDEX `orders_created_at_idx` ON `orders` (`created_at`);--> statement-breakpoint
CREATE INDEX `payments_order_id_idx` ON `payments` (`order_id`);--> statement-breakpoint
CREATE INDEX `payments_status_idx` ON `payments` (`status`);--> statement-breakpoint
CREATE INDEX `payments_provider_payment_id_idx` ON `payments` (`provider_payment_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `promotions_code_unique` ON `promotions` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `role_module_unique` ON `role_permissions` (`role_id`,`module_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `roles_name_unique` ON `roles` (`name`);--> statement-breakpoint
CREATE INDEX `rooms_hotel_id_idx` ON `rooms` (`hotel_id`);--> statement-breakpoint
CREATE INDEX `rooms_status_idx` ON `rooms` (`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_clerk_id_unique` ON `users` (`clerk_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_clerk_id_idx` ON `users` (`clerk_id`);--> statement-breakpoint
CREATE INDEX `users_email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `vehicles_plate_unique` ON `vehicles` (`plate`);--> statement-breakpoint
CREATE INDEX `vehicles_status_idx` ON `vehicles` (`status`);--> statement-breakpoint
CREATE INDEX `vehicles_plate_idx` ON `vehicles` (`plate`);