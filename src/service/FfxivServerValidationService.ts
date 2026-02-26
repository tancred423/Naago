import { NaagostoneApiService } from "../naagostone/service/NaagostoneApiService.ts";
import * as log from "@std/log";

export class FfxivServerValidationService {
  private static cachedWorlds: string[] | null = null;
  private static cacheTimestamp: number = 0;
  private static readonly CACHE_DURATION_MS = 60 * 60 * 1000;

  public static async isValidServer(server: string): Promise<boolean> {
    const worlds = await this.getWorlds();
    return worlds.includes(server.toLowerCase());
  }

  private static async getWorlds(): Promise<string[]> {
    const now = Date.now();
    if (this.cachedWorlds && this.cachedWorlds.length > 0 && now - this.cacheTimestamp < this.CACHE_DURATION_MS) {
      return this.cachedWorlds;
    }

    try {
      const apiWorlds = await NaagostoneApiService.fetchAllWorlds();
      if (apiWorlds.length > 0) {
        this.cachedWorlds = apiWorlds.map((w) => w.toLowerCase());
        this.cacheTimestamp = now;
        return this.cachedWorlds;
      }
    } catch (error: unknown) {
      log.warn(
        `Failed to fetch worlds from API, using hardcoded fallback: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    return this.getHardcodedWorlds();
  }

  private static getHardcodedWorlds(): string[] {
    const data = Deno.env.get("GAME_WORLDS");
    if (!data) {
      log.error("GAME_WORLDS env var is not set and API fallback failed");
      return [];
    }
    return data.split(",").map((w) => w.trim().toLowerCase());
  }
}
