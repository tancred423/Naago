import { assertEquals } from "@std/assert";
import { assertSpyCalls, stub } from "@std/testing/mock";
import { StatisticsService } from "../../src/service/StatisticsService.ts";
import { StatsActiveUsersDailyRepository } from "../../src/database/repository/StatsActiveUsersDailyRepository.ts";
import { StatsCommandUsageRepository } from "../../src/database/repository/StatsCommandUsageRepository.ts";
import { StatsProfileButtonUsageRepository } from "../../src/database/repository/StatsProfileButtonUsageRepository.ts";
import { StatsThemeUsageRepository } from "../../src/database/repository/StatsThemeUsageRepository.ts";
import { StatsDailyStatisticsRepository } from "../../src/database/repository/StatsDailyStatisticsRepository.ts";
import { StatsServerCountsRepository } from "../../src/database/repository/StatsServerCountsRepository.ts";
import { StatsLodestoneNewsSetupsRepository } from "../../src/database/repository/StatsLodestoneNewsSetupsRepository.ts";
import { StatsVerifiedCharactersRepository } from "../../src/database/repository/StatsVerifiedCharactersRepository.ts";
import { SetupsRepository } from "../../src/database/repository/SetupsRepository.ts";
import { VerificationsRepository } from "../../src/database/repository/VerificationsRepository.ts";
import { GlobalClient } from "../../src/GlobalClient.ts";

Deno.test("trackActiveUser - calls repository add", async () => {
  const addStub = stub(StatsActiveUsersDailyRepository, "add", () => Promise.resolve());
  try {
    await StatisticsService.trackActiveUser("user123");
    assertSpyCalls(addStub, 1);
  } finally {
    addStub.restore();
  }
});

Deno.test("trackActiveUser - does not throw on repository error", async () => {
  const addStub = stub(StatsActiveUsersDailyRepository, "add", () => Promise.reject(new Error("db error")));
  try {
    await StatisticsService.trackActiveUser("user123");
  } finally {
    addStub.restore();
  }
});

Deno.test("trackCommand - calls repository increment", async () => {
  const incStub = stub(StatsCommandUsageRepository, "increment", () => Promise.resolve());
  try {
    await StatisticsService.trackCommand("profile");
    assertSpyCalls(incStub, 1);
    assertEquals(incStub.calls[0].args[1], "profile");
  } finally {
    incStub.restore();
  }
});

Deno.test("trackProfileButton - calls repository increment", async () => {
  const incStub = stub(StatsProfileButtonUsageRepository, "increment", () => Promise.resolve());
  try {
    await StatisticsService.trackProfileButton("overview");
    assertSpyCalls(incStub, 1);
    assertEquals(incStub.calls[0].args[1], "overview");
  } finally {
    incStub.restore();
  }
});

Deno.test("trackTheme - calls repository increment", async () => {
  const incStub = stub(StatsThemeUsageRepository, "increment", () => Promise.resolve());
  try {
    await StatisticsService.trackTheme("dark");
    assertSpyCalls(incStub, 1);
    assertEquals(incStub.calls[0].args[1], "dark");
  } finally {
    incStub.restore();
  }
});

Deno.test("aggregateDailyStatistics - aggregates and stores", async () => {
  const countStub = stub(StatsActiveUsersDailyRepository, "countUniqueUsersForDate", () => Promise.resolve(42));
  const addOrUpdateStub = stub(StatsDailyStatisticsRepository, "addOrUpdate", () => Promise.resolve());

  try {
    await StatisticsService.aggregateDailyStatistics();
    assertSpyCalls(countStub, 1);
    assertSpyCalls(addOrUpdateStub, 1);
    assertEquals(addOrUpdateStub.calls[0].args[1], 42);
  } finally {
    countStub.restore();
    addOrUpdateStub.restore();
  }
});

Deno.test("recordServerCount - records server count from client", async () => {
  const originalClient = GlobalClient.client;
  GlobalClient.client = {
    guilds: { cache: { size: 100 } },
  } as unknown as typeof GlobalClient.client;

  const addOrUpdateStub = stub(StatsServerCountsRepository, "addOrUpdate", () => Promise.resolve());

  try {
    await StatisticsService.recordServerCount();
    assertSpyCalls(addOrUpdateStub, 1);
    assertEquals(addOrUpdateStub.calls[0].args[1], 100);
  } finally {
    addOrUpdateStub.restore();
    GlobalClient.client = originalClient;
  }
});

Deno.test("recordServerCount - handles null client gracefully", async () => {
  const originalClient = GlobalClient.client;
  GlobalClient.client = null as unknown as typeof GlobalClient.client;

  try {
    await StatisticsService.recordServerCount();
  } finally {
    GlobalClient.client = originalClient;
  }
});

Deno.test("recordLodestoneNewsSetups - counts unique guilds across types", async () => {
  const makeSetup = (guildId: string, type: string) => ({
    type,
    guildId,
    channelId: "ch1",
    blacklistKeywords: null,
    createdAt: null,
    updatedAt: null,
  });
  const setupsStub = stub(SetupsRepository, "getAllByType", (type: string) => {
    const data: Record<string, ReturnType<typeof makeSetup>[]> = {
      topics: [makeSetup("g1", type), makeSetup("g2", type)],
      notices: [makeSetup("g2", type), makeSetup("g3", type)],
      maintenances: [makeSetup("g1", type)],
      updates: [],
      statuses: [makeSetup("g4", type)],
    };
    return Promise.resolve(data[type] ?? []);
  });

  const addOrUpdateStub = stub(StatsLodestoneNewsSetupsRepository, "addOrUpdate", () => Promise.resolve());

  try {
    await StatisticsService.recordLodestoneNewsSetups();
    assertSpyCalls(addOrUpdateStub, 1);
    assertEquals(addOrUpdateStub.calls[0].args[1], 4);
  } finally {
    setupsStub.restore();
    addOrUpdateStub.restore();
  }
});

Deno.test("cleanupOldActiveUserData - calls deleteOldData", async () => {
  const deleteStub = stub(StatsActiveUsersDailyRepository, "deleteOldData", () => Promise.resolve());

  try {
    await StatisticsService.cleanupOldActiveUserData();
    assertSpyCalls(deleteStub, 1);
    assertEquals(deleteStub.calls[0].args[0], 7);
  } finally {
    deleteStub.restore();
  }
});

Deno.test("recordVerifiedCharacters - records count", async () => {
  const countStub = stub(VerificationsRepository, "countVerifiedCharacters", () => Promise.resolve(250));
  const addOrUpdateStub = stub(StatsVerifiedCharactersRepository, "addOrUpdate", () => Promise.resolve());

  try {
    await StatisticsService.recordVerifiedCharacters();
    assertSpyCalls(addOrUpdateStub, 1);
    assertEquals(addOrUpdateStub.calls[0].args[1], 250);
  } finally {
    countStub.restore();
    addOrUpdateStub.restore();
  }
});
