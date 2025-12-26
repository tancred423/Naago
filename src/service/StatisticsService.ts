import { createHash } from "node:crypto";
import * as log from "@std/log";
import { StatsActiveUsersDailyRepository } from "../database/repository/StatsActiveUsersDailyRepository.ts";
import { StatsCommandUsageRepository } from "../database/repository/StatsCommandUsageRepository.ts";
import { StatsDailyStatisticsRepository } from "../database/repository/StatsDailyStatisticsRepository.ts";
import { StatsLodestoneNewsSetupsRepository } from "../database/repository/StatsLodestoneNewsSetupsRepository.ts";
import { StatsProfileButtonUsageRepository } from "../database/repository/StatsProfileButtonUsageRepository.ts";
import { StatsServerCountsRepository } from "../database/repository/StatsServerCountsRepository.ts";
import { SetupsRepository } from "../database/repository/SetupsRepository.ts";
import { StatsVerifiedCharactersRepository } from "../database/repository/StatsVerifiedCharactersRepository.ts";
import { VerificationsRepository } from "../database/repository/VerificationsRepository.ts";
import { StatsThemeUsageRepository } from "../database/repository/StatsThemeUsageRepository.ts";
import { GlobalClient } from "../GlobalClient.ts";

export class StatisticsService {
  private static readonly SALT = Deno.env.get("STATISTICS_SALT") || "naago-statistics-salt-2024";

  private static hashUserId(userId: string): string {
    return createHash("sha256")
      .update(userId + StatisticsService.SALT)
      .digest("hex");
  }

  private static getTodayDate(): Date {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    return today;
  }

  public static async trackActiveUser(userId: string): Promise<void> {
    try {
      const hashedUserId = StatisticsService.hashUserId(userId);
      const today = StatisticsService.getTodayDate();
      await StatsActiveUsersDailyRepository.add(hashedUserId, today);
    } catch (error) {
      log.error(`Failed to track active user: ${error instanceof Error ? error.stack : String(error)}`);
    }
  }

  public static async trackCommand(commandName: string): Promise<void> {
    try {
      const today = StatisticsService.getTodayDate();
      await StatsCommandUsageRepository.increment(today, commandName);
    } catch (error) {
      log.error(`Failed to track command usage: ${error instanceof Error ? error.stack : String(error)}`);
    }
  }

  public static async trackProfileButton(buttonName: string): Promise<void> {
    try {
      const today = StatisticsService.getTodayDate();
      await StatsProfileButtonUsageRepository.increment(today, buttonName);
    } catch (error) {
      log.error(`Failed to track profile button usage: ${error instanceof Error ? error.stack : String(error)}`);
    }
  }

  /**
   * Track theme usage
   */
  public static async trackTheme(themeName: string): Promise<void> {
    try {
      const today = StatisticsService.getTodayDate();
      await StatsThemeUsageRepository.increment(today, themeName);
    } catch (error) {
      log.error(`Failed to track theme usage: ${error instanceof Error ? error.stack : String(error)}`);
    }
  }

  public static async aggregateDailyStatistics(): Promise<void> {
    try {
      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      yesterday.setUTCHours(0, 0, 0, 0);

      const activeUserCount = await StatsActiveUsersDailyRepository.countUniqueUsersForDate(yesterday);

      await StatsDailyStatisticsRepository.addOrUpdate(yesterday, activeUserCount);

      log.info(`Aggregated daily statistics for ${yesterday.toISOString()}: ${activeUserCount} active users`);
    } catch (error) {
      log.error(`Failed to aggregate daily statistics: ${error instanceof Error ? error.stack : String(error)}`);
      throw error;
    }
  }

  public static async recordServerCount(): Promise<void> {
    try {
      const today = StatisticsService.getTodayDate();
      const client = GlobalClient.client;

      if (!client) {
        log.warn("Cannot record server count: client not available");
        return;
      }

      const serverCount = client.guilds.cache.size;
      await StatsServerCountsRepository.addOrUpdate(today, serverCount);

      log.info(`Recorded server count: ${serverCount} servers`);
    } catch (error) {
      log.error(`Failed to record server count: ${error instanceof Error ? error.stack : String(error)}`);
    }
  }

  public static async recordLodestoneNewsSetups(): Promise<void> {
    try {
      const today = StatisticsService.getTodayDate();

      const allSetups = await SetupsRepository.getAllByType("topics");
      const uniqueGuildIds = new Set(allSetups.map((setup) => setup.guildId));

      const notices = await SetupsRepository.getAllByType("notices");
      notices.forEach((setup) => uniqueGuildIds.add(setup.guildId));

      const maintenances = await SetupsRepository.getAllByType("maintenances");
      maintenances.forEach((setup) => uniqueGuildIds.add(setup.guildId));

      const updates = await SetupsRepository.getAllByType("updates");
      updates.forEach((setup) => uniqueGuildIds.add(setup.guildId));

      const statuses = await SetupsRepository.getAllByType("statuses");
      statuses.forEach((setup) => uniqueGuildIds.add(setup.guildId));

      const serverCount = uniqueGuildIds.size;
      await StatsLodestoneNewsSetupsRepository.addOrUpdate(today, serverCount);

      log.info(`Recorded lodestone news setups: ${serverCount} servers`);
    } catch (error) {
      log.error(`Failed to record lodestone news setups: ${error instanceof Error ? error.stack : String(error)}`);
    }
  }

  public static async cleanupOldActiveUserData(): Promise<void> {
    try {
      const daysToKeep = 7;
      await StatsActiveUsersDailyRepository.deleteOldData(daysToKeep);
      log.info(`Cleaned up active user tracking data older than ${daysToKeep} days`);
    } catch (error) {
      log.error(`Failed to cleanup old active user data: ${error instanceof Error ? error.stack : String(error)}`);
    }
  }

  /**
   * Record verified characters count
   */
  public static async recordVerifiedCharacters(): Promise<void> {
    try {
      const today = StatisticsService.getTodayDate();
      const verifiedCount = await VerificationsRepository.countVerifiedCharacters();
      await StatsVerifiedCharactersRepository.addOrUpdate(today, verifiedCount);

      log.info(`Recorded verified characters count: ${verifiedCount} characters`);
    } catch (error) {
      log.error(`Failed to record verified characters: ${error instanceof Error ? error.stack : String(error)}`);
    }
  }
}
