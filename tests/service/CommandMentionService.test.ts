import { assertEquals } from "@std/assert";
import { CommandMentionService } from "../../src/service/CommandMentionService.ts";

function setCommandId(name: string, id: string): void {
  // deno-lint-ignore no-explicit-any
  (CommandMentionService as any).commandIds.set(name, id);
}

function clearCommandIds(): void {
  // deno-lint-ignore no-explicit-any
  (CommandMentionService as any).commandIds.clear();
}

Deno.test("mentionOrPlain - returns plain label when command not cached", () => {
  clearCommandIds();
  assertEquals(CommandMentionService.mentionOrPlain("help"), "/help");
});

Deno.test("mentionOrPlain - returns plain label with subcommand when not cached", () => {
  clearCommandIds();
  assertEquals(CommandMentionService.mentionOrPlain("setup", "news"), "/setup news");
});

Deno.test("mentionOrPlain - returns Discord mention format when cached", () => {
  clearCommandIds();
  setCommandId("help", "123456789");
  assertEquals(CommandMentionService.mentionOrPlain("help"), "</help:123456789>");
});

Deno.test("mentionOrPlain - returns Discord mention with subcommand when cached", () => {
  clearCommandIds();
  setCommandId("setup", "987654321");
  assertEquals(CommandMentionService.mentionOrPlain("setup", "news"), "</setup news:987654321>");
});

Deno.test("mentionOrBacktick - returns backtick label when command not cached", () => {
  clearCommandIds();
  assertEquals(CommandMentionService.mentionOrBacktick("help"), "`/help`");
});

Deno.test("mentionOrBacktick - returns backtick label with subcommand when not cached", () => {
  clearCommandIds();
  assertEquals(CommandMentionService.mentionOrBacktick("setup", "news"), "`/setup news`");
});

Deno.test("mentionOrBacktick - returns Discord mention format when cached", () => {
  clearCommandIds();
  setCommandId("help", "123456789");
  assertEquals(CommandMentionService.mentionOrBacktick("help"), "</help:123456789>");
});

Deno.test("mentionOrBacktick - returns Discord mention with subcommand when cached", () => {
  clearCommandIds();
  setCommandId("events", "111222333");
  assertEquals(CommandMentionService.mentionOrBacktick("events", "list"), "</events list:111222333>");
});
