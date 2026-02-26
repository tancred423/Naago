import { assertEquals, assertMatch } from "@std/assert";
import { StringManipulationService } from "../../src/service/StringManipulationService.ts";

Deno.test("formatName - formats two-word name to title case", () => {
  assertEquals(StringManipulationService.formatName("john DOE"), "John Doe");
});

Deno.test("formatName - preserves already-correct casing", () => {
  assertEquals(StringManipulationService.formatName("John Doe"), "John Doe");
});

Deno.test("formatName - returns single-word name unchanged", () => {
  assertEquals(StringManipulationService.formatName("john"), "john");
});

Deno.test("formatName - returns three-word name unchanged", () => {
  assertEquals(StringManipulationService.formatName("John Von Doe"), "John Von Doe");
});

Deno.test("formatName - handles all-uppercase input", () => {
  assertEquals(StringManipulationService.formatName("JOHN DOE"), "John Doe");
});

Deno.test("formatName - handles all-lowercase input", () => {
  assertEquals(StringManipulationService.formatName("john doe"), "John Doe");
});

Deno.test("generateVerificationCode - starts with naago- prefix", () => {
  const code = StringManipulationService.generateVerificationCode();
  assertMatch(code, /^naago-[0-9a-f]{6}$/);
});

Deno.test("generateVerificationCode - produces unique codes", () => {
  const codes = new Set(Array.from({ length: 20 }, () => StringManipulationService.generateVerificationCode()));
  assertEquals(codes.size, 20);
});

Deno.test("capitalizeFirstLetter - capitalizes first letter and lowercases rest", () => {
  assertEquals(StringManipulationService.capitalizeFirstLetter("hELLO"), "Hello");
});

Deno.test("capitalizeFirstLetter - handles single character", () => {
  assertEquals(StringManipulationService.capitalizeFirstLetter("h"), "H");
});

Deno.test("capitalizeFirstLetter - handles already capitalized", () => {
  assertEquals(StringManipulationService.capitalizeFirstLetter("Hello"), "Hello");
});

Deno.test("convertTag - combines capitalized category with cleaned tag", () => {
  assertEquals(StringManipulationService.convertTag("events", "[Seasonal Event]"), "Events: Seasonal Event");
});

Deno.test("convertTag - returns capitalized category when tag is null", () => {
  assertEquals(StringManipulationService.convertTag("events", null), "Events");
});

Deno.test("convertTag - strips multiple bracket pairs", () => {
  assertEquals(StringManipulationService.convertTag("topics", "[Some] [Tag]"), "Topics: Some Tag");
});
