import { assertEquals, assertInstanceOf } from "@std/assert";
import { EmojiCouldNotBeFetchedError } from "../../../src/service/error/EmojiCouldNotBeFetchedError.ts";
import { EmojiCouldNotBeParsedError } from "../../../src/service/error/EmojiCouldNotBeParsedError.ts";
import { GameWorldsCouldNotBeLoadedError } from "../../../src/service/error/GameWorldsCouldNotBeLoadedError.ts";

Deno.test("EmojiCouldNotBeFetchedError - sets name and message", () => {
  const err = new EmojiCouldNotBeFetchedError("EMOJI_LOADING");
  assertEquals(err.name, "EmojiCouldNotBeFetchedError");
  assertEquals(err.message, "EMOJI_LOADING");
  assertInstanceOf(err, Error);
});

Deno.test("EmojiCouldNotBeParsedError - sets name and message", () => {
  const err = new EmojiCouldNotBeParsedError("EMOJI_LOADING");
  assertEquals(err.name, "EmojiCouldNotBeParsedError");
  assertEquals(err.message, "EMOJI_LOADING");
  assertInstanceOf(err, Error);
});

Deno.test("GameWorldsCouldNotBeLoadedError - sets name and message", () => {
  const err = new GameWorldsCouldNotBeLoadedError("failed to load");
  assertEquals(err.name, "GameWorldsCouldNotBeLoadedError");
  assertEquals(err.message, "failed to load");
  assertInstanceOf(err, Error);
});
