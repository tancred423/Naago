import moment from "moment";
import { StringManipulationService } from "./StringManipulationService.ts";
import * as log from "@std/log";
import { NaagostoneApiService } from "../naagostone/service/NaagostoneApiService.ts";
import { Status } from "../naagostone/type/Status.ts";
import { StatusesRepository } from "../database/repository/StatusesRepository.ts";
import { StatusData } from "../database/schema/lodestone-news.ts";
import { LodestoneServiceUnavailableError } from "../naagostone/error/LodestoneServiceUnavailableError.ts";
import { ComponentsV2Service } from "./ComponentsV2Service.ts";
import { NewsMessageUpdateService } from "./NewsMessageUpdateService.ts";

const saveLodestoneNews = Deno.env.get("SAVE_LODESTONE_NEWS") === "true";
const sendLodestoneNews = Deno.env.get("SEND_LODESTONE_NEWS") === "true";
const maxNewsSent = parseInt(Deno.env.get("MAX_NEWS_SENT")!, 10);

export default class StatusSenderService {
  public static async checkForNew(): Promise<number> {
    let latestStatuses: Status[];
    try {
      latestStatuses = await NaagostoneApiService.fetchLatest10Statuses();
    } catch (error: unknown) {
      if (error instanceof LodestoneServiceUnavailableError) {
        log.error(`[STATUS] Lodestone service is unavailable: ${error.message}`);
      } else if (error instanceof Error) {
        log.error(`[STATUS] Fetching latest statuses was NOT successful: ${error.message}`);
      }
      return 0;
    }

    latestStatuses.reverse();

    let newCount = 0;
    const itemsWithExisting: Array<{ status: Status; existing: StatusData | null }> = [];

    for (const status of latestStatuses) {
      if (!status) continue;

      status.tag = StringManipulationService.convertTag("status", status.tag);

      const date = moment(status.date).tz("Europe/London").toDate();
      const existingStatus = await StatusesRepository.find(status.title, date);

      itemsWithExisting.push({ status, existing: existingStatus });

      if (!existingStatus) {
        newCount++;
      }
    }

    const shouldSend = newCount <= maxNewsSent;

    for (const { status, existing: existingStatus } of itemsWithExisting) {
      if (existingStatus) {
        await this.checkForUpdates(existingStatus, status);
        continue;
      }

      const newsId = saveLodestoneNews ? await StatusesRepository.add(status) : undefined;
      if (sendLodestoneNews && shouldSend) {
        await ComponentsV2Service.send("statuses", {
          title: status.title,
          link: status.link,
          date: status.date,
          tag: status.tag,
          description: status.description,
        }, newsId);
      }
    }

    return newCount;
  }

  private static async checkForUpdates(existing: StatusData, status: Status): Promise<void> {
    const { descriptionChanged: _descriptionChanged, descriptionV2Changed } = StatusesRepository.hasDescriptionChanged(
      existing,
      status,
    );

    if (!descriptionV2Changed) return;

    if (saveLodestoneNews) {
      await StatusesRepository.updateDescriptions(
        existing.id,
        status.description.markdown,
        status.description.discord_components_v2 ?? null,
      );
    }

    if (!sendLodestoneNews) return;

    const { updated, failed } = await NewsMessageUpdateService.updatePostedMessages(
      "statuses",
      existing.id,
      {
        title: status.title,
        link: status.link,
        date: status.date,
        tag: status.tag,
        description: status.description,
      },
    );

    if (updated > 0 || failed > 0) {
      log.info(`[STATUS] Updated ${updated} messages, ${failed} failed for status: ${status.title}`);
    }
  }
}
