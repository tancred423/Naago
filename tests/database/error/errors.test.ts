import { assertEquals, assertInstanceOf } from "@std/assert";
import { AlreadyInDatabaseError } from "../../../src/database/error/AlreadyInDatabaseError.ts";
import { MaximumAmountReachedError } from "../../../src/database/error/MaximumAmountReachedError.ts";
import { NotInDatabaseError } from "../../../src/database/error/NotInDatabaseError.ts";

Deno.test("AlreadyInDatabaseError - sets name and message", () => {
  const err = new AlreadyInDatabaseError("duplicate entry");
  assertEquals(err.name, "AlreadyInDatabaseError");
  assertEquals(err.message, "duplicate entry");
  assertInstanceOf(err, Error);
});

Deno.test("MaximumAmountReachedError - sets name and message", () => {
  const err = new MaximumAmountReachedError("max reached");
  assertEquals(err.name, "MaximumAmountReachedError");
  assertEquals(err.message, "max reached");
  assertInstanceOf(err, Error);
});

Deno.test("NotInDatabaseError - sets name and message", () => {
  const err = new NotInDatabaseError("not found");
  assertEquals(err.name, "NotInDatabaseError");
  assertEquals(err.message, "not found");
  assertInstanceOf(err, Error);
});
