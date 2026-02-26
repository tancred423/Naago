import { assertEquals } from "@std/assert";
import type { EmojiData } from "../../../src/service/type/EmojiData.ts";

Deno.test("EmojiData - type conformance for static emoji", () => {
  const data: EmojiData = { id: "123456789", name: "test_emoji", animated: false };
  assertEquals(data.id, "123456789");
  assertEquals(data.name, "test_emoji");
  assertEquals(data.animated, false);
});

Deno.test("EmojiData - type conformance for animated emoji", () => {
  const data: EmojiData = { id: "987654321", name: "dance", animated: true };
  assertEquals(data.animated, true);
});
