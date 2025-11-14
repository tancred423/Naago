import { randomBytes } from "node:crypto";
import { DiscordEmojiService } from "./DiscordEmojiService.ts";

export class StringManipulationService {
  public static formatName(name: string): string {
    const nameSplit = name.split(" ");
    if (nameSplit.length !== 2) return name;

    const firstName = nameSplit[0];
    const lastName = nameSplit[1];

    const firstNameFormatted = firstName.substring(0, 1).toUpperCase() + firstName.substring(1).toLowerCase();
    const lastNameFormatted = lastName.substring(0, 1).toUpperCase() + lastName.substring(1).toLowerCase();

    return `${firstNameFormatted} ${lastNameFormatted}`;
  }

  public static generateVerificationCode(): string {
    return `naago-${randomBytes(3).toString("hex")}`;
  }

  public static capitalizeFirstLetter(string: string): string {
    return (string.substring(0, 1).toUpperCase() + string.substring(1).toLowerCase());
  }

  public static convertTag(category: string, tag: string | null): string {
    return tag
      ? StringManipulationService.capitalizeFirstLetter(category) +
        ": " +
        tag.replaceAll("[", "").replaceAll("]", "")
      : StringManipulationService.capitalizeFirstLetter(category);
  }

  public static buildLoadingText(message: string): string {
    return DiscordEmojiService.getAsMarkdown("EMOJI_LOADING") + "  " + message;
  }
}
