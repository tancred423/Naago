import { assertEquals } from "@std/assert";
import { GlobalClient } from "../src/GlobalClient.ts";

Deno.test("GlobalClient - client is initially undefined", () => {
  const hasProperty = "client" in GlobalClient;
  assertEquals(hasProperty, true);
});

Deno.test("GlobalClient - client can be assigned and read", () => {
  const original = GlobalClient.client;
  const fakeClient = { fake: true };
  GlobalClient.client = fakeClient as unknown as typeof GlobalClient.client;
  assertEquals((GlobalClient.client as unknown as { fake: boolean }).fake, true);
  GlobalClient.client = original;
});
