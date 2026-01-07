import * as log from "@std/log";

export type FilterPattern =
  | { type: "keyword"; value: string }
  | { type: "regex"; pattern: RegExp; original: string }
  | { type: "invalid"; original: string; error: string };

export interface ParseResult {
  patterns: FilterPattern[];
  warnings: string[];
}

const DANGEROUS_PATTERNS = [
  // Nested quantifiers
  /\([^)]*[+*][^)]*\)[+*]/,
  // Ambiguous alternation with repetition
  /\([^)]*\|[^)]*\)[+*]/,
  // Dangerous dot quantifiers
  /\.{2,}[+*]/,
  // Variable-length lookbehinds only
  /\(\?<=[^)]*[+*]|\(\?<![^)]*[+*]/,
];

const MAX_REGEX_LENGTH = 200;

export class FilterExpressionService {
  public static parseFilterString(input: string | null | undefined): ParseResult {
    if (!input) {
      return { patterns: [], warnings: [] };
    }

    const patterns: FilterPattern[] = [];
    const warnings: string[] = [];

    const parts = input.split(",").map((p) => p.trim()).filter((p) => p.length > 0);

    for (const part of parts) {
      const regexMatch = part.match(/^\/(.+)\/([gimsuy]*)$/);

      if (regexMatch) {
        const [, regexBody, flags] = regexMatch;
        const validation = this.validateRegexPattern(regexBody);

        if (!validation.valid) {
          patterns.push({ type: "invalid", original: part, error: validation.error! });
          warnings.push(`Invalid regex \`${part}\`: ${validation.error}`);
          continue;
        }

        try {
          const regex = new RegExp(regexBody, flags);
          patterns.push({ type: "regex", pattern: regex, original: part });
        } catch (error: unknown) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          patterns.push({ type: "invalid", original: part, error: errorMsg });
          warnings.push(`Invalid regex \`${part}\`: ${errorMsg}`);
        }
      } else {
        patterns.push({ type: "keyword", value: part.toLowerCase() });
      }
    }

    return { patterns, warnings };
  }

  private static validateRegexPattern(pattern: string): { valid: boolean; error?: string } {
    if (pattern.length > MAX_REGEX_LENGTH) {
      return { valid: false, error: `Pattern too long (max ${MAX_REGEX_LENGTH} chars)` };
    }

    if (pattern.length === 0) {
      return { valid: false, error: "Empty pattern" };
    }

    for (const dangerous of DANGEROUS_PATTERNS) {
      if (dangerous.test(pattern)) {
        return {
          valid: false,
          error: "Pattern contains potentially dangerous constructs (nested quantifiers or alternations)",
        };
      }
    }

    try {
      new RegExp(pattern);
    } catch (error: unknown) {
      return { valid: false, error: error instanceof Error ? error.message : String(error) };
    }

    return { valid: true };
  }

  public static isBlacklisted(content: string, patterns: FilterPattern[]): boolean {
    if (patterns.length === 0) return false;

    const lowerContent = content.toLowerCase();

    for (const pattern of patterns) {
      if (pattern.type === "invalid") {
        continue;
      }

      if (pattern.type === "keyword") {
        if (lowerContent.includes(pattern.value)) {
          return true;
        }
      } else if (pattern.type === "regex") {
        try {
          if (pattern.pattern.test(content)) {
            return true;
          }
        } catch (error: unknown) {
          log.warn(
            `[FILTER] Regex execution failed for pattern ${pattern.original}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      }
    }

    return false;
  }

  public static getValidPatternCount(patterns: FilterPattern[]): number {
    return patterns.filter((p) => p.type !== "invalid").length;
  }

  public static formatPatternsForDisplay(patterns: FilterPattern[]): string {
    const parts: string[] = [];

    const keywords = patterns.filter((p) => p.type === "keyword");
    const regexes = patterns.filter((p) => p.type === "regex");
    const invalid = patterns.filter((p) => p.type === "invalid");

    if (keywords.length > 0) {
      parts.push(`${keywords.length} keyword${keywords.length !== 1 ? "s" : ""}`);
    }
    if (regexes.length > 0) {
      parts.push(`${regexes.length} regex${regexes.length !== 1 ? "es" : ""}`);
    }
    if (invalid.length > 0) {
      parts.push(`${invalid.length} invalid`);
    }

    return parts.join(", ");
  }
}
