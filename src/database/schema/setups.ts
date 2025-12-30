import { index, mysqlTable, primaryKey, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const setups = mysqlTable("setups", {
  guildId: varchar("guild_id", { length: 255 }).notNull(),
  type: varchar("type", { length: 100 }).notNull(),
  channelId: varchar("channel_id", { length: 255 }).notNull(),
  blacklistKeywords: text("blacklist_keywords"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.guildId, table.type] }),
  guildIdx: index("idx_setups_guild").on(table.guildId),
}));

export type Setup = typeof setups.$inferSelect;
export type NewSetup = typeof setups.$inferInsert;
