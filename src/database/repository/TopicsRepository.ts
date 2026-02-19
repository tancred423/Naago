import { and, desc, eq, gt, gte, isNotNull, lte, or } from "drizzle-orm";
import { database } from "../connection.ts";
import { TopicData, topicData } from "../schema/lodestone-news.ts";
import moment from "moment-timezone";
import { AlreadyInDatabaseError } from "../error/AlreadyInDatabaseError.ts";
import { Topic } from "../../naagostone/type/Topic.ts";

export class TopicsRepository {
  public static async find(
    title: string,
    date: Date,
  ): Promise<TopicData | null> {
    const dateSQL = moment(date).tz("Europe/London").toDate();

    const result = await database
      .select()
      .from(topicData)
      .where(
        and(
          eq(topicData.title, title),
          eq(topicData.date, dateSQL),
        ),
      )
      .limit(1);

    return result[0] ?? null;
  }

  public static async findById(id: number): Promise<TopicData | null> {
    const result = await database
      .select()
      .from(topicData)
      .where(eq(topicData.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  public static async add(topic: Topic): Promise<number> {
    const dateSQL = moment(topic.date).tz("Europe/London").toDate();
    const currentTopic = await this.find(topic.title, dateSQL);
    if (currentTopic) {
      throw new AlreadyInDatabaseError("This topic is already in the database");
    }

    const timestampLiveLetterSQL = topic.timestamp_live_letter ? new Date(topic.timestamp_live_letter) : null;
    const eventFromSQL = topic.event?.from ? new Date(topic.event.from) : null;
    const eventToSQL = topic.event?.to ? new Date(topic.event.to) : null;

    const result = await database
      .insert(topicData)
      .values({
        title: topic.title,
        link: topic.link,
        date: dateSQL,
        banner: topic.banner,
        description: topic.description.markdown,
        descriptionV2: topic.description.discord_components_v2 ?? null,
        timestampLiveLetter: timestampLiveLetterSQL,
        eventType: topic.event?.type ?? null,
        eventFrom: eventFromSQL,
        eventTo: eventToSQL,
      })
      .$returningId();

    return result[0].id;
  }

  public static async updateDescriptions(
    id: number,
    description: string,
    descriptionV2: TopicData["descriptionV2"],
  ): Promise<void> {
    await database
      .update(topicData)
      .set({ description, descriptionV2 })
      .where(eq(topicData.id, id));
  }

  public static async updateEvent(
    id: number,
    eventType: string | null,
    eventFrom: Date | null,
    eventTo: Date | null,
  ): Promise<void> {
    await database
      .update(topicData)
      .set({ eventType, eventFrom, eventTo })
      .where(eq(topicData.id, id));
  }

  public static hasEventChanged(
    existing: TopicData,
    topic: Topic,
  ): boolean {
    const existingEventType = existing.eventType ?? null;
    const newEventType = topic.event?.type ?? null;
    if (existingEventType !== newEventType) return true;

    const existingEventFrom = existing.eventFrom ? existing.eventFrom.getTime() : null;
    const newEventFrom = topic.event?.from ?? null;
    if (existingEventFrom !== newEventFrom) return true;

    const existingEventTo = existing.eventTo ? existing.eventTo.getTime() : null;
    const newEventTo = topic.event?.to ?? null;
    if (existingEventTo !== newEventTo) return true;

    return false;
  }

  public static hasDescriptionChanged(
    existing: TopicData,
    topic: Topic,
  ): { descriptionChanged: boolean; descriptionV2Changed: boolean } {
    const descriptionChanged = existing.description !== topic.description.markdown;
    const existingV2 = JSON.stringify(existing.descriptionV2 ?? null);
    const newV2 = JSON.stringify(topic.description.discord_components_v2 ?? null);
    const descriptionV2Changed = existingV2 !== newV2;

    return { descriptionChanged, descriptionV2Changed };
  }

  public static async getNewestLiveLetterTimestamp(): Promise<Date | null> {
    const result = await database
      .select({ timestampLiveLetter: topicData.timestampLiveLetter })
      .from(topicData)
      .where(isNotNull(topicData.timestampLiveLetter))
      .orderBy(desc(topicData.id))
      .limit(1);

    return result[0]?.timestampLiveLetter ?? null;
  }

  public static async getNewestLiveLetterTopic(): Promise<TopicData | null> {
    const result = await database
      .select()
      .from(topicData)
      .where(isNotNull(topicData.timestampLiveLetter))
      .orderBy(desc(topicData.id))
      .limit(1);

    return result[0] ?? null;
  }

  public static async getUnannouncedLiveLetters(): Promise<TopicData[]> {
    const now = new Date();
    const result = await database
      .select()
      .from(topicData)
      .where(
        and(
          isNotNull(topicData.timestampLiveLetter),
          lte(topicData.timestampLiveLetter, now),
          eq(topicData.liveLetterAnnounced, 0),
        ),
      );

    return result;
  }

  public static async markLiveLetterAsAnnounced(id: number): Promise<void> {
    await database
      .update(topicData)
      .set({ liveLetterAnnounced: 1 })
      .where(eq(topicData.id, id));
  }

  public static async getEventsEndingSoon(withinMs: number): Promise<TopicData[]> {
    const now = new Date();
    const threshold = new Date(now.getTime() + withinMs);

    const result = await database
      .select()
      .from(topicData)
      .where(
        and(
          isNotNull(topicData.eventType),
          isNotNull(topicData.eventTo),
          gt(topicData.eventTo, now),
          lte(topicData.eventTo, threshold),
          eq(topicData.eventReminderSent, 0),
        ),
      );

    return result;
  }

  public static async markEventReminderSent(id: number): Promise<void> {
    await database
      .update(topicData)
      .set({ eventReminderSent: 1 })
      .where(eq(topicData.id, id));
  }

  public static async getOngoingEvents(): Promise<TopicData[]> {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    const result = await database
      .select()
      .from(topicData)
      .where(
        or(
          and(
            isNotNull(topicData.eventType),
            isNotNull(topicData.eventFrom),
            isNotNull(topicData.eventTo),
            lte(topicData.eventFrom, now),
            gte(topicData.eventTo, now),
          ),
          and(
            isNotNull(topicData.timestampLiveLetter),
            lte(topicData.timestampLiveLetter, now),
            gte(topicData.timestampLiveLetter, twoHoursAgo),
          ),
        ),
      );

    return result.sort((a, b) => {
      const aEnd = a.eventTo?.getTime() ?? a.timestampLiveLetter?.getTime() ?? 0;
      const bEnd = b.eventTo?.getTime() ?? b.timestampLiveLetter?.getTime() ?? 0;
      return aEnd - bEnd;
    });
  }

  public static async getUpcomingEvents(): Promise<TopicData[]> {
    const now = new Date();
    const result = await database
      .select()
      .from(topicData)
      .where(
        or(
          and(
            isNotNull(topicData.eventType),
            isNotNull(topicData.eventFrom),
            gte(topicData.eventFrom, now),
          ),
          and(
            isNotNull(topicData.timestampLiveLetter),
            gte(topicData.timestampLiveLetter, now),
          ),
        ),
      );

    return result.sort((a, b) => {
      const aStart = a.eventFrom?.getTime() ?? a.timestampLiveLetter?.getTime() ?? 0;
      const bStart = b.eventFrom?.getTime() ?? b.timestampLiveLetter?.getTime() ?? 0;
      return aStart - bStart;
    });
  }
}
