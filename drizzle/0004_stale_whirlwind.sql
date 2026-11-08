CREATE TABLE `day_note` (
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`text` text NOT NULL,
	PRIMARY KEY(`user_id`, `date`),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tracking_mark` (
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`item_type` text NOT NULL,
	`item_key` text NOT NULL,
	`item_name` text NOT NULL,
	PRIMARY KEY(`user_id`, `date`, `item_type`, `item_key`),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
