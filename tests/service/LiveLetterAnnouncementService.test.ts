import { assertEquals, assertInstanceOf } from "@std/assert";
import { assertSpyCalls, stub } from "@std/testing/mock";
import { ContainerBuilder } from "discord.js";
import { LiveLetterAnnouncementService } from "../../src/service/LiveLetterAnnouncementService.ts";
import { TopicsRepository } from "../../src/database/repository/TopicsRepository.ts";
import { SetupsRepository } from "../../src/database/repository/SetupsRepository.ts";
import { EventReminderSetupsRepository } from "../../src/database/repository/EventReminderSetupsRepository.ts";
import { NewsQueueRepository } from "../../src/database/repository/NewsQueueRepository.ts";
import { GlobalClient } from "../../src/GlobalClient.ts";

function makeTopicData(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    title: "Live Letter LXXVIII",
    link: "https://example.com/ll78",
    date: new Date("2025-01-01T00:00:00Z"),
    banner: "https://example.com/banner.png",
    description: "Description here",
    descriptionV2: null,
    timestampLiveLetter: new Date(Date.now() - 60000),
    liveLetterAnnounced: 0,
    eventType: null,
    eventFrom: null,
    eventTo: null,
    eventFromOverride: null,
    eventToOverride: null,
    eventReminderSent: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

Deno.test("buildAnnouncementComponents - returns containers for valid topic", () => {
  const topic = makeTopicData();
  const result = LiveLetterAnnouncementService.buildAnnouncementComponents(topic);
  assertEquals(result !== null, true);
  assertEquals(result!.length, 2);
  assertInstanceOf(result![0], ContainerBuilder);
  assertInstanceOf(result![1], ContainerBuilder);
});

Deno.test("buildAnnouncementComponents - returns null when no timestampLiveLetter", () => {
  const topic = makeTopicData({ timestampLiveLetter: null });
  const result = LiveLetterAnnouncementService.buildAnnouncementComponents(topic);
  assertEquals(result, null);
});

Deno.test("checkAndSendAnnouncements - returns early when no client", async () => {
  const originalClient = GlobalClient.client;
  GlobalClient.client = null as unknown as typeof GlobalClient.client;

  try {
    await LiveLetterAnnouncementService.checkAndSendAnnouncements();
  } finally {
    GlobalClient.client = originalClient;
  }
});

Deno.test("checkAndSendAnnouncements - returns early when no unannounced live letters", async () => {
  const originalClient = GlobalClient.client;
  GlobalClient.client = {} as unknown as typeof GlobalClient.client;
  const topicsStub = stub(TopicsRepository, "getUnannouncedLiveLetters", () => Promise.resolve([]));

  try {
    await LiveLetterAnnouncementService.checkAndSendAnnouncements();
    assertSpyCalls(topicsStub, 1);
  } finally {
    topicsStub.restore();
    GlobalClient.client = originalClient;
  }
});

Deno.test("checkAndSendAnnouncements - enqueues jobs for live letters that just started", async () => {
  const originalClient = GlobalClient.client;
  GlobalClient.client = {} as unknown as typeof GlobalClient.client;

  const topic = makeTopicData();
  const topicsStub = stub(TopicsRepository, "getUnannouncedLiveLetters", () => Promise.resolve([topic]));
  const markStub = stub(TopicsRepository, "markLiveLetterAsAnnounced", () => Promise.resolve());
  const makeSetup = (guildId: string) => ({
    type: "topics",
    guildId,
    channelId: "ch1",
    blacklistKeywords: null,
    createdAt: null,
    updatedAt: null,
  });
  const setupsStub = stub(SetupsRepository, "getAllByType", () => Promise.resolve([makeSetup("g1")]));
  const channelStub = stub(SetupsRepository, "getChannelId", () => Promise.resolve("ch1"));
  const reminderStub = stub(EventReminderSetupsRepository, "get", () => Promise.resolve(null));
  const addManyStub = stub(NewsQueueRepository, "addMany", () => Promise.resolve());

  try {
    await LiveLetterAnnouncementService.checkAndSendAnnouncements();
    assertSpyCalls(markStub, 1);
    assertSpyCalls(addManyStub, 1);
  } finally {
    topicsStub.restore();
    markStub.restore();
    setupsStub.restore();
    channelStub.restore();
    reminderStub.restore();
    addManyStub.restore();
    GlobalClient.client = originalClient;
  }
});

Deno.test("checkAndSendAnnouncements - skips live letters too far in the past", async () => {
  const originalClient = GlobalClient.client;
  GlobalClient.client = {} as unknown as typeof GlobalClient.client;

  const topic = makeTopicData({ timestampLiveLetter: new Date(Date.now() - 3 * 60 * 60 * 1000) });
  const topicsStub = stub(TopicsRepository, "getUnannouncedLiveLetters", () => Promise.resolve([topic]));
  const markStub = stub(TopicsRepository, "markLiveLetterAsAnnounced", () => Promise.resolve());

  try {
    await LiveLetterAnnouncementService.checkAndSendAnnouncements();
    assertSpyCalls(markStub, 0);
  } finally {
    topicsStub.restore();
    markStub.restore();
    GlobalClient.client = originalClient;
  }
});

Deno.test("checkAndSendAnnouncements - skips future live letters", async () => {
  const originalClient = GlobalClient.client;
  GlobalClient.client = {} as unknown as typeof GlobalClient.client;

  const topic = makeTopicData({ timestampLiveLetter: new Date(Date.now() + 60 * 60 * 1000) });
  const topicsStub = stub(TopicsRepository, "getUnannouncedLiveLetters", () => Promise.resolve([topic]));
  const markStub = stub(TopicsRepository, "markLiveLetterAsAnnounced", () => Promise.resolve());

  try {
    await LiveLetterAnnouncementService.checkAndSendAnnouncements();
    assertSpyCalls(markStub, 0);
  } finally {
    topicsStub.restore();
    markStub.restore();
    GlobalClient.client = originalClient;
  }
});

Deno.test("checkAndSendAnnouncements - deduplicates topics with same timestampLiveLetter, announces only newest", async () => {
  const originalClient = GlobalClient.client;
  GlobalClient.client = {} as unknown as typeof GlobalClient.client;

  const sharedTimestamp = new Date(Date.now() - 60000);
  const olderTopic = makeTopicData({ id: 10, title: "Live Letter LXXVIII", timestampLiveLetter: sharedTimestamp });
  const newerTopic = makeTopicData({
    id: 20,
    title: "Live Letter LXXVIII Reminder",
    timestampLiveLetter: sharedTimestamp,
  });

  const topicsStub = stub(
    TopicsRepository,
    "getUnannouncedLiveLetters",
    () => Promise.resolve([olderTopic, newerTopic]),
  );
  const markStub = stub(TopicsRepository, "markLiveLetterAsAnnounced", () => Promise.resolve());
  const makeSetup = (guildId: string) => ({
    type: "topics",
    guildId,
    channelId: "ch1",
    blacklistKeywords: null,
    createdAt: null,
    updatedAt: null,
  });
  const setupsStub = stub(SetupsRepository, "getAllByType", () => Promise.resolve([makeSetup("g1")]));
  const channelStub = stub(SetupsRepository, "getChannelId", () => Promise.resolve("ch1"));
  const reminderStub = stub(EventReminderSetupsRepository, "get", () => Promise.resolve(null));
  const addManyStub = stub(NewsQueueRepository, "addMany", () => Promise.resolve());

  try {
    await LiveLetterAnnouncementService.checkAndSendAnnouncements();

    assertSpyCalls(markStub, 2);
    assertEquals(markStub.calls[0].args[0], 10);
    assertEquals(markStub.calls[1].args[0], 20);

    assertSpyCalls(addManyStub, 1);
    assertEquals(addManyStub.calls[0].args[0][0].newsId, 20);
  } finally {
    topicsStub.restore();
    markStub.restore();
    setupsStub.restore();
    channelStub.restore();
    reminderStub.restore();
    addManyStub.restore();
    GlobalClient.client = originalClient;
  }
});

Deno.test("deduplicateByTimestamp - groups by timestamp and picks newest", () => {
  const ts1 = new Date("2025-06-01T12:00:00Z");
  const ts2 = new Date("2025-07-01T12:00:00Z");

  const topicA = makeTopicData({ id: 1, timestampLiveLetter: ts1 });
  const topicB = makeTopicData({ id: 5, timestampLiveLetter: ts1 });
  const topicC = makeTopicData({ id: 3, timestampLiveLetter: ts2 });

  const result = LiveLetterAnnouncementService.deduplicateByTimestamp([topicA, topicB, topicC]);

  assertEquals(result.length, 2);

  const group1 = result.find((r) => r.newest.id === 5)!;
  assertEquals(group1.duplicates.length, 1);
  assertEquals(group1.duplicates[0].id, 1);

  const group2 = result.find((r) => r.newest.id === 3)!;
  assertEquals(group2.duplicates.length, 0);
});

Deno.test("deduplicateByTimestamp - returns empty for topics without timestampLiveLetter", () => {
  const topic = makeTopicData({ timestampLiveLetter: null });
  const result = LiveLetterAnnouncementService.deduplicateByTimestamp([topic]);
  assertEquals(result.length, 0);
});
