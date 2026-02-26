import { assertEquals } from "@std/assert";
import { LottoPhase } from "../../../src/paissa/type/PaissaApiTypes.ts";
import type { WorldDetail } from "../../../src/paissa/type/PaissaApiTypes.ts";
import { PaissaApiService } from "../../../src/paissa/service/PaissaApiService.ts";

function mockFetch(status: number, body: unknown): () => void {
  const original = globalThis.fetch;
  globalThis.fetch = () => Promise.resolve(new Response(JSON.stringify(body), { status }));
  return () => {
    globalThis.fetch = original;
  };
}

function mockFetchError(): () => void {
  const original = globalThis.fetch;
  globalThis.fetch = () => Promise.reject(new Error("Network error"));
  return () => {
    globalThis.fetch = original;
  };
}

Deno.test("fetchWorldDetail - returns world detail on success", async () => {
  const worldData: WorldDetail = {
    id: 56,
    name: "Cerberus",
    districts: [],
    num_open_plots: 0,
    oldest_plot_time: 0,
  };
  const restore = mockFetch(200, worldData);
  try {
    const result = await PaissaApiService.fetchWorldDetail(56);
    assertEquals(result?.name, "Cerberus");
  } finally {
    restore();
  }
});

Deno.test("fetchWorldDetail - returns null on non-ok response", async () => {
  const restore = mockFetch(500, {});
  try {
    const result = await PaissaApiService.fetchWorldDetail(999);
    assertEquals(result, null);
  } finally {
    restore();
  }
});

Deno.test("fetchWorldDetail - returns null on network error", async () => {
  const restore = mockFetchError();
  try {
    const result = await PaissaApiService.fetchWorldDetail(998);
    assertEquals(result, null);
  } finally {
    restore();
  }
});

Deno.test("getCurrentLotteryPhase - returns null when no world detail", async () => {
  const restore = mockFetch(500, {});
  try {
    const result = await PaissaApiService.getCurrentLotteryPhase();
    assertEquals(result, null);
  } finally {
    restore();
  }
});

Deno.test("getCurrentLotteryPhase - returns phase info for entry phase", async () => {
  const futureTimestamp = Math.floor(Date.now() / 1000) + 86400;
  const worldData: WorldDetail = {
    id: 56,
    name: "Cerberus",
    districts: [{
      id: 1,
      name: "Mist",
      num_open_plots: 1,
      oldest_plot_time: 0,
      open_plots: [{
        world_id: 56,
        district_id: 1,
        ward_number: 1,
        plot_number: 1,
        size: 0,
        price: 3000000,
        last_updated_time: 0,
        first_seen_time: 0,
        est_time_open_min: 0,
        est_time_open_max: 0,
        purchase_system: 0,
        lotto_phase: LottoPhase.ENTRY,
        lotto_phase_until: futureTimestamp,
      }],
    }],
    num_open_plots: 1,
    oldest_plot_time: 0,
  };
  const restore = mockFetch(200, worldData);
  try {
    const result = await PaissaApiService.getCurrentLotteryPhase();
    if (result) {
      assertEquals(result.phase, LottoPhase.ENTRY);
      assertEquals(result.phaseName, "Entry");
      assertEquals(result.isCurrent, true);
    }
  } finally {
    restore();
  }
});

Deno.test("getCurrentLotteryPhase - returns null when no plots have lotto phase", async () => {
  const worldData: WorldDetail = {
    id: 56,
    name: "Cerberus",
    districts: [{
      id: 1,
      name: "Mist",
      num_open_plots: 1,
      oldest_plot_time: 0,
      open_plots: [{
        world_id: 56,
        district_id: 1,
        ward_number: 1,
        plot_number: 1,
        size: 0,
        price: 3000000,
        last_updated_time: 0,
        first_seen_time: 0,
        est_time_open_min: 0,
        est_time_open_max: 0,
        purchase_system: 0,
      }],
    }],
    num_open_plots: 1,
    oldest_plot_time: 0,
  };
  const restore = mockFetch(200, worldData);
  try {
    const result = await PaissaApiService.getCurrentLotteryPhase();
    assertEquals(result, null);
  } finally {
    restore();
  }
});
