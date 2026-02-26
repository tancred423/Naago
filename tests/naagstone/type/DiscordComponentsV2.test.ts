import { assertEquals } from "@std/assert";
import type {
  DiscordComponentsV2,
  MediaGalleryComponent,
  SeparatorComponent,
  TextDisplayComponent,
} from "../../../src/naagostone/type/DiscordComponentsV2.ts";

Deno.test("TextDisplayComponent - type conformance", () => {
  const comp: TextDisplayComponent = { type: "textDisplay", content: "Hello" };
  assertEquals(comp.type, "textDisplay");
  assertEquals(comp.content, "Hello");
});

Deno.test("MediaGalleryComponent - type conformance", () => {
  const comp: MediaGalleryComponent = { type: "mediaGallery", urls: ["https://img.com/1.png"] };
  assertEquals(comp.type, "mediaGallery");
  assertEquals(comp.urls.length, 1);
});

Deno.test("SeparatorComponent - type conformance", () => {
  const comp: SeparatorComponent = { type: "separator" };
  assertEquals(comp.type, "separator");
});

Deno.test("DiscordComponentsV2 - holds array of mixed components", () => {
  const data: DiscordComponentsV2 = {
    components: [
      { type: "textDisplay", content: "Text" },
      { type: "mediaGallery", urls: ["https://a.com", "https://b.com"] },
      { type: "separator" },
    ],
  };
  assertEquals(data.components.length, 3);
  assertEquals(data.components[0].type, "textDisplay");
  assertEquals(data.components[1].type, "mediaGallery");
  assertEquals(data.components[2].type, "separator");
});
