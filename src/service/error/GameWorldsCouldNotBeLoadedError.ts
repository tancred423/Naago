export class GameWorldsCouldNotBeLoadedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GameWorldsCouldNotBeLoadedError";
  }
}
