export class WorldStatusUnavailableError extends Error {
  constructor() {
    super("World status service is currently unavailable. Please try again later.");
    this.name = "WorldStatusUnavailableError";
  }
}
