export interface MaintenanceDescription {
  html: string;
  markdown: string;
}

export interface Maintenance {
  tag: string | null;
  title: string;
  date: number;
  link: string;
  description: MaintenanceDescription;
  start_timestamp: number | null;
  end_timestamp: number | null;
}

export interface MaintenanceResponse {
  maintenances: Maintenance[];
}
