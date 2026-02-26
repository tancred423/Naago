import { assertEquals, assertInstanceOf } from "@std/assert";
import { InvalidSubCommandError } from "../../../src/command/error/InvalidSubCommandError.ts";

Deno.test("InvalidSubCommandError - sets name and message", () => {
  const err = new InvalidSubCommandError("bad subcommand");
  assertEquals(err.name, "InvalidSubCommandError");
  assertEquals(err.message, "bad subcommand");
  assertInstanceOf(err, Error);
});
