import moment from "moment";
import { TextChannel } from "discord.js";
import { StringManipulationService } from "./StringManipulationService.ts";
import { NoticesRepository } from "../database/repository/NoticesRepository.ts";
import { NaagostoneApiService } from "../naagostone/service/NaagostoneApiService.ts";
import { Notice } from "../naagostone/type/Notice.ts";
import { GlobalClient } from "../index.ts";
import { Setup } from "../database/schema/setups.ts";
import { SetupsRepository } from "../database/repository/SetupsRepository.ts";
import { DiscordEmbedService } from "./DiscordEmbedService.ts";
import * as log from "@std/log";

const saveLodestoneNews = Deno.env.get("SAVE_LODESTONE_NEWS") === "true";
const sendLodestoneNews = Deno.env.get("SEND_LODESTONE_NEWS") === "true";

export class NoticeSenderService {
  public static async checkForNew(): Promise<number> {
    let latestNotices: Notice[];
    try {
      latestNotices = await NaagostoneApiService.fetchLatest10Notices();
    } catch (error: unknown) {
      if (error instanceof Error) {
        log.error(`[NOTICES] Fetching latest notices was NOT successful: ${error.message}`);
      }
      return 0;
    }
    const newNotices: Notice[] = [];

    for (const notice of latestNotices) {
      if (!notice) continue;

      const date = moment(notice.date).tz("Europe/London").toDate();
      if (await NoticesRepository.find(notice.title, date)) continue;

      notice.tag = StringManipulationService.convertTag("notice", notice.tag);
      newNotices.push(notice);
    }

    for (const newNotice of newNotices.reverse()) {
      if (saveLodestoneNews) await NoticesRepository.add(newNotice);
      if (sendLodestoneNews) await this.send(newNotice);
    }

    return newNotices.length;
  }

  public static async send(notice: Notice): Promise<void> {
    const client = GlobalClient.client;
    if (!client) return;
    const setups: Setup[] = await SetupsRepository.getAllByType("notices");
    if (!setups || setups?.length < 1) return;

    for (const setup of setups) {
      try {
        const guild = await client.guilds.fetch(setup.guildId);
        if (!guild) continue;
        const channel = await guild.channels.fetch(setup.channelId);
        if (!channel) continue;

        const embed = DiscordEmbedService.getNoticesEmbed(notice);

        await (channel as TextChannel).send({ embeds: [embed] });
      } catch (error: unknown) {
        if (error instanceof Error) {
          log.error(`[NOTICES] Sending notice to ${setup.guildId} was NOT successful: ${error.message}`);
        }
        continue;
      }
    }
  }
}
