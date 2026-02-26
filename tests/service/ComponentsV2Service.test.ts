import { assertEquals, assertInstanceOf } from "@std/assert";
import { assertSpyCalls, stub } from "@std/testing/mock";
import { ContainerBuilder } from "discord.js";
import { NewsQueueService } from "../../src/service/NewsQueueService.ts";

Deno.env.set("COLOR_TOPICS", "#3498db");
Deno.env.set("COLOR_NOTICES", "#2ecc71");
Deno.env.set("COLOR_MAINTENANCES", "#e67e22");
Deno.env.set("COLOR_UPDATES", "#9b59b6");
Deno.env.set("COLOR_STATUS", "#e74c3c");
Deno.env.set("EMOJI_NEWS_TOPIC", "<:topic:1>");
Deno.env.set("EMOJI_NEWS_NOTICE", "<:notice:2>");
Deno.env.set("EMOJI_NEWS_MAINTENANCE", "<:maint:3>");
Deno.env.set("EMOJI_NEWS_UPDATE", "<:update:4>");
Deno.env.set("EMOJI_NEWS_STATUS", "<:status:5>");
Deno.env.set("EMOJI_LODESTONE", "<:lodestone:6>");

const { ComponentsV2Service } = await import("../../src/service/ComponentsV2Service.ts");

function makeNewsData(overrides: Record<string, unknown> = {}) {
  return {
    title: "Test News",
    link: "https://example.com/news",
    date: 1700000000000,
    description: {
      html: "<p>desc</p>",
      markdown: "desc",
      discord_components_v2: {
        components: [
          { type: "textDisplay" as const, content: "Hello world" },
        ],
      },
    },
    ...overrides,
  };
}

Deno.test("buildContainer - returns ContainerBuilder for valid data", () => {
  const data = makeNewsData();
  const container = ComponentsV2Service.buildContainer("topics", data);
  assertInstanceOf(container, ContainerBuilder);
});

Deno.test("buildContainer - returns null when no discord_components_v2", () => {
  const data = makeNewsData({
    description: { html: "<p>test</p>", markdown: "test" },
  });
  const container = ComponentsV2Service.buildContainer("topics", data);
  assertEquals(container, null);
});

Deno.test("buildContainer - returns null when color env key is missing", () => {
  const originalColor = Deno.env.get("COLOR_TOPICS");
  Deno.env.delete("COLOR_TOPICS");
  try {
    const data = makeNewsData();
    const container = ComponentsV2Service.buildContainer("topics", data);
    assertEquals(container, null);
  } finally {
    if (originalColor) Deno.env.set("COLOR_TOPICS", originalColor);
  }
});

Deno.test("buildContainer - handles banner in data", () => {
  const data = makeNewsData({ banner: "https://example.com/banner.png" });
  const container = ComponentsV2Service.buildContainer("topics", data);
  assertInstanceOf(container, ContainerBuilder);
});

Deno.test("buildContainer - uses tag as type label when provided", () => {
  const data = makeNewsData({ tag: "Emergency" });
  const container = ComponentsV2Service.buildContainer("maintenances", data);
  assertInstanceOf(container, ContainerBuilder);
});

Deno.test("buildContainer - handles media gallery components", () => {
  const data = makeNewsData({
    description: {
      html: "<p>test</p>",
      markdown: "test",
      discord_components_v2: {
        components: [
          { type: "textDisplay" as const, content: "Text" },
          { type: "mediaGallery" as const, urls: ["https://img.com/1.png", "https://img.com/2.png"] },
          { type: "separator" as const },
        ],
      },
    },
  });
  const container = ComponentsV2Service.buildContainer("notices", data);
  assertInstanceOf(container, ContainerBuilder);
});

Deno.test("buildContainer - truncates very long text content", () => {
  const longContent = "A".repeat(5000);
  const data = makeNewsData({
    description: {
      html: "<p>test</p>",
      markdown: "test",
      discord_components_v2: {
        components: [
          { type: "textDisplay" as const, content: longContent },
        ],
      },
    },
  });
  const container = ComponentsV2Service.buildContainer("topics", data);
  assertInstanceOf(container, ContainerBuilder);
});

Deno.test("buildContainerForUpdate - delegates to buildContainer", () => {
  const data = makeNewsData();
  const container = ComponentsV2Service.buildContainerForUpdate("topics", data);
  assertInstanceOf(container, ContainerBuilder);
});

Deno.test("send - returns early when no discord_components_v2", async () => {
  const data = makeNewsData({
    description: { html: "<p>test</p>", markdown: "test" },
  });
  const enqueueStub = stub(NewsQueueService, "enqueueSendJobs", () => Promise.resolve(0));
  try {
    await ComponentsV2Service.send("topics", data, 1);
    assertSpyCalls(enqueueStub, 0);
  } finally {
    enqueueStub.restore();
  }
});

Deno.test("send - returns early when newsId is undefined", async () => {
  const data = makeNewsData();
  const enqueueStub = stub(NewsQueueService, "enqueueSendJobs", () => Promise.resolve(0));
  try {
    await ComponentsV2Service.send("topics", data);
    assertSpyCalls(enqueueStub, 0);
  } finally {
    enqueueStub.restore();
  }
});

Deno.test("send - enqueues send jobs when data is valid", async () => {
  const data = makeNewsData();
  const enqueueStub = stub(NewsQueueService, "enqueueSendJobs", () => Promise.resolve(5));
  try {
    await ComponentsV2Service.send("topics", data, 42);
    assertSpyCalls(enqueueStub, 1);
    assertEquals(enqueueStub.calls[0].args[0], "topics");
    assertEquals(enqueueStub.calls[0].args[1], 42);
  } finally {
    enqueueStub.restore();
  }
});

Deno.test("buildContainer - works for all news types", () => {
  const types = ["topics", "notices", "maintenances", "updates", "statuses"] as const;
  for (const type of types) {
    const data = makeNewsData();
    const container = ComponentsV2Service.buildContainer(type, data);
    assertInstanceOf(container, ContainerBuilder);
  }
});
