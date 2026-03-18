import { Character } from "../../naagostone/type/CharacterTypes.ts";

export class CharacterDataDto {
  public latestUpdate: Date;
  public character: Character;
  public isCachedDueToUnavailability: boolean;

  constructor(latestUpdate: Date, character: Character, isCachedDueToUnavailability: boolean = false) {
    this.latestUpdate = latestUpdate;
    this.character = character;
    this.isCachedDueToUnavailability = isCachedDueToUnavailability;
  }
}
