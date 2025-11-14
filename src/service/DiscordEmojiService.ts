import { EmojiCouldNotBeFetchedError } from "./error/EmojiCouldNotBeFetchedError.ts";
import { EmojiCouldNotBeParsedError } from "./error/EmojiCouldNotBeParsedError.ts";
import { EmojiData } from "./type/EmojiData.ts";
import { EmojiName } from "./type/EmojiName.ts";

export class DiscordEmojiService {
  public static getAsEmojiData(name: EmojiName): EmojiData {
    const emojiMarkdown = Deno.env.get(name);
    if (!emojiMarkdown) {
      throw new EmojiCouldNotBeFetchedError(name);
    }

    const match = emojiMarkdown.match(/^<(a?):([^:]+):(\d+)>$/);
    if (!match) {
      throw new EmojiCouldNotBeParsedError(name);
    }

    const [, animatedFlag, emojiName, emojiId] = match;

    return {
      id: emojiId,
      name: emojiName,
      animated: animatedFlag === "a",
    };
  }

  public static getAsMarkdown(name: EmojiName): string {
    const emojiMarkdown = Deno.env.get(name);
    if (!emojiMarkdown) throw new EmojiCouldNotBeFetchedError(name);
    return emojiMarkdown;
  }
}
