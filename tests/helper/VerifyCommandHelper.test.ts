import { assertEquals } from "@std/assert";
import { assertSpyCalls, stub } from "@std/testing/mock";
import { VerifyCommandHelper } from "../../src/helper/VerifyCommandHelper.ts";
import { DiscordEmbedService } from "../../src/service/DiscordEmbedService.ts";
import { PurgeUserDataService } from "../../src/service/PurgeUserDataService.ts";
import { VerificationsRepository } from "../../src/database/repository/VerificationsRepository.ts";
import { NaagostoneApiService } from "../../src/naagostone/service/NaagostoneApiService.ts";
import { EmbedBuilder } from "discord.js";

function makeButtonInteraction(userId = "user1") {
  return {
    user: { id: userId },
    editReply: () => Promise.resolve(),
  } as unknown as Parameters<typeof VerifyCommandHelper.update>[0];
}

Deno.test("update - throws for invalid button id length", async () => {
  let threw = false;
  try {
    await VerifyCommandHelper.update(makeButtonInteraction(), ["verify", "code"]);
  } catch {
    threw = true;
  }
  assertEquals(threw, true);
});

Deno.test("update - handles unset cancel", async () => {
  const embedStub = stub(DiscordEmbedService, "getSuccessEmbed", () => new EmbedBuilder());
  let editReplyArgs: Record<string, unknown> = {};
  const interaction = {
    user: { id: "user1" },
    editReply: (args: Record<string, unknown>) => {
      editReplyArgs = args;
      return Promise.resolve();
    },
  } as unknown as Parameters<typeof VerifyCommandHelper.update>[0];

  try {
    await VerifyCommandHelper.update(interaction, ["verify", "unset", "cancel"]);
    assertEquals(editReplyArgs.content, " ");
  } finally {
    embedStub.restore();
  }
});

Deno.test("update - handles unset with purge", async () => {
  const embedStub = stub(DiscordEmbedService, "getSuccessEmbed", () => new EmbedBuilder());
  const purgeStub = stub(PurgeUserDataService, "purgeUser", () => Promise.resolve());
  const interaction = makeButtonInteraction("user1");

  try {
    await VerifyCommandHelper.update(interaction, ["verify", "unset", "12345"]);
    assertSpyCalls(purgeStub, 1);
    assertEquals(purgeStub.calls[0].args[0], "user1");
    assertEquals(purgeStub.calls[0].args[1], 12345);
  } finally {
    embedStub.restore();
    purgeStub.restore();
  }
});

Deno.test("update - handles unset purge failure", async () => {
  const successStub = stub(DiscordEmbedService, "getSuccessEmbed", () => new EmbedBuilder());
  const errorStub = stub(DiscordEmbedService, "getErrorEmbed", () => new EmbedBuilder());
  const purgeStub = stub(PurgeUserDataService, "purgeUser", () => Promise.reject(new Error("purge failed")));
  const interaction = makeButtonInteraction();

  try {
    await VerifyCommandHelper.update(interaction, ["verify", "unset", "12345"]);
    assertSpyCalls(errorStub, 1);
  } finally {
    successStub.restore();
    errorStub.restore();
    purgeStub.restore();
  }
});

Deno.test("update - reports already verified for same character", async () => {
  const embedStub = stub(DiscordEmbedService, "getSuccessEmbed", () => new EmbedBuilder());
  const verifyStub = stub(VerificationsRepository, "find", () =>
    Promise.resolve({
      userId: "user1",
      characterId: 555,
      verificationCode: "naago-abc123",
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  const interaction = makeButtonInteraction("user1");

  try {
    await VerifyCommandHelper.update(interaction, ["verify", "naago-abc123", "555"]);
    assertSpyCalls(embedStub, 1);
  } finally {
    embedStub.restore();
    verifyStub.restore();
  }
});

Deno.test("update - reports error when character fetch fails", async () => {
  const errorStub = stub(DiscordEmbedService, "getErrorEmbed", () => new EmbedBuilder());
  const verifyStub = stub(VerificationsRepository, "find", () => Promise.resolve(null));
  const fetchStub = stub(NaagostoneApiService, "fetchCharacterById", () => Promise.resolve(null));
  const interaction = makeButtonInteraction();

  try {
    await VerifyCommandHelper.update(interaction, ["verify", "naago-abc123", "555"]);
    assertSpyCalls(errorStub, 1);
  } finally {
    errorStub.restore();
    verifyStub.restore();
    fetchStub.restore();
  }
});

Deno.test("update - reports error when bio does not contain verification code", async () => {
  const errorStub = stub(DiscordEmbedService, "getErrorEmbed", () => new EmbedBuilder());
  const verifyStub = stub(VerificationsRepository, "find", () => Promise.resolve(null));
  const fetchStub = stub(
    NaagostoneApiService,
    "fetchCharacterById",
    () =>
      Promise.resolve(
        {
          bio: { html: "no code here", markdown: "" },
        } as ReturnType<typeof NaagostoneApiService.fetchCharacterById> extends Promise<infer T> ? T : never,
      ),
  );
  const interaction = makeButtonInteraction();

  try {
    await VerifyCommandHelper.update(interaction, ["verify", "naago-abc123", "555"]);
    assertSpyCalls(errorStub, 1);
  } finally {
    errorStub.restore();
    verifyStub.restore();
    fetchStub.restore();
  }
});

Deno.test("update - verifies character when bio contains code", async () => {
  const successStub = stub(DiscordEmbedService, "getSuccessEmbed", () => new EmbedBuilder());
  const verifyStub = stub(VerificationsRepository, "find", () => Promise.resolve(null));
  const fetchStub = stub(
    NaagostoneApiService,
    "fetchCharacterById",
    () =>
      Promise.resolve(
        {
          name: "Test Char",
          bio: { html: "naago-abc123", markdown: "" },
        } as ReturnType<typeof NaagostoneApiService.fetchCharacterById> extends Promise<infer T> ? T : never,
      ),
  );
  const setVerifyStub = stub(VerificationsRepository, "setVerification", () => Promise.resolve());
  const interaction = makeButtonInteraction();

  try {
    await VerifyCommandHelper.update(interaction, ["verify", "naago-abc123", "555"]);
    assertSpyCalls(setVerifyStub, 1);
    assertSpyCalls(successStub, 1);
  } finally {
    successStub.restore();
    verifyStub.restore();
    fetchStub.restore();
    setVerifyStub.restore();
  }
});
