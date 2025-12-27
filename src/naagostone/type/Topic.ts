import { DiscordComponentsV2 } from "./DiscordComponentsV2.ts";

export interface TopicDescription {
  html: string;
  markdown: string;
  discord_components_v2?: DiscordComponentsV2;
}

export interface TopicEvent {
  type: "Special Event" | "Moogle Treasure Trove";
  from: number;
  to: number;
}

export interface Topic {
  title: string;
  link: string;
  date: number;
  banner: string;
  description: TopicDescription;
  timestamp_live_letter: number | null;
  event: TopicEvent | null;
}

export interface TopicResponse {
  topics: Topic[];
}
