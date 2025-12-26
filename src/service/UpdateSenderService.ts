import moment from "moment";
import { NaagostoneApiService } from "../naagostone/service/NaagostoneApiService.ts";
import { Update } from "../naagostone/type/Updates.ts";
import { UpdatesRepository } from "../database/repository/UpdatesRepository.ts";
import { UpdateData } from "../database/schema/lodestone-news.ts";
import { LodestoneServiceUnavailableError } from "../naagostone/error/LodestoneServiceUnavailableError.ts";
import { ComponentsV2Service } from "./ComponentsV2Service.ts";
import { NewsMessageUpdateService } from "./NewsMessageUpdateService.ts";
import * as log from "@std/log";

const saveLodestoneNews = Deno.env.get("SAVE_LODESTONE_NEWS") === "true";
const sendLodestoneNews = Deno.env.get("SEND_LODESTONE_NEWS") === "true";
const maxNewsSent = parseInt(Deno.env.get("MAX_NEWS_SENT")!, 10);

export class UpdateSenderService {
  public static async checkForNew(): Promise<number> {
    let latestUpdates: Update[];
    try {
      latestUpdates = await NaagostoneApiService.fetchLatest10Updates();
    } catch (error: unknown) {
      if (error instanceof LodestoneServiceUnavailableError) {
        log.error(`[UPDATES] Lodestone service is unavailable: ${error.message}`);
      } else if (error instanceof Error) {
        log.error(`[UPDATES] Fetching latest updates was NOT successful: ${error.message}`);
      }
      return 0;
    }

    latestUpdates.reverse();

    let newCount = 0;
    const itemsWithExisting: Array<{ update: Update; existing: UpdateData | null }> = [];

    for (const update of latestUpdates) {
      if (!update) continue;

      const date = moment(update.date).tz("Europe/London").toDate();
      const existingUpdate = await UpdatesRepository.find(update.title, date);

      itemsWithExisting.push({ update, existing: existingUpdate });

      if (!existingUpdate) {
        newCount++;
      }
    }

    const shouldSend = newCount <= maxNewsSent;

    for (const { update, existing: existingUpdate } of itemsWithExisting) {
      if (existingUpdate) {
        await this.checkForUpdates(existingUpdate, update);
        continue;
      }

      const newsId = saveLodestoneNews ? await UpdatesRepository.add(update) : undefined;
      if (sendLodestoneNews && shouldSend) {
        await ComponentsV2Service.send("updates", {
          title: update.title,
          link: update.link,
          date: update.date,
          description: update.description,
        }, newsId);
      }
    }

    return newCount;
  }

  private static async checkForUpdates(existing: UpdateData, update: Update): Promise<void> {
    const { descriptionChanged: _descriptionChanged, descriptionV2Changed } = UpdatesRepository.hasDescriptionChanged(
      existing,
      update,
    );

    if (!descriptionV2Changed) return;

    if (saveLodestoneNews) {
      await UpdatesRepository.updateDescriptions(
        existing.id,
        update.description.markdown,
        update.description.discord_components_v2 ?? null,
      );
    }

    if (!sendLodestoneNews) return;

    const { updated, failed } = await NewsMessageUpdateService.updatePostedMessages(
      "updates",
      existing.id,
      {
        title: update.title,
        link: update.link,
        date: update.date,
        description: update.description,
      },
    );

    if (updated > 0 || failed > 0) {
      log.info(`[UPDATES] Updated ${updated} messages, ${failed} failed for update: ${update.title}`);
    }
  }
}
