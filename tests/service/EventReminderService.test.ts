import { assertEquals, assertInstanceOf } from "@std/assert";
import { assertSpyCalls, stub } from "@std/testing/mock";
import { ContainerBuilder } from "discord.js";
import { EventReminderService } from "../../src/service/EventReminderService.ts";
import { TopicsRepository } from "../../src/database/repository/TopicsRepository.ts";
import { SetupsRepository } from "../../src/database/repository/SetupsRepository.ts";
import { EventReminderSetupsRepository } from "../../src/database/repository/EventReminderSetupsRepository.ts";
import { NewsQueueRepository } from "../../src/database/repository/NewsQueueRepository.ts";
import { GlobalClient } from "../../src/GlobalClient.ts";

function makeEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    title: "Moogle Treasure Trove",
    link: "https://example.com/event",
    date: new Date("2025-06-01T00:00:00Z"),
    banner: "https://example.com/event-banner.png",
    description: "Event description",
    descriptionV2: null,
    timestampLiveLetter: null,
    liveLetterAnnounced: 0,
    eventType: "event",
    eventFrom: new Date("2025-06-01"),
    eventTo: new Date("2025-06-30"),
    eventFromOverride: null,
    eventToOverride: null,
    eventReminderSent: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

Deno.test("buildReminderComponents - returns containers for valid event", () => {
  const event = makeEvent();
  const result = EventReminderService.buildReminderComponents(event);
  assertEquals(result !== null, true);
  assertEquals(result!.length, 2);
  assertInstanceOf(result![0], ContainerBuilder);
  assertInstanceOf(result![1], ContainerBuilder);
});

Deno.test("buildReminderComponents - returns null when no eventTo", () => {
  const event = makeEvent({ eventTo: null });
  const result = EventReminderService.buildReminderComponents(event);
  assertEquals(result, null);
});

Deno.test("buildReminderComponents - uses eventToOverride when set", () => {
  const event = makeEvent({ eventToOverride: new Date("2025-07-15") });
  const result = EventReminderService.buildReminderComponents(event);
  assertEquals(result !== null, true);
  assertEquals(result!.length, 2);
});

Deno.test("checkAndSendReminders - returns early when no client", async () => {
  const originalClient = GlobalClient.client;
  GlobalClient.client = null as unknown as typeof GlobalClient.client;

  try {
    await EventReminderService.checkAndSendReminders();
  } finally {
    GlobalClient.client = originalClient;
  }
});

Deno.test("checkAndSendReminders - returns early when no events ending soon", async () => {
  const originalClient = GlobalClient.client;
  GlobalClient.client = {} as unknown as typeof GlobalClient.client;
  const eventsStub = stub(TopicsRepository, "getEventsEndingSoon", () => Promise.resolve([]));

  try {
    await EventReminderService.checkAndSendReminders();
    assertSpyCalls(eventsStub, 1);
  } finally {
    eventsStub.restore();
    GlobalClient.client = originalClient;
  }
});

Deno.test("checkAndSendReminders - returns early when no topic setups", async () => {
  const originalClient = GlobalClient.client;
  GlobalClient.client = {} as unknown as typeof GlobalClient.client;
  const eventsStub = stub(TopicsRepository, "getEventsEndingSoon", () => Promise.resolve([makeEvent()]));
  const setupsStub = stub(SetupsRepository, "getAllByType", () => Promise.resolve([]));

  try {
    await EventReminderService.checkAndSendReminders();
    assertSpyCalls(setupsStub, 1);
  } finally {
    eventsStub.restore();
    setupsStub.restore();
    GlobalClient.client = originalClient;
  }
});

Deno.test("checkAndSendReminders - enqueues reminder jobs and marks sent", async () => {
  const originalClient = GlobalClient.client;
  GlobalClient.client = {} as unknown as typeof GlobalClient.client;

  const event = makeEvent();
  const eventsStub = stub(TopicsRepository, "getEventsEndingSoon", () => Promise.resolve([event]));
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
  const markStub = stub(TopicsRepository, "markEventReminderSent", () => Promise.resolve());

  try {
    await EventReminderService.checkAndSendReminders();
    assertSpyCalls(addManyStub, 1);
    assertSpyCalls(markStub, 1);
  } finally {
    eventsStub.restore();
    setupsStub.restore();
    channelStub.restore();
    reminderStub.restore();
    addManyStub.restore();
    markStub.restore();
    GlobalClient.client = originalClient;
  }
});

Deno.test("checkAndSendReminders - skips guilds with reminders disabled", async () => {
  const originalClient = GlobalClient.client;
  GlobalClient.client = {} as unknown as typeof GlobalClient.client;

  const event = makeEvent();
  const eventsStub = stub(TopicsRepository, "getEventsEndingSoon", () => Promise.resolve([event]));
  const makeSetup = (guildId: string) => ({
    type: "topics",
    guildId,
    channelId: "ch1",
    blacklistKeywords: null,
    createdAt: null,
    updatedAt: null,
  });
  const setupsStub = stub(SetupsRepository, "getAllByType", () => Promise.resolve([makeSetup("g1")]));
  const reminderStub = stub(
    EventReminderSetupsRepository,
    "get",
    () => Promise.resolve({ guildId: "g1", enabled: 0, channelId: null, createdAt: new Date(), updatedAt: new Date() }),
  );
  const markStub = stub(TopicsRepository, "markEventReminderSent", () => Promise.resolve());

  try {
    await EventReminderService.checkAndSendReminders();
    assertSpyCalls(markStub, 1);
  } finally {
    eventsStub.restore();
    setupsStub.restore();
    reminderStub.restore();
    markStub.restore();
    GlobalClient.client = originalClient;
  }
});
