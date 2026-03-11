import { assertEquals } from "@std/assert";
import { CharacterDataDto } from "../../../src/naagostone/dto/CharacterDataDto.ts";
import type { Character } from "../../../src/naagostone/type/CharacterTypes.ts";

const mockCharacter = { id: 12345, name: "Test Character" } as unknown as Character;

Deno.test("CharacterDataDto - stores latestUpdate and character", () => {
  const now = new Date();
  const dto = new CharacterDataDto(now, mockCharacter);
  assertEquals(dto.latestUpdate, now);
  assertEquals(dto.character, mockCharacter);
  assertEquals(dto.isCachedDueToUnavailability, false);
});

Deno.test("CharacterDataDto - isCachedDueToUnavailability defaults to false", () => {
  const dto = new CharacterDataDto(new Date(), mockCharacter);
  assertEquals(dto.isCachedDueToUnavailability, false);
});

Deno.test("CharacterDataDto - isCachedDueToUnavailability can be set to true", () => {
  const dto = new CharacterDataDto(new Date(), mockCharacter, true);
  assertEquals(dto.isCachedDueToUnavailability, true);
});
