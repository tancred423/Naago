import moment from "moment";
import { StringManipulationService } from "./StringManipulationService.ts";
import { NaagostoneApiService } from "../naagostone/service/NaagostoneApiService.ts";
import { Maintenance } from "../naagostone/type/Maintenance.ts";
import { MaintenancesRepository } from "../database/repository/MaintenancesRepository.ts";
import { MaintenanceData } from "../database/schema/lodestone-news.ts";
import { ComponentsV2Service } from "./ComponentsV2Service.ts";
import { NewsMessageUpdateService } from "./NewsMessageUpdateService.ts";
import * as log from "@std/log";

const saveLodestoneNews = Deno.env.get("SAVE_LODESTONE_NEWS") === "true";
const sendLodestoneNews = Deno.env.get("SEND_LODESTONE_NEWS") === "true";
const maxNewsSent = parseInt(Deno.env.get("MAX_NEWS_SENT")!, 10);

export class MaintenanceSenderService {
  public static async checkForNew(): Promise<number> {
    let latestMaintenances: Maintenance[];
    try {
      latestMaintenances = await NaagostoneApiService.fetchLatest10Maintenances();
    } catch (error: unknown) {
      if (error instanceof Error) {
        log.error(`[MAINTENANCES] Fetching latest maintenances was NOT successful: ${error.message}`);
      }
      return 0;
    }

    latestMaintenances.reverse();

    let newCount = 0;
    const itemsWithExisting: Array<{ maintenance: Maintenance; existing: MaintenanceData | null }> = [];

    for (const maintenance of latestMaintenances) {
      if (!maintenance) continue;

      maintenance.tag = maintenance.tag === "[Maintenance]" ? null : maintenance.tag;
      maintenance.tag = StringManipulationService.convertTag("maintenance", maintenance.tag ?? null);

      const date = moment(maintenance.date).tz("Europe/London").toDate();
      const existingMaintenance = await MaintenancesRepository.find(maintenance.title, date);

      itemsWithExisting.push({ maintenance, existing: existingMaintenance });

      if (!existingMaintenance) {
        newCount++;
      }
    }

    const shouldSend = newCount <= maxNewsSent;

    for (const { maintenance, existing: existingMaintenance } of itemsWithExisting) {
      if (existingMaintenance) {
        await this.checkForUpdates(existingMaintenance, maintenance);
        continue;
      }

      const newsId = saveLodestoneNews ? await MaintenancesRepository.add(maintenance) : undefined;
      if (sendLodestoneNews && shouldSend) {
        await ComponentsV2Service.send("maintenances", {
          title: maintenance.title,
          link: maintenance.link,
          date: maintenance.date,
          tag: maintenance.tag,
          description: maintenance.description,
        }, newsId);
      }
    }

    return newCount;
  }

  private static async checkForUpdates(existing: MaintenanceData, maintenance: Maintenance): Promise<void> {
    const { descriptionChanged: _descriptionChanged, descriptionV2Changed } = MaintenancesRepository
      .hasDescriptionChanged(
        existing,
        maintenance,
      );

    if (!descriptionV2Changed) return;

    if (saveLodestoneNews) {
      await MaintenancesRepository.updateDescriptions(
        existing.id,
        maintenance.description.markdown,
        maintenance.description.discord_components_v2 ?? null,
      );
    }

    if (!sendLodestoneNews) return;

    const { updated, failed } = await NewsMessageUpdateService.updatePostedMessages(
      "maintenances",
      existing.id,
      {
        title: maintenance.title,
        link: maintenance.link,
        date: maintenance.date,
        tag: maintenance.tag,
        description: maintenance.description,
      },
    );

    if (updated > 0 || failed > 0) {
      log.info(`[MAINTENANCES] Updated ${updated} messages, ${failed} failed for maintenance: ${maintenance.title}`);
    }
  }
}
