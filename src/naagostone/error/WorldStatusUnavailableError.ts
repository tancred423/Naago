import { LodestoneServiceUnavailableError } from "./LodestoneServiceUnavailableError.ts";

export class WorldStatusUnavailableError extends LodestoneServiceUnavailableError {
  constructor() {
    super();
    this.message = "Lodestone world status service is currently unavailable. Please try again later.";
    this.name = "WorldStatusUnavailableError";
  }
}
