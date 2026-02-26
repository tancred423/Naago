import { assertEquals, assertInstanceOf } from "@std/assert";
import { InvalidHelpPageError } from "../../../src/helper/error/InvalidHelpPageError.ts";
import { InvalidSelectionError } from "../../../src/helper/error/InvalidSelectionError.ts";

Deno.test("InvalidHelpPageError - sets name and message", () => {
  const err = new InvalidHelpPageError("page 99");
  assertEquals(err.name, "InvalidHelpPageError");
  assertEquals(err.message, "page 99");
  assertInstanceOf(err, Error);
});

Deno.test("InvalidSelectionError - sets name and message", () => {
  const err = new InvalidSelectionError("bad selection");
  assertEquals(err.name, "InvalidSelectionError");
  assertEquals(err.message, "bad selection");
  assertInstanceOf(err, Error);
});
