import { and, eq, gte, like, lte, not } from "drizzle-orm";
import { database } from "../connection.ts";
import { AlreadyInDatabaseError } from "../error/AlreadyInDatabaseError.ts";
import { MaintenanceData, maintenanceData } from "../schema/lodestone-news.ts";
import { Maintenance } from "../../naagostone/type/Maintenance.ts";

export class MaintenancesRepository {
  public static async find(
    title: string,
    date: Date,
  ): Promise<MaintenanceData | null> {
    const dateSQL = new Date(date);

    const result = await database
      .select()
      .from(maintenanceData)
      .where(
        and(
          eq(maintenanceData.title, title),
          eq(maintenanceData.date, dateSQL),
        ),
      )
      .limit(1);

    return result[0] ?? null;
  }

  public static async findById(id: number): Promise<MaintenanceData | null> {
    const result = await database
      .select()
      .from(maintenanceData)
      .where(eq(maintenanceData.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  public static async add(maintenance: Maintenance): Promise<number> {
    const dateSQL = new Date(maintenance.date);
    const currentMaintenance = await this.find(maintenance.title, dateSQL);
    if (currentMaintenance) {
      throw new AlreadyInDatabaseError(
        "This maintenance is already in the database",
      );
    }

    const result = await database
      .insert(maintenanceData)
      .values({
        tag: maintenance.tag,
        title: maintenance.title,
        link: maintenance.link,
        date: dateSQL,
        description: maintenance.description.markdown,
        descriptionV2: maintenance.description.discord_components_v2 ?? null,
        startDate: maintenance.start_timestamp ? new Date(maintenance.start_timestamp) : null,
        endDate: maintenance.end_timestamp ? new Date(maintenance.end_timestamp) : null,
      })
      .$returningId();

    return result[0].id;
  }

  public static async updateDescriptions(
    id: number,
    description: string,
    descriptionV2: MaintenanceData["descriptionV2"],
  ): Promise<void> {
    await database
      .update(maintenanceData)
      .set({ description, descriptionV2 })
      .where(eq(maintenanceData.id, id));
  }

  public static hasDescriptionChanged(
    existing: MaintenanceData,
    maintenance: Maintenance,
  ): { descriptionChanged: boolean; descriptionV2Changed: boolean } {
    const descriptionChanged = existing.description !== maintenance.description.markdown;
    const existingV2 = JSON.stringify(existing.descriptionV2 ?? null);
    const newV2 = JSON.stringify(maintenance.description.discord_components_v2 ?? null);
    const descriptionV2Changed = existingV2 !== newV2;

    return { descriptionChanged, descriptionV2Changed };
  }

  public static async findActive(): Promise<MaintenanceData[]> {
    const now = new Date();

    const activeMaintenances = await database
      .select()
      .from(maintenanceData)
      .where(
        and(
          lte(maintenanceData.startDate, now),
          gte(maintenanceData.endDate, now),
          not(eq(maintenanceData.tag, "Maintenance: Follow-up")),
        ),
      )
      .orderBy(maintenanceData.id);

    const result: MaintenanceData[] = [];
    const MAX_EMBEDS = 5;

    for (const maintenance of activeMaintenances) {
      if (result.length >= MAX_EMBEDS) break;

      result.push(maintenance);

      const followUps = await database
        .select()
        .from(maintenanceData)
        .where(
          and(
            eq(maintenanceData.tag, "Maintenance: Follow-up"),
            like(maintenanceData.title, `%${maintenance.title}%`),
          ),
        )
        .orderBy(maintenanceData.id);

      for (const followUp of followUps) {
        if (result.length >= MAX_EMBEDS) break;
        result.push(followUp);
      }
    }

    return result;
  }
}
