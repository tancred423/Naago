import { GameWorldsCouldNotBeLoadedError } from "./error/GameWorldsCouldNotBeLoadedError.ts";

export class FfxivServerValidationService {
  static isValidServer(server: string): boolean {
    const data = Deno.env.get("GAME_WORLDS");

    if (!data) {
      throw new GameWorldsCouldNotBeLoadedError(
        "Failed to load env var GAME_WORLDS",
      );
    }

    return data.includes(server.toLowerCase());
  }
}
