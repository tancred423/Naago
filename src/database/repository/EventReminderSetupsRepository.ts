import { eq } from "drizzle-orm";
import { database } from "../connection.ts";
import { EventReminderSetup, eventReminderSetups } from "../schema/event-reminder-setups.ts";

export class EventReminderSetupsRepository {
  public static async get(guildId: string): Promise<EventReminderSetup | null> {
    const result = await database
      .select()
      .from(eventReminderSetups)
      .where(eq(eventReminderSetups.guildId, guildId))
      .limit(1);

    return result[0] ?? null;
  }

  public static async setEnabled(guildId: string, enabled: boolean): Promise<void> {
    await database
      .insert(eventReminderSetups)
      .values({ guildId, enabled: enabled ? 1 : 0 })
      .onDuplicateKeyUpdate({ set: { enabled: enabled ? 1 : 0 } });
  }

  public static async setChannelId(guildId: string, channelId: string | null): Promise<void> {
    await database
      .insert(eventReminderSetups)
      .values({ guildId, channelId })
      .onDuplicateKeyUpdate({ set: { channelId } });
  }

  public static async set(guildId: string, enabled: boolean, channelId: string | null): Promise<void> {
    await database
      .insert(eventReminderSetups)
      .values({ guildId, enabled: enabled ? 1 : 0, channelId })
      .onDuplicateKeyUpdate({ set: { enabled: enabled ? 1 : 0, channelId } });
  }

  public static async delete(guildId: string): Promise<void> {
    await database
      .delete(eventReminderSetups)
      .where(eq(eventReminderSetups.guildId, guildId));
  }
}
