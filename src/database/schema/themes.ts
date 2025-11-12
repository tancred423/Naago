import { int, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";

export const themes = mysqlTable("themes", {
  userId: varchar("user_id", { length: 255 }).primaryKey().notNull(),
  characterId: int("character_id").unique().notNull(),
  theme: varchar("theme", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export type Theme = typeof themes.$inferSelect;
export type NewTheme = typeof themes.$inferInsert;
