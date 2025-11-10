export class EmojiCouldNotBeParsedError extends Error {
  constructor(name: string) {
    super(name);
    this.name = "EmojiCouldNotBeParsedError";
  }
}
