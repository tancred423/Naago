import { DiscordComponentsV2 } from "./DiscordComponentsV2.ts";

export interface UpdateDescription {
  html: string;
  markdown: string;
  discord_components_v2?: DiscordComponentsV2;
}

export interface Update {
  title: string;
  date: number;
  link: string;
  description: UpdateDescription;
}

export interface UpdateResponse {
  updates: Update[];
}
