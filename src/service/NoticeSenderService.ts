import moment from "moment";
import { StringManipulationService } from "./StringManipulationService.ts";
import { NoticesRepository } from "../database/repository/NoticesRepository.ts";
import { NaagostoneApiService } from "../naagostone/service/NaagostoneApiService.ts";
import { Notice } from "../naagostone/type/Notice.ts";
import { NoticeData } from "../database/schema/lodestone-news.ts";
import { LodestoneServiceUnavailableError } from "../naagostone/error/LodestoneServiceUnavailableError.ts";
import { ComponentsV2Service } from "./ComponentsV2Service.ts";
import { NewsMessageUpdateService } from "./NewsMessageUpdateService.ts";
import * as log from "@std/log";

const saveLodestoneNews = Deno.env.get("SAVE_LODESTONE_NEWS") === "true";
const sendLodestoneNews = Deno.env.get("SEND_LODESTONE_NEWS") === "true";
const maxNewsSent = parseInt(Deno.env.get("MAX_NEWS_SENT")!, 10);

export class NoticeSenderService {
  public static async checkForNew(): Promise<number> {
    let latestNotices: Notice[];
    try {
      latestNotices = await NaagostoneApiService.fetchLatest10Notices();
    } catch (error: unknown) {
      if (error instanceof LodestoneServiceUnavailableError) {
        log.error(`[NOTICES] Lodestone service is unavailable: ${error.message}`);
      } else if (error instanceof Error) {
        log.error(`[NOTICES] Fetching latest notices was NOT successful: ${error.message}`);
      }
      return 0;
    }

    latestNotices.reverse();

    let newCount = 0;
    const itemsWithExisting: Array<{ notice: Notice; existing: NoticeData | null }> = [];

    for (const notice of latestNotices) {
      if (!notice) continue;

      notice.tag = StringManipulationService.convertTag("notice", notice.tag);

      const date = moment(notice.date).tz("Europe/London").toDate();
      const existingNotice = await NoticesRepository.find(notice.title, date);

      itemsWithExisting.push({ notice, existing: existingNotice });

      if (!existingNotice) {
        newCount++;
      }
    }

    const shouldSend = newCount <= maxNewsSent;

    for (const { notice, existing: existingNotice } of itemsWithExisting) {
      if (existingNotice) {
        await this.checkForUpdates(existingNotice, notice);
        continue;
      }

      const newsId = saveLodestoneNews ? await NoticesRepository.add(notice) : undefined;
      if (sendLodestoneNews && shouldSend) {
        await ComponentsV2Service.send("notices", {
          title: notice.title,
          link: notice.link,
          date: notice.date,
          tag: notice.tag,
          description: notice.description,
        }, newsId);
      }
    }

    return newCount;
  }

  private static async checkForUpdates(existing: NoticeData, notice: Notice): Promise<void> {
    const { descriptionChanged: _descriptionChanged, descriptionV2Changed } = NoticesRepository.hasDescriptionChanged(
      existing,
      notice,
    );

    if (!descriptionV2Changed) return;

    if (saveLodestoneNews) {
      await NoticesRepository.updateDescriptions(
        existing.id,
        notice.description.markdown,
        notice.description.discord_components_v2 ?? null,
      );
    }

    if (!sendLodestoneNews) return;

    const { updated, failed } = await NewsMessageUpdateService.updatePostedMessages(
      "notices",
      existing.id,
      {
        title: notice.title,
        link: notice.link,
        date: notice.date,
        tag: notice.tag,
        description: notice.description,
      },
    );

    if (updated > 0 || failed > 0) {
      log.info(`[NOTICES] Updated ${updated} messages, ${failed} failed for notice: ${notice.title}`);
    }
  }
}
