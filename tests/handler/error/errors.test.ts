import { assertEquals, assertInstanceOf } from "@std/assert";
import { InvalidCommandError } from "../../../src/handler/error/InvalidCommandError.ts";
import { InvalidSubCommandError } from "../../../src/handler/error/InvalidSubCommandError.ts";

Deno.test("InvalidCommandError - sets name and message", () => {
  const err = new InvalidCommandError("unknown command");
  assertEquals(err.name, "InvalidCommandError");
  assertEquals(err.message, "unknown command");
  assertInstanceOf(err, Error);
});

Deno.test("InvalidSubCommandError - sets name and message", () => {
  const err = new InvalidSubCommandError("bad sub");
  assertEquals(err.name, "InvalidSubCommandError");
  assertEquals(err.message, "bad sub");
  assertInstanceOf(err, Error);
});
