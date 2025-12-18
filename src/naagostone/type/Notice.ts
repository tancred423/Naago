import { DiscordComponentsV2 } from "./DiscordComponentsV2.ts";

export interface NoticeDescription {
  html: string;
  markdown: string;
  discord_components_v2?: DiscordComponentsV2;
}

export interface Notice {
  tag: string | null;
  title: string;
  date: number;
  link: string;
  description: NoticeDescription;
}

export interface NoticeResponse {
  notices: Notice[];
}
