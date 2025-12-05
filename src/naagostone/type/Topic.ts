export interface TopicDescription {
  html: string;
  markdown: string;
}

export interface Topic {
  title: string;
  link: string;
  date: number;
  banner: string;
  description: TopicDescription;
  timestamp_live_letter: number | null;
}

export interface TopicResponse {
  topics: Topic[];
}
