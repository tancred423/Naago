import { assertEquals } from "@std/assert";
import { DateHelper } from "../../src/helper/DateHelper.ts";

Deno.test("DateHelper.setUtcTime - sets hours, minutes, seconds, ms", () => {
  const base = new Date("2025-03-10T14:22:33.444Z");
  const result = DateHelper.setUtcTime(base, 8, 0, 0, 0);
  assertEquals(result.getUTCHours(), 8);
  assertEquals(result.getUTCMinutes(), 0);
  assertEquals(result.getUTCSeconds(), 0);
  assertEquals(result.getUTCMilliseconds(), 0);
  assertEquals(result.getUTCDate(), 10);
});

Deno.test("DateHelper.setUtcTime - does not mutate the original date", () => {
  const base = new Date("2025-03-10T14:22:33.444Z");
  DateHelper.setUtcTime(base, 8);
  assertEquals(base.getUTCHours(), 14);
});

Deno.test("DateHelper.setUtcDayOfWeek - sets day forward within the same week", () => {
  const monday = new Date("2025-03-10T12:00:00Z");
  assertEquals(monday.getUTCDay(), 1);
  const friday = DateHelper.setUtcDayOfWeek(monday, 5, 8);
  assertEquals(friday.getUTCDay(), 5);
  assertEquals(friday.getUTCHours(), 8);
  assertEquals(friday.getUTCDate(), 14);
});

Deno.test("DateHelper.setUtcDayOfWeek - sets day backward within the same week", () => {
  const friday = new Date("2025-03-14T12:00:00Z");
  assertEquals(friday.getUTCDay(), 5);
  const tuesday = DateHelper.setUtcDayOfWeek(friday, 2, 8);
  assertEquals(tuesday.getUTCDay(), 2);
  assertEquals(tuesday.getUTCDate(), 11);
});

Deno.test("DateHelper.setUtcDayOfWeek - does not mutate the original date", () => {
  const monday = new Date("2025-03-10T12:00:00Z");
  DateHelper.setUtcDayOfWeek(monday, 5, 8);
  assertEquals(monday.getUTCDay(), 1);
  assertEquals(monday.getUTCDate(), 10);
});

Deno.test("DateHelper.addDays - adds positive days", () => {
  const base = new Date("2025-03-10T10:00:00Z");
  const result = DateHelper.addDays(base, 3);
  assertEquals(result.getUTCDate(), 13);
  assertEquals(result.getUTCHours(), 10);
});

Deno.test("DateHelper.addDays - handles month boundary", () => {
  const base = new Date("2025-03-30T10:00:00Z");
  const result = DateHelper.addDays(base, 3);
  assertEquals(result.getUTCMonth(), 3);
  assertEquals(result.getUTCDate(), 2);
});

Deno.test("DateHelper.addWeeks - adds weeks correctly", () => {
  const base = new Date("2025-03-10T10:00:00Z");
  const result = DateHelper.addWeeks(base, 2);
  assertEquals(result.getUTCDate(), 24);
});

Deno.test("DateHelper.addMilliseconds - adds milliseconds", () => {
  const base = new Date("2025-03-10T10:00:00Z");
  const result = DateHelper.addMilliseconds(base, 5000);
  assertEquals(result.getUTCSeconds(), 5);
});

Deno.test("DateHelper.subtractMinutes - subtracts minutes correctly", () => {
  const base = new Date("2025-03-10T10:30:00Z");
  const result = DateHelper.subtractMinutes(base, 10);
  assertEquals(result.getUTCHours(), 10);
  assertEquals(result.getUTCMinutes(), 20);
});

Deno.test("DateHelper.subtractMinutes - crosses hour boundary", () => {
  const base = new Date("2025-03-10T10:05:00Z");
  const result = DateHelper.subtractMinutes(base, 10);
  assertEquals(result.getUTCHours(), 9);
  assertEquals(result.getUTCMinutes(), 55);
});

Deno.test("DateHelper.subtractMinutes - does not mutate the original date", () => {
  const base = new Date("2025-03-10T10:30:00Z");
  DateHelper.subtractMinutes(base, 10);
  assertEquals(base.getUTCMinutes(), 30);
});

Deno.test("DateHelper.formatLog - formats date with timezone offset", () => {
  const result = DateHelper.formatLog(new Date("2025-03-10T10:30:45.123Z"));
  assertEquals(result.length > 0, true);
  assertEquals(result.includes("2025"), true);
  assertEquals(result.includes(".123"), true);
});

Deno.test("DateHelper.formatOrdinalDate - formats with ordinal suffix", () => {
  assertEquals(DateHelper.formatOrdinalDate(new Date("2025-01-01T00:00:00Z")), "1st Jan 2025");
  assertEquals(DateHelper.formatOrdinalDate(new Date("2025-01-02T00:00:00Z")), "2nd Jan 2025");
  assertEquals(DateHelper.formatOrdinalDate(new Date("2025-01-03T00:00:00Z")), "3rd Jan 2025");
  assertEquals(DateHelper.formatOrdinalDate(new Date("2025-01-04T00:00:00Z")), "4th Jan 2025");
  assertEquals(DateHelper.formatOrdinalDate(new Date("2025-01-11T00:00:00Z")), "11th Jan 2025");
  assertEquals(DateHelper.formatOrdinalDate(new Date("2025-01-21T00:00:00Z")), "21st Jan 2025");
  assertEquals(DateHelper.formatOrdinalDate(new Date("2025-01-22T00:00:00Z")), "22nd Jan 2025");
  assertEquals(DateHelper.formatOrdinalDate(new Date("2025-06-15T00:00:00Z")), "15th Jun 2025");
  assertEquals(DateHelper.formatOrdinalDate(new Date("2025-12-31T00:00:00Z")), "31st Dec 2025");
});

Deno.test("DateHelper.formatMediumDate - formats as MMM D, YYYY", () => {
  assertEquals(DateHelper.formatMediumDate(new Date("2025-01-01T00:00:00Z")), "Jan 1, 2025");
  assertEquals(DateHelper.formatMediumDate(new Date("2025-06-15T12:00:00Z")), "Jun 15, 2025");
  assertEquals(DateHelper.formatMediumDate(new Date("2025-12-31T23:59:59Z")), "Dec 31, 2025");
});

Deno.test("DateHelper.toEpochSeconds - converts to seconds", () => {
  const date = new Date("2025-01-01T00:00:00Z");
  assertEquals(DateHelper.toEpochSeconds(date), 1735689600);
});
