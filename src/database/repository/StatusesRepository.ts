import { and, eq } from "drizzle-orm";
import { database } from "../connection.ts";
import moment from "moment-timezone";
import { AlreadyInDatabaseError } from "../error/AlreadyInDatabaseError.ts";
import { StatusData, statusData } from "../schema/lodestone-news.ts";
import { Status } from "../../naagostone/type/Status.ts";

export class StatusesRepository {
  public static async find(
    title: string,
    date: Date,
  ): Promise<StatusData | null> {
    const dateSQL = moment(date).tz("Europe/London").toDate();

    const result = await database
      .select()
      .from(statusData)
      .where(
        and(
          eq(statusData.title, title),
          eq(statusData.date, dateSQL),
        ),
      )
      .limit(1);

    return result[0] ?? null;
  }

  public static async findById(id: number): Promise<StatusData | null> {
    const result = await database
      .select()
      .from(statusData)
      .where(eq(statusData.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  public static async add(status: Status): Promise<number> {
    const dateSQL = moment(status.date).tz("Europe/London").toDate();
    const currentStatus = await this.find(status.title, dateSQL);
    if (currentStatus) {
      throw new AlreadyInDatabaseError(
        "This status is already in the database",
      );
    }

    const result = await database
      .insert(statusData)
      .values({
        tag: status.tag,
        title: status.title,
        link: status.link,
        date: dateSQL,
        description: status.description.markdown,
        descriptionV2: status.description.discord_components_v2 ?? null,
      })
      .$returningId();

    return result[0].id;
  }

  public static async updateDescriptions(
    id: number,
    description: string,
    descriptionV2: StatusData["descriptionV2"],
  ): Promise<void> {
    await database
      .update(statusData)
      .set({ description, descriptionV2 })
      .where(eq(statusData.id, id));
  }

  public static hasDescriptionChanged(
    existing: StatusData,
    status: Status,
  ): { descriptionChanged: boolean; descriptionV2Changed: boolean } {
    const descriptionChanged = existing.description !== status.description.markdown;
    const existingV2 = JSON.stringify(existing.descriptionV2 ?? null);
    const newV2 = JSON.stringify(status.description.discord_components_v2 ?? null);
    const descriptionV2Changed = existingV2 !== newV2;

    return { descriptionChanged, descriptionV2Changed };
  }
}
