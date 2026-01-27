import { index, int, json, mysqlTable, text, timestamp, tinyint, varchar } from "drizzle-orm/mysql-core";
import { DiscordComponentsV2 } from "../../naagostone/type/DiscordComponentsV2.ts";

export const topicData = mysqlTable("topic_data", {
  id: int("id").primaryKey().autoincrement(),
  title: text("title").notNull(),
  link: text("link").notNull(),
  date: timestamp("date").notNull(),
  banner: text("banner").notNull(),
  description: text("description").notNull(),
  descriptionV2: json("description_v2").$type<DiscordComponentsV2>(),
  timestampLiveLetter: timestamp("timestamp_live_letter"),
  liveLetterAnnounced: int("live_letter_announced").notNull().default(0),
  eventType: varchar("event_type", { length: 255 }),
  eventFrom: timestamp("event_from"),
  eventTo: timestamp("event_to"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  dateIdx: index("idx_topic_date").on(table.date),
}));

export const noticeData = mysqlTable("notice_data", {
  id: int("id").primaryKey().autoincrement(),
  tag: varchar("tag", { length: 255 }),
  title: text("title").notNull(),
  date: timestamp("date").notNull(),
  link: text("link").notNull(),
  description: text("description").notNull(),
  descriptionV2: json("description_v2").$type<DiscordComponentsV2>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  dateIdx: index("idx_notice_date").on(table.date),
}));

export const maintenanceData = mysqlTable("maintenance_data", {
  id: int("id").primaryKey().autoincrement(),
  tag: varchar("tag", { length: 255 }),
  title: text("title").notNull(),
  date: timestamp("date").notNull(),
  link: text("link").notNull(),
  description: text("description").notNull(),
  descriptionV2: json("description_v2").$type<DiscordComponentsV2>(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  dateIdx: index("idx_maintenance_date").on(table.date),
  maintenancePeriodIdx: index("idx_maintenance_period").on(
    table.startDate,
    table.endDate,
  ),
}));

export const updateData = mysqlTable("update_data", {
  id: int("id").primaryKey().autoincrement(),
  title: text("title").notNull(),
  date: timestamp("date").notNull(),
  link: text("link").notNull(),
  description: text("description").notNull(),
  descriptionV2: json("description_v2").$type<DiscordComponentsV2>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  dateIdx: index("idx_update_date").on(table.date),
}));

export const statusData = mysqlTable("status_data", {
  id: int("id").primaryKey().autoincrement(),
  tag: varchar("tag", { length: 255 }),
  title: text("title").notNull(),
  date: timestamp("date").notNull(),
  link: text("link").notNull(),
  description: text("description").notNull(),
  descriptionV2: json("description_v2").$type<DiscordComponentsV2>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  dateIdx: index("idx_status_date").on(table.date),
}));

export const postedNewsMessages = mysqlTable("posted_news_messages", {
  id: int("id").primaryKey().autoincrement(),
  newsType: varchar("news_type", { length: 20 }).notNull(),
  newsId: int("news_id").notNull(),
  guildId: varchar("guild_id", { length: 255 }).notNull(),
  channelId: varchar("channel_id", { length: 255 }).notNull(),
  messageId: varchar("message_id", { length: 255 }).notNull(),
  isV2: tinyint("is_v2").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  lookupIdx: index("idx_posted_news_lookup").on(table.newsType, table.newsId),
  guildIdx: index("idx_posted_news_guild").on(table.guildId),
}));

export type TopicData = typeof topicData.$inferSelect;
export type NewTopicData = typeof topicData.$inferInsert;

export type NoticeData = typeof noticeData.$inferSelect;
export type NewNoticeData = typeof noticeData.$inferInsert;

export type MaintenanceData = typeof maintenanceData.$inferSelect;
export type NewMaintenanceData = typeof maintenanceData.$inferInsert;

export type UpdateData = typeof updateData.$inferSelect;
export type NewUpdateData = typeof updateData.$inferInsert;

export type StatusData = typeof statusData.$inferSelect;
export type NewStatusData = typeof statusData.$inferInsert;

export const newsQueue = mysqlTable("news_queue", {
  id: int("id").primaryKey().autoincrement(),
  jobType: varchar("job_type", { length: 20 }).notNull(),
  newsType: varchar("news_type", { length: 20 }).notNull(),
  newsId: int("news_id").notNull(),
  guildId: varchar("guild_id", { length: 255 }).notNull(),
  channelId: varchar("channel_id", { length: 255 }).notNull(),
  messageId: varchar("message_id", { length: 255 }),
  status: varchar("status", { length: 50 }).notNull().default("PENDING"),
  retryCount: int("retry_count").notNull().default(0),
  priority: int("priority").notNull().default(0),
  payload: json("payload").$type<NewsQueuePayload>(),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  processedAt: timestamp("processed_at"),
}, (table) => ({
  statusIdx: index("idx_news_queue_status").on(table.status),
  priorityIdx: index("idx_news_queue_priority").on(table.priority, table.createdAt),
  newsLookupIdx: index("idx_news_queue_news").on(table.newsType, table.newsId),
}));

export type PostedNewsMessage = typeof postedNewsMessages.$inferSelect;
export type NewPostedNewsMessage = typeof postedNewsMessages.$inferInsert;

export type NewsQueueJob = typeof newsQueue.$inferSelect;
export type NewNewsQueueJob = typeof newsQueue.$inferInsert;

export type NewsType = "topics" | "notices" | "maintenances" | "updates" | "statuses";
export type JobType = "SEND" | "UPDATE";
export type JobStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "STOPPED_MISSING_PERMISSIONS";

export interface NewsQueuePayload {
  title: string;
  link: string;
  date: number;
  banner?: string;
  tag?: string | null;
  description: {
    html: string;
    markdown: string;
    discord_components_v2?: DiscordComponentsV2;
  };
}
