export class EmojiCouldNotBeFetchedError extends Error {
  constructor(name: string) {
    super(name);
    this.name = "EmojiCouldNotBeFetchedError";
  }
}
