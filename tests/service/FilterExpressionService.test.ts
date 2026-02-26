import { assertEquals } from "@std/assert";
import { FilterExpressionService, type FilterPattern } from "../../src/service/FilterExpressionService.ts";

Deno.test("parseFilterString - returns empty for null input", () => {
  const result = FilterExpressionService.parseFilterString(null);
  assertEquals(result.patterns.length, 0);
  assertEquals(result.warnings.length, 0);
});

Deno.test("parseFilterString - returns empty for undefined input", () => {
  const result = FilterExpressionService.parseFilterString(undefined);
  assertEquals(result.patterns.length, 0);
});

Deno.test("parseFilterString - returns empty for empty string", () => {
  const result = FilterExpressionService.parseFilterString("");
  assertEquals(result.patterns.length, 0);
});

Deno.test("parseFilterString - parses plain keywords", () => {
  const result = FilterExpressionService.parseFilterString("spam, ads, scam");
  assertEquals(result.patterns.length, 3);
  assertEquals(result.patterns[0].type, "keyword");
  if (result.patterns[0].type === "keyword") {
    assertEquals(result.patterns[0].value, "spam");
  }
});

Deno.test("parseFilterString - lowercases keyword values", () => {
  const result = FilterExpressionService.parseFilterString("SPAM");
  assertEquals(result.patterns.length, 1);
  if (result.patterns[0].type === "keyword") {
    assertEquals(result.patterns[0].value, "spam");
  }
});

Deno.test("parseFilterString - parses valid regex patterns", () => {
  const result = FilterExpressionService.parseFilterString("/test\\d+/i");
  assertEquals(result.patterns.length, 1);
  assertEquals(result.patterns[0].type, "regex");
});

Deno.test("parseFilterString - marks invalid regex as invalid", () => {
  const result = FilterExpressionService.parseFilterString("/[invalid/");
  assertEquals(result.patterns.length, 1);
  assertEquals(result.patterns[0].type, "invalid");
  assertEquals(result.warnings.length, 1);
});

Deno.test("parseFilterString - handles mix of keywords and regexes", () => {
  const result = FilterExpressionService.parseFilterString("spam, /\\d{3}/, ads");
  assertEquals(result.patterns.length, 3);
  assertEquals(result.patterns[0].type, "keyword");
  assertEquals(result.patterns[1].type, "regex");
  assertEquals(result.patterns[2].type, "keyword");
});

Deno.test("parseFilterString - rejects dangerous nested quantifier patterns", () => {
  const result = FilterExpressionService.parseFilterString("/(a+)+/");
  assertEquals(result.patterns[0].type, "invalid");
});

Deno.test("parseFilterString - trims whitespace from parts", () => {
  const result = FilterExpressionService.parseFilterString("  spam  ,  ads  ");
  assertEquals(result.patterns.length, 2);
  if (result.patterns[0].type === "keyword") {
    assertEquals(result.patterns[0].value, "spam");
  }
});

Deno.test("isBlacklisted - returns false for empty patterns", () => {
  assertEquals(FilterExpressionService.isBlacklisted("anything", []), false);
});

Deno.test("isBlacklisted - matches keyword case-insensitively", () => {
  const patterns: FilterPattern[] = [{ type: "keyword", value: "spam" }];
  assertEquals(FilterExpressionService.isBlacklisted("This is SPAM content", patterns), true);
});

Deno.test("isBlacklisted - returns false when no keyword matches", () => {
  const patterns: FilterPattern[] = [{ type: "keyword", value: "spam" }];
  assertEquals(FilterExpressionService.isBlacklisted("clean content", patterns), false);
});

Deno.test("isBlacklisted - matches regex patterns", () => {
  const patterns: FilterPattern[] = [{ type: "regex", pattern: /\d{3}-\d{4}/, original: "/\\d{3}-\\d{4}/" }];
  assertEquals(FilterExpressionService.isBlacklisted("Call 555-1234", patterns), true);
});

Deno.test("isBlacklisted - skips invalid patterns", () => {
  const patterns: FilterPattern[] = [{ type: "invalid", original: "/bad/", error: "broken" }];
  assertEquals(FilterExpressionService.isBlacklisted("anything", patterns), false);
});

Deno.test("getValidPatternCount - counts only non-invalid patterns", () => {
  const patterns: FilterPattern[] = [
    { type: "keyword", value: "a" },
    { type: "regex", pattern: /x/, original: "/x/" },
    { type: "invalid", original: "/bad/", error: "err" },
  ];
  assertEquals(FilterExpressionService.getValidPatternCount(patterns), 2);
});

Deno.test("getValidPatternCount - returns 0 for empty array", () => {
  assertEquals(FilterExpressionService.getValidPatternCount([]), 0);
});

Deno.test("formatPatternsForDisplay - formats counts correctly", () => {
  const patterns: FilterPattern[] = [
    { type: "keyword", value: "a" },
    { type: "keyword", value: "b" },
    { type: "regex", pattern: /x/, original: "/x/" },
    { type: "invalid", original: "/bad/", error: "err" },
  ];
  assertEquals(FilterExpressionService.formatPatternsForDisplay(patterns), "2 keywords, 1 regex, 1 invalid");
});

Deno.test("formatPatternsForDisplay - uses singular forms", () => {
  const patterns: FilterPattern[] = [{ type: "keyword", value: "a" }];
  assertEquals(FilterExpressionService.formatPatternsForDisplay(patterns), "1 keyword");
});

Deno.test("formatPatternsForDisplay - returns empty string for no patterns", () => {
  assertEquals(FilterExpressionService.formatPatternsForDisplay([]), "");
});

Deno.test("formatPatternsForDisplay - pluralizes regexes", () => {
  const patterns: FilterPattern[] = [
    { type: "regex", pattern: /a/, original: "/a/" },
    { type: "regex", pattern: /b/, original: "/b/" },
  ];
  assertEquals(FilterExpressionService.formatPatternsForDisplay(patterns), "2 regexes");
});
