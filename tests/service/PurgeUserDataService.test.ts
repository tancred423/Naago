import { assertSpyCalls, stub } from "@std/testing/mock";
import { FavoritesRepository } from "../../src/database/repository/FavoritesRepository.ts";
import { ProfilePagesRepository } from "../../src/database/repository/ProfilePagesRepository.ts";
import { ThemeRepository } from "../../src/database/repository/ThemeRepository.ts";
import { VerificationsRepository } from "../../src/database/repository/VerificationsRepository.ts";
import { PurgeUserDataService } from "../../src/service/PurgeUserDataService.ts";

Deno.test("purgeUser - calls all four repository delete methods", async () => {
  const favStub = stub(FavoritesRepository, "deleteAll", () => Promise.resolve());
  const profileStub = stub(ProfilePagesRepository, "delete", () => Promise.resolve());
  const themeStub = stub(ThemeRepository, "delete", () => Promise.resolve());
  const verifyStub = stub(VerificationsRepository, "delete", () => Promise.resolve());

  try {
    await PurgeUserDataService.purgeUser("user123", 456);

    assertSpyCalls(favStub, 1);
    assertSpyCalls(profileStub, 1);
    assertSpyCalls(themeStub, 1);
    assertSpyCalls(verifyStub, 1);
  } finally {
    favStub.restore();
    profileStub.restore();
    themeStub.restore();
    verifyStub.restore();
  }
});

Deno.test("purgeUser - passes correct arguments to repositories", async () => {
  const favStub = stub(FavoritesRepository, "deleteAll", () => Promise.resolve());
  const profileStub = stub(ProfilePagesRepository, "delete", () => Promise.resolve());
  const themeStub = stub(ThemeRepository, "delete", () => Promise.resolve());
  const verifyStub = stub(VerificationsRepository, "delete", () => Promise.resolve());

  try {
    await PurgeUserDataService.purgeUser("user789", 101);

    const favArgs = favStub.calls[0].args;
    const profileArgs = profileStub.calls[0].args;
    const themeArgs = themeStub.calls[0].args;
    const verifyArgs = verifyStub.calls[0].args;

    if (favArgs[0] !== "user789") throw new Error("FavoritesRepository.deleteAll called with wrong userId");
    if (profileArgs[0] !== "user789") throw new Error("ProfilePagesRepository.delete called with wrong userId");
    if (themeArgs[0] !== "user789") throw new Error("ThemeRepository.delete called with wrong userId");
    if (verifyArgs[0] !== "user789") throw new Error("VerificationsRepository.delete called with wrong userId");
    if (verifyArgs[1] !== 101) throw new Error("VerificationsRepository.delete called with wrong characterId");
  } finally {
    favStub.restore();
    profileStub.restore();
    themeStub.restore();
    verifyStub.restore();
  }
});
