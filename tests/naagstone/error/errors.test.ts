import { assertEquals, assertInstanceOf } from "@std/assert";
import { ApiRequestFailedError } from "../../../src/naagostone/error/ApiRequestFailedError.ts";
import { LodestoneServiceUnavailableError } from "../../../src/naagostone/error/LodestoneServiceUnavailableError.ts";
import { WorldStatusUnavailableError } from "../../../src/naagostone/error/WorldStatusUnavailableError.ts";

Deno.test("ApiRequestFailedError - sets name and message", () => {
  const err = new ApiRequestFailedError("404 not found");
  assertEquals(err.name, "ApiRequestFailedError");
  assertEquals(err.message, "404 not found");
  assertInstanceOf(err, Error);
});

Deno.test("LodestoneServiceUnavailableError - sets name and default message", () => {
  const err = new LodestoneServiceUnavailableError();
  assertEquals(err.name, "LodestoneServiceUnavailableError");
  assertEquals(err.message, "Lodestone service is currently unavailable. Please try again later.");
  assertInstanceOf(err, Error);
});

Deno.test("WorldStatusUnavailableError - extends LodestoneServiceUnavailableError", () => {
  const err = new WorldStatusUnavailableError();
  assertEquals(err.name, "WorldStatusUnavailableError");
  assertEquals(err.message, "Lodestone world status service is currently unavailable. Please try again later.");
  assertInstanceOf(err, LodestoneServiceUnavailableError);
  assertInstanceOf(err, Error);
});
