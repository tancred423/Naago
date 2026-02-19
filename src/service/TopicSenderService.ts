import moment from "moment";
import { Topic } from "../naagostone/type/Topic.ts";
import { NaagostoneApiService } from "../naagostone/service/NaagostoneApiService.ts";
import { TopicsRepository } from "../database/repository/TopicsRepository.ts";
import * as log from "@std/log";
import { TopicData } from "../database/schema/lodestone-news.ts";
import { LodestoneServiceUnavailableError } from "../naagostone/error/LodestoneServiceUnavailableError.ts";
import { ComponentsV2Service } from "./ComponentsV2Service.ts";
import { NewsMessageUpdateService } from "./NewsMessageUpdateService.ts";

const saveLodestoneNews = Deno.env.get("SAVE_LODESTONE_NEWS") === "true";
const sendLodestoneNews = Deno.env.get("SEND_LODESTONE_NEWS") === "true";
const maxNewsSent = parseInt(Deno.env.get("MAX_NEWS_SENT")!, 10);

export class TopicSenderService {
  public static async checkForNew(): Promise<number> {
    let latestTopics: Topic[];
    try {
      latestTopics = await NaagostoneApiService.fetchLatest10Topics();
    } catch (error: unknown) {
      if (error instanceof LodestoneServiceUnavailableError) {
        log.error(`[TOPICS] Lodestone service is unavailable: ${error.message}`);
      } else if (error instanceof Error) {
        log.error(`[TOPICS] Fetching latest topics was NOT successful: ${error.message}`);
      }
      return 0;
    }

    latestTopics.reverse();

    let newCount = 0;
    const itemsWithExisting: Array<{ topic: Topic; existing: TopicData | null }> = [];

    for (const topic of latestTopics) {
      if (!topic) continue;

      const date = moment(topic.date).tz("Europe/London").toDate();
      const existingTopic = await TopicsRepository.find(topic.title, date);

      itemsWithExisting.push({ topic, existing: existingTopic });

      if (!existingTopic) {
        newCount++;
      }
    }

    const shouldSend = newCount <= maxNewsSent;

    for (const { topic, existing: existingTopic } of itemsWithExisting) {
      if (existingTopic) {
        await this.checkForUpdates(existingTopic, topic);
        continue;
      }

      const newsId = saveLodestoneNews ? await TopicsRepository.add(topic) : undefined;
      if (sendLodestoneNews && shouldSend) {
        await ComponentsV2Service.send("topics", {
          title: topic.title,
          link: topic.link,
          date: topic.date,
          banner: topic.banner,
          description: topic.description,
        }, newsId);
      }
    }

    return newCount;
  }

  private static async checkForUpdates(existing: TopicData, topic: Topic): Promise<void> {
    const { descriptionChanged: _descriptionChanged, descriptionV2Changed } = TopicsRepository.hasDescriptionChanged(
      existing,
      topic,
    );
    const eventChanged = TopicsRepository.hasEventChanged(existing, topic);

    if (!descriptionV2Changed && !eventChanged) return;

    if (saveLodestoneNews) {
      if (descriptionV2Changed) {
        await TopicsRepository.updateDescriptions(
          existing.id,
          topic.description.markdown,
          topic.description.discord_components_v2 ?? null,
        );
      }
      if (eventChanged) {
        const eventFromSQL = topic.event?.from ? new Date(topic.event.from) : null;
        const eventToSQL = topic.event?.to ? new Date(topic.event.to) : null;
        await TopicsRepository.updateEvent(
          existing.id,
          topic.event?.type ?? null,
          eventFromSQL,
          eventToSQL,
        );
      }
    }

    if (!sendLodestoneNews) return;

    const { updated, failed } = await NewsMessageUpdateService.updatePostedMessages(
      "topics",
      existing.id,
      {
        title: topic.title,
        link: topic.link,
        date: topic.date,
        banner: topic.banner,
        description: topic.description,
      },
    );

    if (updated > 0 || failed > 0) {
      log.info(`[TOPICS] Updated ${updated} messages, ${failed} failed for topic: ${topic.title}`);
    }
  }
}
