import { and, eq } from "drizzle-orm";
import { database } from "../connection.ts";
import moment from "moment-timezone";
import { AlreadyInDatabaseError } from "../error/AlreadyInDatabaseError.ts";
import { NoticeData, noticeData } from "../schema/lodestone-news.ts";
import { Notice } from "../../naagostone/type/Notice.ts";

export class NoticesRepository {
  public static async find(
    title: string,
    date: Date,
  ): Promise<NoticeData | null> {
    const dateSQL = moment(date).tz("Europe/London").toDate();

    const result = await database
      .select()
      .from(noticeData)
      .where(
        and(
          eq(noticeData.title, title),
          eq(noticeData.date, dateSQL),
        ),
      )
      .limit(1);

    return result[0] ?? null;
  }

  public static async findById(id: number): Promise<NoticeData | null> {
    const result = await database
      .select()
      .from(noticeData)
      .where(eq(noticeData.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  public static async add(notice: Notice): Promise<number> {
    const dateSQL = moment(notice.date).tz("Europe/London").toDate();
    const currentNotice = await this.find(notice.title, dateSQL);
    if (currentNotice) {
      throw new AlreadyInDatabaseError(
        "This notice is already in the database",
      );
    }

    const result = await database
      .insert(noticeData)
      .values({
        tag: notice.tag,
        title: notice.title,
        link: notice.link,
        date: dateSQL,
        description: notice.description.markdown,
        descriptionV2: notice.description.discord_components_v2 ?? null,
      })
      .$returningId();

    return result[0].id;
  }

  public static async updateDescriptions(
    id: number,
    description: string,
    descriptionV2: NoticeData["descriptionV2"],
  ): Promise<void> {
    await database
      .update(noticeData)
      .set({ description, descriptionV2 })
      .where(eq(noticeData.id, id));
  }

  public static hasDescriptionChanged(
    existing: NoticeData,
    notice: Notice,
  ): { descriptionChanged: boolean; descriptionV2Changed: boolean } {
    const descriptionChanged = existing.description !== notice.description.markdown;
    const existingV2 = JSON.stringify(existing.descriptionV2 ?? null);
    const newV2 = JSON.stringify(notice.description.discord_components_v2 ?? null);
    const descriptionV2Changed = existingV2 !== newV2;

    return { descriptionChanged, descriptionV2Changed };
  }
}
