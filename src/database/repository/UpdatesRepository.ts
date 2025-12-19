import { and, eq } from "drizzle-orm";
import { database } from "../connection.ts";
import moment from "moment-timezone";
import { AlreadyInDatabaseError } from "../error/AlreadyInDatabaseError.ts";
import { UpdateData, updateData } from "../schema/lodestone-news.ts";
import { Update } from "../../naagostone/type/Updates.ts";

export class UpdatesRepository {
  public static async find(
    title: string,
    date: Date,
  ): Promise<UpdateData | null> {
    const dateSQL = moment(date).tz("Europe/London").toDate();

    const result = await database
      .select()
      .from(updateData)
      .where(
        and(
          eq(updateData.title, title),
          eq(updateData.date, dateSQL),
        ),
      )
      .limit(1);

    return result[0] ?? null;
  }

  public static async findById(id: number): Promise<UpdateData | null> {
    const result = await database
      .select()
      .from(updateData)
      .where(eq(updateData.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  public static async add(update: Update): Promise<number> {
    const dateSQL = moment(update.date).tz("Europe/London").toDate();
    const currentUpdate = await this.find(update.title, dateSQL);
    if (currentUpdate) {
      throw new AlreadyInDatabaseError(
        "This update is already in the database",
      );
    }

    const result = await database
      .insert(updateData)
      .values({
        title: update.title,
        link: update.link,
        date: dateSQL,
        description: update.description.markdown,
        descriptionV2: update.description.discord_components_v2 ?? null,
      })
      .$returningId();

    return result[0].id;
  }

  public static async updateDescriptions(
    id: number,
    description: string,
    descriptionV2: UpdateData["descriptionV2"],
  ): Promise<void> {
    await database
      .update(updateData)
      .set({ description, descriptionV2 })
      .where(eq(updateData.id, id));
  }

  public static hasDescriptionChanged(
    existing: UpdateData,
    update: Update,
  ): { descriptionChanged: boolean; descriptionV2Changed: boolean } {
    const descriptionChanged = existing.description !== update.description.markdown;
    const existingV2 = JSON.stringify(existing.descriptionV2 ?? null);
    const newV2 = JSON.stringify(update.description.discord_components_v2 ?? null);
    const descriptionV2Changed = existingV2 !== newV2;

    return { descriptionChanged, descriptionV2Changed };
  }
}
