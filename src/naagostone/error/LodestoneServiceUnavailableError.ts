export class LodestoneServiceUnavailableError extends Error {
  constructor() {
    super("Lodestone service is currently unavailable. Please try again later.");
    this.name = "LodestoneServiceUnavailableError";
  }
}
