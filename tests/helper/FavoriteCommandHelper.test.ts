import { assertEquals } from "@std/assert";
import { assertSpyCalls, stub } from "@std/testing/mock";
import { FavoriteCommandHelper } from "../../src/helper/FavoriteCommandHelper.ts";
import { CharacterDataRepository } from "../../src/database/repository/CharacterDataRepository.ts";
import { FavoritesRepository } from "../../src/database/repository/FavoritesRepository.ts";
import { DiscordMessageService } from "../../src/service/DiscordMessageService.ts";
import { DiscordEmbedService } from "../../src/service/DiscordEmbedService.ts";
import { NotInDatabaseError } from "../../src/database/error/NotInDatabaseError.ts";
import { EmbedBuilder } from "discord.js";

function makeButtonInteraction(_customIdParts: string[] = [], userId = "user1") {
  return {
    user: { id: userId },
    editReply: () => Promise.resolve(),
  } as unknown as Parameters<typeof FavoriteCommandHelper.handleRemoveFavoriteConfirmationButton>[0];
}

Deno.test("handleRemoveFavoriteConfirmationButton - cancels when button is cancel", async () => {
  const embedStub = stub(DiscordEmbedService, "getSuccessEmbed", () => new EmbedBuilder().setDescription("Cancelled."));
  let editReplyArgs: Record<string, unknown> = {};
  const interaction = {
    user: { id: "user1" },
    editReply: (args: Record<string, unknown>) => {
      editReplyArgs = args;
      return Promise.resolve();
    },
  } as unknown as Parameters<typeof FavoriteCommandHelper.handleRemoveFavoriteConfirmationButton>[0];

  try {
    await FavoriteCommandHelper.handleRemoveFavoriteConfirmationButton(interaction, ["favorite", "unset", "cancel"]);
    assertEquals(editReplyArgs.content, " ");
  } finally {
    embedStub.restore();
  }
});

Deno.test("handleRemoveFavoriteConfirmationButton - removes favorite successfully", async () => {
  const characterJson = JSON.stringify({ name: "Test Char" });
  const findStub = stub(CharacterDataRepository, "find", () =>
    Promise.resolve({
      characterId: 123,
      latestUpdate: new Date(),
      jsonString: characterJson,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  const deleteStub = stub(FavoritesRepository, "delete", () => Promise.resolve());
  const successStub = stub(DiscordMessageService, "editReplySuccess", () => Promise.resolve());

  try {
    await FavoriteCommandHelper.handleRemoveFavoriteConfirmationButton(
      makeButtonInteraction(["favorite", "unset", "123"]),
      ["favorite", "unset", "123"],
    );
    assertSpyCalls(deleteStub, 1);
    assertSpyCalls(successStub, 1);
  } finally {
    findStub.restore();
    deleteStub.restore();
    successStub.restore();
  }
});

Deno.test("handleRemoveFavoriteConfirmationButton - handles NotInDatabaseError", async () => {
  const findStub = stub(CharacterDataRepository, "find", () => Promise.resolve(null));
  const deleteStub = stub(FavoritesRepository, "delete", () => {
    throw new NotInDatabaseError("not found");
  });
  const errorStub = stub(DiscordMessageService, "editReplyError", () => Promise.resolve());

  try {
    await FavoriteCommandHelper.handleRemoveFavoriteConfirmationButton(
      makeButtonInteraction(["favorite", "unset", "999"]),
      ["favorite", "unset", "999"],
    );
    assertSpyCalls(errorStub, 1);
  } finally {
    findStub.restore();
    deleteStub.restore();
    errorStub.restore();
  }
});

Deno.test("handleRemoveFavoriteConfirmationButton - handles unknown error", async () => {
  const findStub = stub(CharacterDataRepository, "find", () => Promise.resolve(null));
  const deleteStub = stub(FavoritesRepository, "delete", () => {
    throw new Error("unexpected");
  });
  const errorStub = stub(DiscordMessageService, "editReplyError", () => Promise.resolve());

  try {
    await FavoriteCommandHelper.handleRemoveFavoriteConfirmationButton(
      makeButtonInteraction(["favorite", "unset", "999"]),
      ["favorite", "unset", "999"],
    );
    assertSpyCalls(errorStub, 1);
  } finally {
    findStub.restore();
    deleteStub.restore();
    errorStub.restore();
  }
});

Deno.test("handleRemoveFavoriteConfirmationButton - throws for invalid button id length", async () => {
  let threw = false;
  try {
    await FavoriteCommandHelper.handleRemoveFavoriteConfirmationButton(
      makeButtonInteraction(["favorite", "unset"]),
      ["favorite", "unset"],
    );
  } catch {
    threw = true;
  }
  assertEquals(threw, true);
});
