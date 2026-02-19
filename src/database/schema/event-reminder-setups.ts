import { int, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";

export const eventReminderSetups = mysqlTable("event_reminder_setups", {
  guildId: varchar("guild_id", { length: 255 }).primaryKey(),
  enabled: int("enabled").notNull().default(1),
  channelId: varchar("channel_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type EventReminderSetup = typeof eventReminderSetups.$inferSelect;
export type NewEventReminderSetup = typeof eventReminderSetups.$inferInsert;
