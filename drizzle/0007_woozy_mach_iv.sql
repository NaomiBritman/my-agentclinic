CREATE TABLE `plan_load_mark` (
	`user_id` text NOT NULL,
	`plan_id` text NOT NULL,
	`exercise_key` text NOT NULL,
	`date` text NOT NULL,
	PRIMARY KEY(`user_id`, `plan_id`, `exercise_key`, `date`),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
