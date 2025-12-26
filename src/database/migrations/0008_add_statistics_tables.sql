-- Statistics Tables

CREATE TABLE `stats_server_counts` (
	`date` timestamp NOT NULL,
	`count` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stats_server_counts_date` PRIMARY KEY(`date`)
);

CREATE INDEX `idx_stats_server_counts_date` ON `stats_server_counts` (`date`);

CREATE TABLE `stats_active_users_daily` (
	`hashed_user_id` varchar(64) NOT NULL,
	`date` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stats_active_users_daily_hashed_user_id_date` PRIMARY KEY(`hashed_user_id`,`date`)
);

CREATE INDEX `idx_stats_active_users_daily_date` ON `stats_active_users_daily` (`date`);

CREATE TABLE `stats_daily_statistics` (
	`date` timestamp NOT NULL,
	`active_user_count` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stats_daily_statistics_date` PRIMARY KEY(`date`)
);

CREATE INDEX `idx_stats_daily_statistics_date` ON `stats_daily_statistics` (`date`);

CREATE TABLE `stats_command_usage` (
	`date` timestamp NOT NULL,
	`command_name` varchar(100) NOT NULL,
	`count` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stats_command_usage_date_command_name` PRIMARY KEY(`date`,`command_name`)
);

CREATE INDEX `idx_stats_command_usage_date` ON `stats_command_usage` (`date`);
CREATE INDEX `idx_stats_command_usage_command` ON `stats_command_usage` (`command_name`);

CREATE TABLE `stats_profile_button_usage` (
	`date` timestamp NOT NULL,
	`button_name` varchar(100) NOT NULL,
	`count` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stats_profile_button_usage_date_button_name` PRIMARY KEY(`date`,`button_name`)
);

CREATE INDEX `idx_stats_profile_button_usage_date` ON `stats_profile_button_usage` (`date`);
CREATE INDEX `idx_stats_profile_button_usage_button` ON `stats_profile_button_usage` (`button_name`);

CREATE TABLE `stats_lodestone_news_setups` (
	`date` timestamp NOT NULL,
	`server_count` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stats_lodestone_news_setups_date` PRIMARY KEY(`date`)
);

CREATE INDEX `idx_stats_lodestone_news_setups_date` ON `stats_lodestone_news_setups` (`date`);

CREATE TABLE `stats_verified_characters` (
	`date` timestamp NOT NULL,
	`count` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stats_verified_characters_date` PRIMARY KEY(`date`)
);

CREATE INDEX `idx_stats_verified_characters_date` ON `stats_verified_characters` (`date`);

CREATE TABLE `stats_theme_usage` (
	`date` timestamp NOT NULL,
	`theme_name` varchar(100) NOT NULL,
	`count` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stats_theme_usage_date_theme_name` PRIMARY KEY(`date`,`theme_name`)
);

CREATE INDEX `idx_stats_theme_usage_date` ON `stats_theme_usage` (`date`);
CREATE INDEX `idx_stats_theme_usage_theme` ON `stats_theme_usage` (`theme_name`);

