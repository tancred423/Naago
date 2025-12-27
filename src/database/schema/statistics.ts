import { index, int, mysqlTable, primaryKey, timestamp, varchar } from "drizzle-orm/mysql-core";

export const statsServerCounts = mysqlTable("stats_server_counts", {
  date: timestamp("date").notNull(),
  count: int("count").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.date] }),
  dateIdx: index("idx_stats_server_counts_date").on(table.date),
}));

// Temporary table for tracking hashed user IDs per day
export const statsActiveUsersDaily = mysqlTable("stats_active_users_daily", {
  hashedUserId: varchar("hashed_user_id", { length: 64 }).notNull(),
  date: timestamp("date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.hashedUserId, table.date] }),
  dateIdx: index("idx_stats_active_users_daily_date").on(table.date),
}));

export const statsDailyStatistics = mysqlTable("stats_daily_statistics", {
  date: timestamp("date").notNull(),
  activeUserCount: int("active_user_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.date] }),
  dateIdx: index("idx_stats_daily_statistics_date").on(table.date),
}));

export const statsCommandUsage = mysqlTable("stats_command_usage", {
  date: timestamp("date").notNull(),
  commandName: varchar("command_name", { length: 100 }).notNull(),
  count: int("count").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.date, table.commandName] }),
  dateIdx: index("idx_stats_command_usage_date").on(table.date),
  commandIdx: index("idx_stats_command_usage_command").on(table.commandName),
}));

export const statsProfileButtonUsage = mysqlTable("stats_profile_button_usage", {
  date: timestamp("date").notNull(),
  buttonName: varchar("button_name", { length: 100 }).notNull(),
  count: int("count").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.date, table.buttonName] }),
  dateIdx: index("idx_stats_profile_button_usage_date").on(table.date),
  buttonIdx: index("idx_stats_profile_button_usage_button").on(table.buttonName),
}));

export const statsLodestoneNewsSetups = mysqlTable("stats_lodestone_news_setups", {
  date: timestamp("date").notNull(),
  serverCount: int("server_count").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.date] }),
  dateIdx: index("idx_stats_lodestone_news_setups_date").on(table.date),
}));

export const statsVerifiedCharacters = mysqlTable("stats_verified_characters", {
  date: timestamp("date").notNull(),
  count: int("count").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.date] }),
  dateIdx: index("idx_stats_verified_characters_date").on(table.date),
}));

export const statsThemeUsage = mysqlTable("stats_theme_usage", {
  date: timestamp("date").notNull(),
  themeName: varchar("theme_name", { length: 100 }).notNull(),
  count: int("count").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.date, table.themeName] }),
  dateIdx: index("idx_stats_theme_usage_date").on(table.date),
  themeIdx: index("idx_stats_theme_usage_theme").on(table.themeName),
}));

export type StatsServerCount = typeof statsServerCounts.$inferSelect;
export type NewStatsServerCount = typeof statsServerCounts.$inferInsert;

export type StatsActiveUserDaily = typeof statsActiveUsersDaily.$inferSelect;
export type NewStatsActiveUserDaily = typeof statsActiveUsersDaily.$inferInsert;

export type StatsDailyStatistic = typeof statsDailyStatistics.$inferSelect;
export type NewStatsDailyStatistic = typeof statsDailyStatistics.$inferInsert;

export type StatsCommandUsage = typeof statsCommandUsage.$inferSelect;
export type NewStatsCommandUsage = typeof statsCommandUsage.$inferInsert;

export type StatsProfileButtonUsage = typeof statsProfileButtonUsage.$inferSelect;
export type NewStatsProfileButtonUsage = typeof statsProfileButtonUsage.$inferInsert;

export type StatsLodestoneNewsSetup = typeof statsLodestoneNewsSetups.$inferSelect;
export type NewStatsLodestoneNewsSetup = typeof statsLodestoneNewsSetups.$inferInsert;

export type StatsVerifiedCharacter = typeof statsVerifiedCharacters.$inferSelect;
export type NewStatsVerifiedCharacter = typeof statsVerifiedCharacters.$inferInsert;

export type StatsThemeUsage = typeof statsThemeUsage.$inferSelect;
export type NewStatsThemeUsage = typeof statsThemeUsage.$inferInsert;
