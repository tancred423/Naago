import { DiscordComponentsV2 } from "./DiscordComponentsV2.ts";

export interface StatusDescription {
  html: string;
  markdown: string;
  discord_components_v2?: DiscordComponentsV2;
}

export interface Status {
  tag: string | null;
  title: string;
  date: number;
  link: string;
  description: StatusDescription;
}

export interface StatusResponse {
  statuses: Status[];
}
