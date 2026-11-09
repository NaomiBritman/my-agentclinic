CREATE TABLE `test_plan` (
	`user_id` text PRIMARY KEY NOT NULL,
	`id` text NOT NULL,
	`test_profile_key` text NOT NULL,
	`start_date` text NOT NULL,
	`exercise` text NOT NULL,
	`menu` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
