import { assertEquals, assertRejects } from "@std/assert";
import { ApiRequestFailedError } from "../../../src/naagostone/error/ApiRequestFailedError.ts";
import { LodestoneServiceUnavailableError } from "../../../src/naagostone/error/LodestoneServiceUnavailableError.ts";
import { WorldStatusUnavailableError } from "../../../src/naagostone/error/WorldStatusUnavailableError.ts";

Deno.env.set("NAAGOSTONE_HOST", "localhost");
Deno.env.set("NAAGOSTONE_PORT", "3000");

const { NaagostoneApiService } = await import("../../../src/naagostone/service/NaagostoneApiService.ts");

function mockFetch(status: number, body: unknown, statusText = "Error"): () => void {
  const original = globalThis.fetch;
  globalThis.fetch = () => Promise.resolve(new Response(JSON.stringify(body), { status, statusText }));
  return () => {
    globalThis.fetch = original;
  };
}

Deno.test("fetchCharacterIdsByName - returns ids on success", async () => {
  const restore = mockFetch(200, { list: [{ id: 1 }, { id: 2 }] });
  try {
    const ids = await NaagostoneApiService.fetchCharacterIdsByName("John", "Doe", "Cerberus");
    assertEquals(ids, [1, 2]);
  } finally {
    restore();
  }
});

Deno.test("fetchCharacterIdsByName - throws LodestoneServiceUnavailableError on 503", async () => {
  const restore = mockFetch(503, {});
  try {
    await assertRejects(
      () => NaagostoneApiService.fetchCharacterIdsByName("John", "Doe", "Cerberus"),
      LodestoneServiceUnavailableError,
    );
  } finally {
    restore();
  }
});

Deno.test("fetchCharacterIdsByName - throws ApiRequestFailedError on non-ok", async () => {
  const restore = mockFetch(500, {}, "Internal Server Error");
  try {
    await assertRejects(
      () => NaagostoneApiService.fetchCharacterIdsByName("John", "Doe", "Cerberus"),
      ApiRequestFailedError,
    );
  } finally {
    restore();
  }
});

Deno.test("fetchCharacterById - returns character on success", async () => {
  const character = { name: "John Doe", world: "Cerberus" };
  const restore = mockFetch(200, { character });
  try {
    const result = await NaagostoneApiService.fetchCharacterById(12345);
    assertEquals(result?.name, "John Doe");
  } finally {
    restore();
  }
});

Deno.test("fetchCharacterById - returns null when character is missing", async () => {
  const restore = mockFetch(200, {});
  try {
    const result = await NaagostoneApiService.fetchCharacterById(99999);
    assertEquals(result, null);
  } finally {
    restore();
  }
});

Deno.test("fetchCharacterById - throws LodestoneServiceUnavailableError on 503", async () => {
  const restore = mockFetch(503, {});
  try {
    await assertRejects(
      () => NaagostoneApiService.fetchCharacterById(12345),
      LodestoneServiceUnavailableError,
    );
  } finally {
    restore();
  }
});

Deno.test("fetchLatest10Topics - returns topics on success", async () => {
  const topics = [{ title: "Topic 1" }, { title: "Topic 2" }];
  const restore = mockFetch(200, { topics });
  try {
    const result = await NaagostoneApiService.fetchLatest10Topics();
    assertEquals(result, topics);
  } finally {
    restore();
  }
});

Deno.test("fetchLatest10Topics - returns empty array when no topics", async () => {
  const restore = mockFetch(200, {});
  try {
    const result = await NaagostoneApiService.fetchLatest10Topics();
    assertEquals(result, []);
  } finally {
    restore();
  }
});

Deno.test("fetchLatest10Notices - returns notices on success", async () => {
  const notices = [{ title: "Notice 1" }];
  const restore = mockFetch(200, { notices });
  try {
    const result = await NaagostoneApiService.fetchLatest10Notices();
    assertEquals(result, notices);
  } finally {
    restore();
  }
});

Deno.test("fetchLatest10Maintenances - returns maintenances on success", async () => {
  const maintenances = [{ title: "Maint 1" }];
  const restore = mockFetch(200, { maintenances });
  try {
    const result = await NaagostoneApiService.fetchLatest10Maintenances();
    assertEquals(result, maintenances);
  } finally {
    restore();
  }
});

Deno.test("fetchLatest10Updates - returns updates on success", async () => {
  const updates = [{ title: "Update 1" }];
  const restore = mockFetch(200, { updates });
  try {
    const result = await NaagostoneApiService.fetchLatest10Updates();
    assertEquals(result, updates);
  } finally {
    restore();
  }
});

Deno.test("fetchLatest10Statuses - returns statuses on success", async () => {
  const statuses = [{ title: "Status 1" }];
  const restore = mockFetch(200, { statuses });
  try {
    const result = await NaagostoneApiService.fetchLatest10Statuses();
    assertEquals(result, statuses);
  } finally {
    restore();
  }
});

Deno.test("fetchWorldStatus - returns world status on success", async () => {
  const worldStatus = [{ physicalDataCenter: "Chaos", logicalDataCenters: [] }];
  const restore = mockFetch(200, { worldStatus });
  try {
    const result = await NaagostoneApiService.fetchWorldStatus();
    assertEquals(result.length, 1);
    assertEquals(result[0].physicalDataCenter, "Chaos");
  } finally {
    restore();
  }
});

Deno.test("fetchWorldStatus - throws WorldStatusUnavailableError on 503", async () => {
  const restore = mockFetch(503, {});
  try {
    await assertRejects(
      () => NaagostoneApiService.fetchWorldStatus(),
      WorldStatusUnavailableError,
    );
  } finally {
    restore();
  }
});

Deno.test("fetchAllWorlds - returns worlds on success", async () => {
  const restore = mockFetch(200, { allWorlds: ["Cerberus", "Moogle"] });
  try {
    const result = await NaagostoneApiService.fetchAllWorlds();
    assertEquals(result, ["Cerberus", "Moogle"]);
  } finally {
    restore();
  }
});

Deno.test("fetchAllWorlds - throws ApiRequestFailedError on failure", async () => {
  const restore = mockFetch(500, {}, "Internal Server Error");
  try {
    await assertRejects(
      () => NaagostoneApiService.fetchAllWorlds(),
      ApiRequestFailedError,
    );
  } finally {
    restore();
  }
});
