import { assertEquals } from "@std/assert";
import type { ProfilePageButton } from "../../../src/helper/type/ProfilePageButtonTypes.ts";

Deno.test("ProfilePageButton - accepts all valid button names", () => {
  const validButtons: ProfilePageButton[] = [
    "profile",
    "battlejobs",
    "craftersgatherers",
    "equipment",
    "materiadetails",
    "attributes",
    "raidprogression",
    "portrait",
  ];
  assertEquals(validButtons.length, 8);
});
