import { assertEquals, assertInstanceOf } from "@std/assert";
import { ContainerBuilder, EmbedBuilder } from "discord.js";

Deno.env.set("COLOR_GREEN", "#00ff00");
Deno.env.set("COLOR_RED", "#ff0000");
Deno.env.set("COLOR_TOPICS", "#3498db");
Deno.env.set("COLOR_MAINTENANCES", "#e67e22");
Deno.env.set("EMOJI_NEWS_TOPIC", "<:topic:123>");
Deno.env.set("EMOJI_NEWS_MAINTENANCE", "<:maint:456>");
Deno.env.set("EMOJI_LODESTONE", "<:lodestone:789>");

const { DiscordEmbedService } = await import("../../src/service/DiscordEmbedService.ts");

Deno.test("getSuccessEmbed - returns EmbedBuilder with green color and description", () => {
  const embed = DiscordEmbedService.getSuccessEmbed("Operation successful");
  assertInstanceOf(embed, EmbedBuilder);
  assertEquals(embed.data.description, "Operation successful");
  assertEquals(embed.data.color, 0x00ff00);
});

Deno.test("getErrorEmbed - returns EmbedBuilder with red color and description", () => {
  const embed = DiscordEmbedService.getErrorEmbed("Something went wrong");
  assertInstanceOf(embed, EmbedBuilder);
  assertEquals(embed.data.description, "Something went wrong");
  assertEquals(embed.data.color, 0xff0000);
});

Deno.test("buildTextContainer - returns ContainerBuilder with correct accent color", () => {
  const container = DiscordEmbedService.buildTextContainer("Hello world", "COLOR_TOPICS");
  assertInstanceOf(container, ContainerBuilder);
});

Deno.test("buildTextContainer - uses fallback color when env key is missing", () => {
  const container = DiscordEmbedService.buildTextContainer("Test", "COLOR_NONEXISTENT");
  assertInstanceOf(container, ContainerBuilder);
});

Deno.test("getTopicContainerFromData - returns ContainerBuilder for topic", () => {
  const topic = {
    id: 1,
    title: "Test Topic",
    link: "https://example.com",
    date: new Date("2025-01-01T00:00:00Z"),
    banner: "https://example.com/banner.png",
    description: "Some markdown description",
    descriptionV2: null,
    timestampLiveLetter: null,
    liveLetterAnnounced: 0,
    eventType: null,
    eventFrom: null,
    eventTo: null,
    eventFromOverride: null,
    eventToOverride: null,
    eventReminderSent: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const container = DiscordEmbedService.getTopicContainerFromData(topic);
  assertInstanceOf(container, ContainerBuilder);
});

Deno.test("getTopicContainerFromData - handles topic without banner", () => {
  const topic = {
    id: 2,
    title: "No Banner Topic",
    link: "https://example.com/2",
    date: new Date("2025-01-01T00:00:00Z"),
    banner: "",
    description: "Description here",
    descriptionV2: null,
    timestampLiveLetter: null,
    liveLetterAnnounced: 0,
    eventType: null,
    eventFrom: null,
    eventTo: null,
    eventFromOverride: null,
    eventToOverride: null,
    eventReminderSent: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const container = DiscordEmbedService.getTopicContainerFromData(topic);
  assertInstanceOf(container, ContainerBuilder);
});

Deno.test("getTopicContainerFromData - uses descriptionV2 when available", () => {
  const topic = {
    id: 3,
    title: "V2 Topic",
    link: "https://example.com/3",
    date: new Date("2025-01-01T00:00:00Z"),
    banner: "",
    description: "Fallback markdown",
    descriptionV2: {
      components: [
        { type: "textDisplay" as const, content: "V2 content here" },
        { type: "separator" as const },
        { type: "mediaGallery" as const, urls: ["https://img.com/1.png"] },
      ],
    },
    timestampLiveLetter: null,
    liveLetterAnnounced: 0,
    eventType: null,
    eventFrom: null,
    eventTo: null,
    eventFromOverride: null,
    eventToOverride: null,
    eventReminderSent: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const container = DiscordEmbedService.getTopicContainerFromData(topic);
  assertInstanceOf(container, ContainerBuilder);
});

Deno.test("getTopicContainerFromData - truncates long descriptions", () => {
  const longDescription = "A".repeat(2500);
  const topic = {
    id: 4,
    title: "Long Description Topic",
    link: "https://example.com/4",
    date: new Date("2025-01-01T00:00:00Z"),
    banner: "",
    description: longDescription,
    descriptionV2: null,
    timestampLiveLetter: null,
    liveLetterAnnounced: 0,
    eventType: null,
    eventFrom: null,
    eventTo: null,
    eventFromOverride: null,
    eventToOverride: null,
    eventReminderSent: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const container = DiscordEmbedService.getTopicContainerFromData(topic);
  assertInstanceOf(container, ContainerBuilder);
});

Deno.test("getMaintenanceContainerFromData - returns ContainerBuilder for maintenance", () => {
  const maintenance = {
    id: 1,
    tag: "Emergency",
    title: "Server Maintenance",
    link: "https://example.com/maint",
    date: new Date("2025-01-01T00:00:00Z"),
    description: "Maintenance description",
    descriptionV2: null,
    startDate: null,
    endDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const container = DiscordEmbedService.getMaintenanceContainerFromData(maintenance);
  assertInstanceOf(container, ContainerBuilder);
});

Deno.test("getMaintenanceContainerFromData - uses default label when tag is null", () => {
  const maintenance = {
    id: 2,
    tag: null,
    title: "Regular Maintenance",
    link: "https://example.com/maint2",
    date: new Date("2025-01-01T00:00:00Z"),
    description: "Regular maintenance",
    descriptionV2: null,
    startDate: null,
    endDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const container = DiscordEmbedService.getMaintenanceContainerFromData(maintenance);
  assertInstanceOf(container, ContainerBuilder);
});
