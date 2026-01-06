import * as log from "@std/log";
import { LotteryPhaseInfo, LottoPhase, OpenPlotDetail, WorldDetail } from "../type/PaissaApiTypes.ts";

const API_BASE_URL = "https://paissadb.zhu.codes";
const CACHE_TTL_MS = 15 * 60 * 1000;
const DEFAULT_WORLD_ID = 56;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;

  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export class PaissaApiService {
  static async fetchWorldDetail(worldId: number = DEFAULT_WORLD_ID): Promise<WorldDetail | null> {
    const cacheKey = `world_${worldId}`;

    const cachedData = getCached<WorldDetail>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/worlds/${worldId}`, {
        headers: {
          "User-Agent": "Naago-Discord-Bot/1.0 (https://github.com/Tancred423/Naago)",
          "Accept": "application/json",
          "Referer": "https://github.com/Tancred423/Naago",
        },
      });

      if (!response.ok) {
        log.error(`Failed to fetch world ${worldId}: ${response.status} - ${response.statusText}`);
        return null;
      }

      const data = await response.json() as WorldDetail;
      setCache(cacheKey, data);
      return data;
    } catch (error) {
      log.error(`Failed to fetch world detail: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  static async getCurrentLotteryPhase(): Promise<LotteryPhaseInfo | null> {
    const worldDetail = await this.fetchWorldDetail();
    if (!worldDetail) return null;

    const plotWithNextOrLatestPhaseChange = this.getPlotWithNextOrLatestPhaseChange(worldDetail);
    if (!plotWithNextOrLatestPhaseChange) return null;

    const phase = plotWithNextOrLatestPhaseChange.lotto_phase ?? null;
    const phaseName = phase ? this.getPhaseName(phase) : null;
    const until = plotWithNextOrLatestPhaseChange.lotto_phase_until ?? null;
    const isCurrent = until ? (until > (Date.now() / 1000)) : false;

    if (!phase || !phaseName || !until) {
      return null;
    }

    return {
      phase,
      phaseName,
      until,
      isCurrent,
    };
  }

  private static getPlotWithNextOrLatestPhaseChange(worldDetail: WorldDetail): OpenPlotDetail | null {
    const now = Date.now() / 1000;
    const allPlots = worldDetail.districts.flatMap((district) => district.open_plots);
    const plotsSortedByPhaseChangeTimes = allPlots
      .filter((plot) => (plot.lotto_phase_until ?? 0) > 0)
      .filter((plot) => [LottoPhase.ENTRY, LottoPhase.RESULTS].includes(plot.lotto_phase ?? 0))
      .sort((a, b) => (a.lotto_phase_until ?? 0) - (b.lotto_phase_until ?? 0));

    const plotWithNextPhaseChange = plotsSortedByPhaseChangeTimes.find((plot) => (plot.lotto_phase_until ?? 0) > now);
    if (plotWithNextPhaseChange) {
      return plotWithNextPhaseChange;
    }

    return plotsSortedByPhaseChangeTimes[plotsSortedByPhaseChangeTimes.length - 1] ?? null;
  }

  private static getPhaseName(phase: number): string {
    switch (phase) {
      case LottoPhase.ENTRY:
        return "Entry";
      case LottoPhase.RESULTS:
        return "Results";
      default:
        return "Unknown";
    }
  }
}
