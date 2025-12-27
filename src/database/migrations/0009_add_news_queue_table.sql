CREATE TABLE `news_queue` (
	`id` int UNSIGNED AUTO_INCREMENT NOT NULL,
	`job_type` varchar(20) NOT NULL,
	`news_type` varchar(20) NOT NULL,
	`news_id` int NOT NULL,
	`guild_id` varchar(255) NOT NULL,
	`channel_id` varchar(255) NOT NULL,
	`message_id` varchar(255),
	`status` varchar(20) NOT NULL DEFAULT 'PENDING',
	`retry_count` int NOT NULL DEFAULT 0,
	`priority` int NOT NULL DEFAULT 0,
	`payload` json,
	`error_message` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`processed_at` timestamp,
	CONSTRAINT `news_queue_id` PRIMARY KEY(`id`)
);

CREATE INDEX `idx_news_queue_status` ON `news_queue` (`status`);
CREATE INDEX `idx_news_queue_priority` ON `news_queue` (`priority`,`created_at`);
CREATE INDEX `idx_news_queue_news` ON `news_queue` (`news_type`,`news_id`);

