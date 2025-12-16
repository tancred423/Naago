import { Moment } from "moment";
import { Character } from "../../naagostone/type/CharacterTypes.ts";

export class CharacterDataDto {
  public latestUpdate: Moment;
  public character: Character;
  public isCachedDueToUnavailability: boolean;

  constructor(latestUpdate: Moment, character: Character, isCachedDueToUnavailability: boolean = false) {
    this.latestUpdate = latestUpdate;
    this.character = character;
    this.isCachedDueToUnavailability = isCachedDueToUnavailability;
  }
}
