CREATE TABLE `profile` (
	`user_id` text PRIMARY KEY NOT NULL,
	`age` integer NOT NULL,
	`height_cm` real NOT NULL,
	`weight_kg` real NOT NULL,
	`fitness_level` text NOT NULL,
	`goal` text NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
