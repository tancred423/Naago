import { assertEquals } from "@std/assert";
import { stub } from "@std/testing/mock";
import { NaagostoneApiService } from "../../src/naagostone/service/NaagostoneApiService.ts";
import { FfxivServerValidationService } from "../../src/service/FfxivServerValidationService.ts";

function resetCache() {
  (FfxivServerValidationService as unknown as Record<string, unknown>)["cachedWorlds"] = null;
  (FfxivServerValidationService as unknown as Record<string, unknown>)["cacheTimestamp"] = 0;
}

Deno.test("isValidServer - returns true for a valid server from API", async () => {
  resetCache();
  const fetchStub = stub(
    NaagostoneApiService,
    "fetchAllWorlds",
    () => Promise.resolve(["Cerberus", "Moogle", "Omega"]),
  );
  try {
    const result = await FfxivServerValidationService.isValidServer("Cerberus");
    assertEquals(result, true);
  } finally {
    fetchStub.restore();
  }
});

Deno.test("isValidServer - returns false for an invalid server", async () => {
  resetCache();
  const fetchStub = stub(NaagostoneApiService, "fetchAllWorlds", () => Promise.resolve(["Cerberus", "Moogle"]));
  try {
    const result = await FfxivServerValidationService.isValidServer("FakeWorld");
    assertEquals(result, false);
  } finally {
    fetchStub.restore();
  }
});

Deno.test("isValidServer - is case-insensitive", async () => {
  resetCache();
  const fetchStub = stub(NaagostoneApiService, "fetchAllWorlds", () => Promise.resolve(["Cerberus"]));
  try {
    const result = await FfxivServerValidationService.isValidServer("CERBERUS");
    assertEquals(result, true);
  } finally {
    fetchStub.restore();
  }
});

Deno.test("isValidServer - uses cache on subsequent calls", async () => {
  resetCache();
  let callCount = 0;
  const fetchStub = stub(NaagostoneApiService, "fetchAllWorlds", () => {
    callCount++;
    return Promise.resolve(["Cerberus", "Moogle"]);
  });
  try {
    await FfxivServerValidationService.isValidServer("Cerberus");
    await FfxivServerValidationService.isValidServer("Moogle");
    assertEquals(callCount, 1);
  } finally {
    fetchStub.restore();
  }
});

Deno.test("isValidServer - falls back to GAME_WORLDS env when API fails", async () => {
  resetCache();
  const originalGameWorlds = Deno.env.get("GAME_WORLDS");
  Deno.env.set("GAME_WORLDS", "Cerberus,Moogle,Phoenix");
  const fetchStub = stub(NaagostoneApiService, "fetchAllWorlds", () => Promise.reject(new Error("API down")));
  try {
    const result = await FfxivServerValidationService.isValidServer("Phoenix");
    assertEquals(result, true);
  } finally {
    fetchStub.restore();
    if (originalGameWorlds) Deno.env.set("GAME_WORLDS", originalGameWorlds);
    else Deno.env.delete("GAME_WORLDS");
  }
});

Deno.test("isValidServer - falls back to GAME_WORLDS when API returns empty array", async () => {
  resetCache();
  const originalGameWorlds = Deno.env.get("GAME_WORLDS");
  Deno.env.set("GAME_WORLDS", "Cerberus,Omega");
  const fetchStub = stub(NaagostoneApiService, "fetchAllWorlds", () => Promise.resolve([]));
  try {
    const result = await FfxivServerValidationService.isValidServer("Omega");
    assertEquals(result, true);
  } finally {
    fetchStub.restore();
    if (originalGameWorlds) Deno.env.set("GAME_WORLDS", originalGameWorlds);
    else Deno.env.delete("GAME_WORLDS");
  }
});

Deno.test("isValidServer - returns false when API fails and GAME_WORLDS not set", async () => {
  resetCache();
  const originalGameWorlds = Deno.env.get("GAME_WORLDS");
  Deno.env.delete("GAME_WORLDS");
  const fetchStub = stub(NaagostoneApiService, "fetchAllWorlds", () => Promise.reject(new Error("API down")));
  try {
    const result = await FfxivServerValidationService.isValidServer("Cerberus");
    assertEquals(result, false);
  } finally {
    fetchStub.restore();
    if (originalGameWorlds) Deno.env.set("GAME_WORLDS", originalGameWorlds);
  }
});
