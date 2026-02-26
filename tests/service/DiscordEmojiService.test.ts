import { assertEquals, assertThrows } from "@std/assert";
import { DiscordEmojiService } from "../../src/service/DiscordEmojiService.ts";
import { EmojiCouldNotBeFetchedError } from "../../src/service/error/EmojiCouldNotBeFetchedError.ts";
import { EmojiCouldNotBeParsedError } from "../../src/service/error/EmojiCouldNotBeParsedError.ts";

Deno.test("getAsMarkdown - returns emoji markdown from env", () => {
  Deno.env.set("EMOJI_LOADING", "<a:loading:123456>");
  assertEquals(DiscordEmojiService.getAsMarkdown("EMOJI_LOADING"), "<a:loading:123456>");
  Deno.env.delete("EMOJI_LOADING");
});

Deno.test("getAsMarkdown - throws EmojiCouldNotBeFetchedError when env not set", () => {
  Deno.env.delete("EMOJI_LOADING");
  assertThrows(
    () => DiscordEmojiService.getAsMarkdown("EMOJI_LOADING"),
    EmojiCouldNotBeFetchedError,
  );
});

Deno.test("getAsEmojiData - parses animated emoji correctly", () => {
  Deno.env.set("EMOJI_LOADING", "<a:loading:123456>");
  const data = DiscordEmojiService.getAsEmojiData("EMOJI_LOADING");
  assertEquals(data.id, "123456");
  assertEquals(data.name, "loading");
  assertEquals(data.animated, true);
  Deno.env.delete("EMOJI_LOADING");
});

Deno.test("getAsEmojiData - parses static emoji correctly", () => {
  Deno.env.set("EMOJI_LOADING", "<:myemoji:789012>");
  const data = DiscordEmojiService.getAsEmojiData("EMOJI_LOADING");
  assertEquals(data.id, "789012");
  assertEquals(data.name, "myemoji");
  assertEquals(data.animated, false);
  Deno.env.delete("EMOJI_LOADING");
});

Deno.test("getAsEmojiData - throws EmojiCouldNotBeFetchedError when env not set", () => {
  Deno.env.delete("EMOJI_LOADING");
  assertThrows(
    () => DiscordEmojiService.getAsEmojiData("EMOJI_LOADING"),
    EmojiCouldNotBeFetchedError,
  );
});

Deno.test("getAsEmojiData - throws EmojiCouldNotBeParsedError for invalid format", () => {
  Deno.env.set("EMOJI_LOADING", "not-a-valid-emoji");
  assertThrows(
    () => DiscordEmojiService.getAsEmojiData("EMOJI_LOADING"),
    EmojiCouldNotBeParsedError,
  );
  Deno.env.delete("EMOJI_LOADING");
});
