import { assertEquals } from "@std/assert";
import { assertSpyCalls, stub } from "@std/testing/mock";
import { NewsQueueService } from "../../src/service/NewsQueueService.ts";
import { SetupsRepository } from "../../src/database/repository/SetupsRepository.ts";
import { PostedNewsMessagesRepository } from "../../src/database/repository/PostedNewsMessagesRepository.ts";
import { NewsQueueRepository } from "../../src/database/repository/NewsQueueRepository.ts";
import { FilterExpressionService } from "../../src/service/FilterExpressionService.ts";

Deno.test("enqueueSendJobs - returns 0 when no setups exist", async () => {
  const setupsStub = stub(SetupsRepository, "getAllByType", () => Promise.resolve([]));

  try {
    const result = await NewsQueueService.enqueueSendJobs("topics", 1, {
      title: "Test",
      link: "https://example.com",
      date: Date.now(),
      description: { html: "<p>test</p>", markdown: "test" },
    });
    assertEquals(result, 0);
  } finally {
    setupsStub.restore();
  }
});

Deno.test("enqueueSendJobs - enqueues jobs for matching setups", async () => {
  const setups = [
    { type: "topics", guildId: "g1", channelId: "c1", blacklistKeywords: null, createdAt: null, updatedAt: null },
    { type: "topics", guildId: "g2", channelId: "c2", blacklistKeywords: null, createdAt: null, updatedAt: null },
  ];
  const setupsStub = stub(SetupsRepository, "getAllByType", () => Promise.resolve(setups));
  const parseStub = stub(FilterExpressionService, "parseFilterString", () => ({ patterns: [], warnings: [] }));
  const blacklistStub = stub(FilterExpressionService, "isBlacklisted", () => false);
  const addManyStub = stub(NewsQueueRepository, "addMany", () => Promise.resolve());

  try {
    const result = await NewsQueueService.enqueueSendJobs("topics", 42, {
      title: "News Title",
      link: "https://example.com",
      date: Date.now(),
      description: { html: "<p>desc</p>", markdown: "desc" },
    });
    assertEquals(result, 2);
    assertSpyCalls(addManyStub, 1);
  } finally {
    setupsStub.restore();
    parseStub.restore();
    blacklistStub.restore();
    addManyStub.restore();
  }
});

Deno.test("enqueueSendJobs - skips blacklisted setups", async () => {
  const setups = [
    {
      type: "maintenances",
      guildId: "g1",
      channelId: "c1",
      blacklistKeywords: "maintenance",
      createdAt: null,
      updatedAt: null,
    },
    { type: "maintenances", guildId: "g2", channelId: "c2", blacklistKeywords: null, createdAt: null, updatedAt: null },
  ];
  const setupsStub = stub(SetupsRepository, "getAllByType", () => Promise.resolve(setups));
  const parseStub = stub(FilterExpressionService, "parseFilterString", () => ({
    patterns: [{ type: "keyword" as const, value: "maintenance", isValid: true }],
    warnings: [],
  }));

  let blacklistCallCount = 0;
  const blacklistStub = stub(FilterExpressionService, "isBlacklisted", () => {
    blacklistCallCount++;
    return blacklistCallCount === 1;
  });
  const addManyStub = stub(NewsQueueRepository, "addMany", () => Promise.resolve());

  try {
    const result = await NewsQueueService.enqueueSendJobs("maintenances", 1, {
      title: "Server Maintenance",
      link: "https://example.com",
      date: Date.now(),
      description: { html: "<p>maintenance desc</p>", markdown: "maintenance desc" },
    });
    assertEquals(result, 1);
  } finally {
    setupsStub.restore();
    parseStub.restore();
    blacklistStub.restore();
    addManyStub.restore();
  }
});

Deno.test("enqueueSendJobs - returns 0 when all setups are blacklisted", async () => {
  const setups = [
    {
      type: "maintenances",
      guildId: "g1",
      channelId: "c1",
      blacklistKeywords: "maint",
      createdAt: null,
      updatedAt: null,
    },
  ];
  const setupsStub = stub(SetupsRepository, "getAllByType", () => Promise.resolve(setups));
  const parseStub = stub(FilterExpressionService, "parseFilterString", () => ({
    patterns: [{ type: "keyword" as const, value: "maint", isValid: true }],
    warnings: [],
  }));
  const blacklistStub = stub(FilterExpressionService, "isBlacklisted", () => true);

  try {
    const result = await NewsQueueService.enqueueSendJobs("maintenances", 1, {
      title: "Maint",
      link: "https://example.com",
      date: Date.now(),
      description: { html: "<p>test</p>", markdown: "test" },
    });
    assertEquals(result, 0);
  } finally {
    setupsStub.restore();
    parseStub.restore();
    blacklistStub.restore();
  }
});

Deno.test("enqueueUpdateJobs - returns 0 when no posted messages exist", async () => {
  const postedStub = stub(PostedNewsMessagesRepository, "findByNewsIdAndVersion", () => Promise.resolve([]));

  try {
    const result = await NewsQueueService.enqueueUpdateJobs("topics", 1, {
      title: "Title",
      link: "https://example.com",
      date: Date.now(),
      description: { html: "<p>t</p>", markdown: "t" },
    });
    assertEquals(result, 0);
  } finally {
    postedStub.restore();
  }
});

Deno.test("enqueueUpdateJobs - enqueues update jobs for posted messages", async () => {
  const postedMessages = [
    {
      id: 1,
      newsType: "topics",
      newsId: 42,
      guildId: "g1",
      channelId: "c1",
      messageId: "m1",
      isV2: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 2,
      newsType: "topics",
      newsId: 42,
      guildId: "g2",
      channelId: "c2",
      messageId: "m2",
      isV2: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
  const postedStub = stub(
    PostedNewsMessagesRepository,
    "findByNewsIdAndVersion",
    () => Promise.resolve(postedMessages),
  );
  const addManyStub = stub(NewsQueueRepository, "addMany", () => Promise.resolve());

  try {
    const result = await NewsQueueService.enqueueUpdateJobs("topics", 42, {
      title: "Title",
      link: "https://example.com",
      date: Date.now(),
      description: { html: "<p>t</p>", markdown: "t" },
    });
    assertEquals(result, 2);
    assertSpyCalls(addManyStub, 1);
  } finally {
    postedStub.restore();
    addManyStub.restore();
  }
});
