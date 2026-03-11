import { assertEquals } from "@std/assert";
import { WhenIsResetCommandHelper } from "../../src/helper/WhenIsResetCommandHelper.ts";

Deno.test("getNextDailyReset - before 15:00 UTC returns same day", () => {
  const now = new Date("2025-03-10T10:00:00Z");
  const result = WhenIsResetCommandHelper.getNextDailyReset(now);
  assertEquals(result.getUTCDate(), 10);
  assertEquals(result.getUTCHours(), 15);
  assertEquals(result.getUTCMinutes(), 0);
});

Deno.test("getNextDailyReset - after 15:00 UTC returns next day", () => {
  const now = new Date("2025-03-10T16:00:00Z");
  const result = WhenIsResetCommandHelper.getNextDailyReset(now);
  assertEquals(result.getUTCDate(), 11);
  assertEquals(result.getUTCHours(), 15);
});

Deno.test("getNextDailyReset - exactly at 15:00 UTC returns next day", () => {
  const now = new Date("2025-03-10T15:00:00Z");
  const result = WhenIsResetCommandHelper.getNextDailyReset(now);
  assertEquals(result.getUTCDate(), 11);
  assertEquals(result.getUTCHours(), 15);
});

Deno.test("getNextGcReset - before 20:00 UTC returns same day", () => {
  const now = new Date("2025-03-10T18:00:00Z");
  const result = WhenIsResetCommandHelper.getNextGcReset(now);
  assertEquals(result.getUTCDate(), 10);
  assertEquals(result.getUTCHours(), 20);
});

Deno.test("getNextGcReset - after 20:00 UTC returns next day", () => {
  const now = new Date("2025-03-10T21:00:00Z");
  const result = WhenIsResetCommandHelper.getNextGcReset(now);
  assertEquals(result.getUTCDate(), 11);
  assertEquals(result.getUTCHours(), 20);
});

Deno.test("getNextWeeklyReset - on Monday returns Tuesday 08:00", () => {
  const monday = new Date("2025-03-10T10:00:00Z");
  assertEquals(monday.getUTCDay(), 1);
  const result = WhenIsResetCommandHelper.getNextWeeklyReset(monday);
  assertEquals(result.getUTCDay(), 2);
  assertEquals(result.getUTCHours(), 8);
  assertEquals(result.getUTCDate(), 11);
});

Deno.test("getNextWeeklyReset - on Tuesday after 08:00 returns next Tuesday", () => {
  const tuesday = new Date("2025-03-11T10:00:00Z");
  assertEquals(tuesday.getUTCDay(), 2);
  const result = WhenIsResetCommandHelper.getNextWeeklyReset(tuesday);
  assertEquals(result.getUTCDay(), 2);
  assertEquals(result.getUTCDate(), 18);
  assertEquals(result.getUTCHours(), 8);
});

Deno.test("getNextWeeklyReset - on Wednesday returns next Tuesday", () => {
  const wednesday = new Date("2025-03-12T10:00:00Z");
  assertEquals(wednesday.getUTCDay(), 3);
  const result = WhenIsResetCommandHelper.getNextWeeklyReset(wednesday);
  assertEquals(result.getUTCDay(), 2);
  assertEquals(result.getUTCDate(), 18);
});

Deno.test("getNextFashionReport - on Thursday returns Friday 08:00", () => {
  const thursday = new Date("2025-03-13T10:00:00Z");
  assertEquals(thursday.getUTCDay(), 4);
  const result = WhenIsResetCommandHelper.getNextFashionReport(thursday);
  assertEquals(result.getUTCDay(), 5);
  assertEquals(result.getUTCHours(), 8);
  assertEquals(result.getUTCDate(), 14);
});

Deno.test("getNextFashionReport - on Friday after 08:00 returns next Friday", () => {
  const friday = new Date("2025-03-14T10:00:00Z");
  assertEquals(friday.getUTCDay(), 5);
  const result = WhenIsResetCommandHelper.getNextFashionReport(friday);
  assertEquals(result.getUTCDay(), 5);
  assertEquals(result.getUTCDate(), 21);
});

Deno.test("getNextJumboCactpot - on Friday returns Saturday 20:00", () => {
  const friday = new Date("2025-03-14T10:00:00Z");
  const result = WhenIsResetCommandHelper.getNextJumboCactpot(friday);
  assertEquals(result.getUTCDay(), 6);
  assertEquals(result.getUTCHours(), 20);
  assertEquals(result.getUTCDate(), 15);
});

Deno.test("getNextJumboCactpot - on Saturday after 20:00 returns next Saturday", () => {
  const saturday = new Date("2025-03-15T21:00:00Z");
  assertEquals(saturday.getUTCDay(), 6);
  const result = WhenIsResetCommandHelper.getNextJumboCactpot(saturday);
  assertEquals(result.getUTCDay(), 6);
  assertEquals(result.getUTCDate(), 22);
});

Deno.test("getNextLevequestAllowance - before noon returns today noon", () => {
  const now = new Date("2025-03-10T08:00:00Z");
  const result = WhenIsResetCommandHelper.getNextLevequestAllowance(now);
  assertEquals(result.getUTCDate(), 10);
  assertEquals(result.getUTCHours(), 12);
});

Deno.test("getNextLevequestAllowance - after noon before midnight returns tomorrow midnight", () => {
  const now = new Date("2025-03-10T15:00:00Z");
  const result = WhenIsResetCommandHelper.getNextLevequestAllowance(now);
  assertEquals(result.getUTCDate(), 11);
  assertEquals(result.getUTCHours(), 0);
});

Deno.test("getNextCosmicExploration - before 09:00 returns same day", () => {
  const now = new Date("2025-03-10T07:00:00Z");
  const result = WhenIsResetCommandHelper.getNextCosmicExploration(now);
  assertEquals(result.getUTCDate(), 10);
  assertEquals(result.getUTCHours(), 9);
});

Deno.test("getNextCosmicExploration - after 09:00 returns next day", () => {
  const now = new Date("2025-03-10T10:00:00Z");
  const result = WhenIsResetCommandHelper.getNextCosmicExploration(now);
  assertEquals(result.getUTCDate(), 11);
  assertEquals(result.getUTCHours(), 9);
});
