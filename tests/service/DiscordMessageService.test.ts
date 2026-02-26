import { assertEquals } from "@std/assert";
import { stub } from "@std/testing/mock";
import { DiscordMessageService } from "../../src/service/DiscordMessageService.ts";
import { DiscordEmbedService } from "../../src/service/DiscordEmbedService.ts";
import { EmbedBuilder } from "discord.js";

Deno.test("editReplySuccess - calls editReply with success embed", async () => {
  const fakeEmbed = new EmbedBuilder().setDescription("ok");
  const embedStub = stub(DiscordEmbedService, "getSuccessEmbed", () => fakeEmbed);

  let editReplyArgs: Record<string, unknown> = {};
  const interaction = {
    editReply: (args: Record<string, unknown>) => {
      editReplyArgs = args;
      return Promise.resolve();
    },
  } as unknown as Parameters<typeof DiscordMessageService.editReplySuccess>[0];

  try {
    await DiscordMessageService.editReplySuccess(interaction, "Done!");
    assertEquals(editReplyArgs.content, " ");
    assertEquals((editReplyArgs.embeds as EmbedBuilder[])[0], fakeEmbed);
    assertEquals((editReplyArgs.components as unknown[]).length, 0);
  } finally {
    embedStub.restore();
  }
});

Deno.test("editReplyError - calls editReply with error embed", async () => {
  const fakeEmbed = new EmbedBuilder().setDescription("fail");
  const embedStub = stub(DiscordEmbedService, "getErrorEmbed", () => fakeEmbed);

  let editReplyArgs: Record<string, unknown> = {};
  const interaction = {
    editReply: (args: Record<string, unknown>) => {
      editReplyArgs = args;
      return Promise.resolve();
    },
  } as unknown as Parameters<typeof DiscordMessageService.editReplyError>[0];

  try {
    await DiscordMessageService.editReplyError(interaction, "Error!");
    assertEquals(editReplyArgs.content, " ");
    assertEquals((editReplyArgs.embeds as EmbedBuilder[])[0], fakeEmbed);
  } finally {
    embedStub.restore();
  }
});

Deno.test("deleteAndFollowUpEphemeralError - deletes reply and follows up", async () => {
  const fakeEmbed = new EmbedBuilder().setDescription("err");
  const embedStub = stub(DiscordEmbedService, "getErrorEmbed", () => fakeEmbed);

  let deleteCalled = false;
  let followUpArgs: Record<string, unknown> = {};
  const interaction = {
    deleteReply: () => {
      deleteCalled = true;
      return Promise.resolve();
    },
    followUp: (args: Record<string, unknown>) => {
      followUpArgs = args;
      return Promise.resolve();
    },
  } as unknown as Parameters<typeof DiscordMessageService.deleteAndFollowUpEphemeralError>[0];

  try {
    await DiscordMessageService.deleteAndFollowUpEphemeralError(interaction, "Gone!");
    assertEquals(deleteCalled, true);
    assertEquals((followUpArgs.embeds as EmbedBuilder[])[0], fakeEmbed);
  } finally {
    embedStub.restore();
  }
});
