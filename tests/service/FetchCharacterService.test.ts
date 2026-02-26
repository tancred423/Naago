import { assertEquals } from "@std/assert";
import { assertSpyCalls, stub } from "@std/testing/mock";
import { FetchCharacterService } from "../../src/service/FetchCharacterService.ts";
import { CharacterDataRepository } from "../../src/database/repository/CharacterDataRepository.ts";
import { VerificationsRepository } from "../../src/database/repository/VerificationsRepository.ts";
import { NaagostoneApiService } from "../../src/naagostone/service/NaagostoneApiService.ts";
import { StringManipulationService } from "../../src/service/StringManipulationService.ts";
import { LodestoneServiceUnavailableError } from "../../src/naagostone/error/LodestoneServiceUnavailableError.ts";

function makeFakeInteraction() {
  return {
    editReply: () => Promise.resolve(),
  } as unknown as Parameters<typeof FetchCharacterService.fetchCharacterCached>[0];
}

function makeCharacterData(latestUpdate: string | Date, jsonString: string) {
  return {
    characterId: 12345,
    latestUpdate: latestUpdate instanceof Date ? latestUpdate : new Date(latestUpdate),
    jsonString,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function makeVerification(userId: string, characterId: number) {
  return {
    userId,
    characterId,
    verificationCode: "naago-abc123",
    isVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

Deno.test("fetchCharacterCached - returns cached character when fresh", async () => {
  const recentDate = new Date();
  const characterJson = JSON.stringify({ name: "Test Char" });

  const findStub = stub(
    CharacterDataRepository,
    "find",
    () => Promise.resolve(makeCharacterData(recentDate, characterJson)),
  );

  try {
    const result = await FetchCharacterService.fetchCharacterCached(makeFakeInteraction(), 12345);
    assertEquals(result?.character.name, "Test Char");
    assertEquals(result?.isCachedDueToUnavailability, false);
  } finally {
    findStub.restore();
  }
});

Deno.test("fetchCharacterCached - fetches from API when cache is stale", async () => {
  const oldDate = new Date(Date.now() - 20 * 60 * 1000);
  const characterJson = JSON.stringify({ name: "Old Data" });
  const newCharacter = { name: "New Data" };

  const findStub = stub(
    CharacterDataRepository,
    "find",
    () => Promise.resolve(makeCharacterData(oldDate, characterJson)),
  );
  const fetchStub = stub(
    NaagostoneApiService,
    "fetchCharacterById",
    () =>
      Promise.resolve(
        newCharacter as ReturnType<typeof NaagostoneApiService.fetchCharacterById> extends Promise<infer T> ? T : never,
      ),
  );
  const setStub = stub(CharacterDataRepository, "set", () => Promise.resolve());
  const loadingStub = stub(StringManipulationService, "buildLoadingText", () => "Loading...");

  try {
    const result = await FetchCharacterService.fetchCharacterCached(makeFakeInteraction(), 12345);
    assertEquals(result?.character.name, "New Data");
    assertSpyCalls(fetchStub, 1);
    assertSpyCalls(setStub, 1);
  } finally {
    findStub.restore();
    fetchStub.restore();
    setStub.restore();
    loadingStub.restore();
  }
});

Deno.test("fetchCharacterCached - fetches from API when no cache exists", async () => {
  const newCharacter = { name: "Fresh" };

  const findStub = stub(CharacterDataRepository, "find", () => Promise.resolve(null));
  const fetchStub = stub(
    NaagostoneApiService,
    "fetchCharacterById",
    () =>
      Promise.resolve(
        newCharacter as ReturnType<typeof NaagostoneApiService.fetchCharacterById> extends Promise<infer T> ? T : never,
      ),
  );
  const setStub = stub(CharacterDataRepository, "set", () => Promise.resolve());
  const loadingStub = stub(StringManipulationService, "buildLoadingText", () => "Loading...");

  try {
    const result = await FetchCharacterService.fetchCharacterCached(makeFakeInteraction(), 99999);
    assertEquals(result?.character.name, "Fresh");
  } finally {
    findStub.restore();
    fetchStub.restore();
    setStub.restore();
    loadingStub.restore();
  }
});

Deno.test("fetchCharacterCached - returns null when API returns null", async () => {
  const findStub = stub(CharacterDataRepository, "find", () => Promise.resolve(null));
  const fetchStub = stub(NaagostoneApiService, "fetchCharacterById", () => Promise.resolve(null));
  const loadingStub = stub(StringManipulationService, "buildLoadingText", () => "Loading...");

  try {
    const result = await FetchCharacterService.fetchCharacterCached(makeFakeInteraction(), 99999);
    assertEquals(result, null);
  } finally {
    findStub.restore();
    fetchStub.restore();
    loadingStub.restore();
  }
});

Deno.test("fetchCharacterCached - falls back to cache on LodestoneServiceUnavailableError", async () => {
  const cachedDate = new Date(Date.now() - 20 * 60 * 1000);
  const characterJson = JSON.stringify({ name: "Cached Fallback" });

  let findCallCount = 0;
  const findStub = stub(CharacterDataRepository, "find", () => {
    findCallCount++;
    return Promise.resolve(makeCharacterData(cachedDate, characterJson));
  });
  const fetchStub = stub(NaagostoneApiService, "fetchCharacterById", () => {
    throw new LodestoneServiceUnavailableError();
  });
  const loadingStub = stub(StringManipulationService, "buildLoadingText", () => "Loading...");

  try {
    const result = await FetchCharacterService.fetchCharacterCached(makeFakeInteraction(), 12345);
    assertEquals(result?.character.name, "Cached Fallback");
    assertEquals(result?.isCachedDueToUnavailability, true);
  } finally {
    findStub.restore();
    fetchStub.restore();
    loadingStub.restore();
  }
});

Deno.test("fetchVerifiedCharacterCachedByUserId - returns null when user not verified", async () => {
  const verifyStub = stub(VerificationsRepository, "find", () => Promise.resolve(null));

  try {
    const result = await FetchCharacterService.fetchVerifiedCharacterCachedByUserId(
      makeFakeInteraction() as Parameters<typeof FetchCharacterService.fetchVerifiedCharacterCachedByUserId>[0],
      "user123",
    );
    assertEquals(result, null);
  } finally {
    verifyStub.restore();
  }
});

Deno.test("fetchVerifiedCharacterCachedByUserId - fetches character for verified user", async () => {
  const recentDate = new Date();
  const characterJson = JSON.stringify({ name: "Verified Char" });

  const verifyStub = stub(VerificationsRepository, "find", () => Promise.resolve(makeVerification("user123", 555)));
  const findStub = stub(
    CharacterDataRepository,
    "find",
    () => Promise.resolve(makeCharacterData(recentDate, characterJson)),
  );

  try {
    const result = await FetchCharacterService.fetchVerifiedCharacterCachedByUserId(
      makeFakeInteraction() as Parameters<typeof FetchCharacterService.fetchVerifiedCharacterCachedByUserId>[0],
      "user123",
    );
    assertEquals(result?.character.name, "Verified Char");
  } finally {
    verifyStub.restore();
    findStub.restore();
  }
});
