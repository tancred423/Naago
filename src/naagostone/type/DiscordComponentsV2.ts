export interface TextDisplayComponent {
  type: "textDisplay";
  content: string;
}

export interface MediaGalleryComponent {
  type: "mediaGallery";
  urls: string[];
}

export interface SeparatorComponent {
  type: "separator";
}

export type DiscordComponentV2 = TextDisplayComponent | MediaGalleryComponent | SeparatorComponent;

export interface DiscordComponentsV2 {
  components: DiscordComponentV2[];
}
