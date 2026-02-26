import { assertEquals } from "@std/assert";
import { EorzeanCalendarService } from "../../src/service/EorzeanCalendarService.ts";

Deno.test("convertToGregorian - 1st Sun of the 1st Astral Moon -> 1st January", () => {
  assertEquals(EorzeanCalendarService.convertToGregorian("1st Sun of the 1st Astral Moon"), "1st January");
});

Deno.test("convertToGregorian - 16th Sun of the 3rd Umbral Moon -> 15th June", () => {
  assertEquals(EorzeanCalendarService.convertToGregorian("16th Sun of the 3rd Umbral Moon"), "15th June");
});

Deno.test("convertToGregorian - 32nd Sun of the 6th Umbral Moon -> 31st December", () => {
  assertEquals(EorzeanCalendarService.convertToGregorian("32nd Sun of the 6th Umbral Moon"), "31st December");
});

Deno.test("convertToGregorian - 1st Sun of the 1st Umbral Moon -> 1st February", () => {
  assertEquals(EorzeanCalendarService.convertToGregorian("1st Sun of the 1st Umbral Moon"), "1st February");
});

Deno.test("convertToGregorian - 15th Sun of the 2nd Astral Moon -> 15th March", () => {
  assertEquals(EorzeanCalendarService.convertToGregorian("15th Sun of the 2nd Astral Moon"), "15th March");
});

Deno.test("convertToGregorian - handles ordinal suffixes (2nd, 3rd, etc)", () => {
  assertEquals(EorzeanCalendarService.convertToGregorian("2nd Sun of the 2nd Umbral Moon"), "2nd April");
  assertEquals(EorzeanCalendarService.convertToGregorian("3rd Sun of the 3rd Astral Moon"), "3rd May");
});

Deno.test("convertToGregorian - returns null for invalid format", () => {
  assertEquals(EorzeanCalendarService.convertToGregorian("not a valid nameday"), null);
});

Deno.test("convertToGregorian - returns null for empty string", () => {
  assertEquals(EorzeanCalendarService.convertToGregorian(""), null);
});

Deno.test("convertToGregorian - handles day suffix: 11th, 12th, 13th are 'th'", () => {
  const result = EorzeanCalendarService.convertToGregorian("11th Sun of the 1st Astral Moon");
  assertEquals(result, "11th January");
});

Deno.test("convertToGregorian - 21st Sun of the 5th Astral Moon -> 20th September", () => {
  assertEquals(EorzeanCalendarService.convertToGregorian("21st Sun of the 5th Astral Moon"), "20th September");
});

Deno.test("convertToGregorian - case insensitive moon type", () => {
  assertEquals(EorzeanCalendarService.convertToGregorian("1st Sun of the 1st astral Moon"), "1st January");
});
