import { and, eq, gt, gte, lte } from "drizzle-orm";
import { database } from "../connection.ts";
import { AlreadyInDatabaseError } from "../error/AlreadyInDatabaseError.ts";
import { MaintenanceData, maintenanceData } from "../schema/lodestone-news.ts";
import { Maintenance } from "../../naagostone/type/Maintenance.ts";

export class MaintenancesRepository {
  public static async find(
    title: string,
    date: Date,
  ): Promise<MaintenanceData | null> {
    const result = await database
      .select()
      .from(maintenanceData)
      .where(
        and(
          eq(maintenanceData.title, title),
          eq(maintenanceData.date, date),
        ),
      )
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

  public static async getOngoingMaintenances(): Promise<MaintenanceData[]> {
    const now = new Date();

    const result = await database
      .select()
      .from(maintenanceData)
      .where(
        and(
          lte(maintenanceData.startDate, now),
          gte(maintenanceData.endDate, now),
        ),
      )
      .orderBy(maintenanceData.endDate);

    return result;
  }

  public static async getUpcomingMaintenances(): Promise<MaintenanceData[]> {
    const now = new Date();

    const result = await database
      .select()
      .from(maintenanceData)
      .where(
        and(
          gt(maintenanceData.startDate, now),
        ),
      )
      .orderBy(maintenanceData.startDate);

    return result;
  }
}
