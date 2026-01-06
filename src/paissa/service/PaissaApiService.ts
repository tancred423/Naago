import * as log from "@std/log";
import { LotteryPhaseInfo, LottoPhase, OpenPlotDetail, WorldDetail } from "../type/PaissaApiTypes.ts";

const API_BASE_URL = "https://paissadb.zhu.codes";
const CACHE_TTL_MS = 15 * 60 * 1000;
const DEFAULT_WORLD_ID = 56;

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): { hit: true; data: T } | { hit: false } {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return { hit: false };

  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return { hit: false };
  }

  return { hit: true, data: entry.data };
}

function setCache<T>(key: string, data: T, ttlMs: number = CACHE_TTL_MS): void {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

export class PaissaApiService {
  static async fetchWorldDetail(worldId: number = DEFAULT_WORLD_ID): Promise<WorldDetail | null> {
    const cacheKey = `world_${worldId}`;

    const cached = getCached<WorldDetail>(cacheKey);
    if (cached.hit) {
      return cached.data;
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
    const cacheKey = "lottery_phase";
    const cached = getCached<LotteryPhaseInfo | null>(cacheKey);
    if (cached.hit) {
      return cached.data;
    }

    const worldDetail = await this.fetchWorldDetail();
    if (!worldDetail) {
      setCache(cacheKey, null);
      return null;
    }

    const plotWithNextOrLatestPhaseChange = this.getPlotWithNextOrLatestPhaseChange(worldDetail);
    if (!plotWithNextOrLatestPhaseChange) {
      setCache(cacheKey, null);
      return null;
    }

    const phase = plotWithNextOrLatestPhaseChange.lotto_phase ?? null;
    const phaseName = phase ? this.getPhaseName(phase) : null;
    const until = plotWithNextOrLatestPhaseChange.lotto_phase_until ?? null;
    const isCurrent = until ? (until > (Date.now() / 1000)) : false;

    if (!phase || !phaseName || !until) {
      setCache(cacheKey, null);
      return null;
    }

    const result: LotteryPhaseInfo = {
      phase,
      phaseName,
      until,
      isCurrent,
    };

    const ttlMs = isCurrent ? Math.max((until * 1000) - Date.now(), CACHE_TTL_MS) : CACHE_TTL_MS;
    setCache(cacheKey, result, ttlMs);

    return result;
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
